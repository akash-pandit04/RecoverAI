import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { RecoveryService } from '../recovery/recovery.service';

export const webhookRouter = Router();
const recoveryService = new RecoveryService();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';

webhookRouter.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyString = JSON.stringify(req.body);

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    if (expectedSignature !== signature && process.env.NODE_ENV === 'production') {
       return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body.id || crypto.randomUUID();

    // Idempotency check
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { eventId }
    });

    if (existingWebhook) {
      return res.status(200).json({ status: 'ignored', reason: 'Already processed' });
    }

    await prisma.webhookEvent.create({
      data: {
        eventId,
        payload: req.body,
        processed: true
      }
    });

    if (event === 'payment.failed') {
      const paymentEntity = req.body.payload?.payment?.entity;
      if (paymentEntity) {
        // Create or update customer
        const customerId = paymentEntity.customer_id || 'cust_anonymous';
        let customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
           // We need a dummy merchant
           let merchant = await prisma.merchant.findFirst();
           if (!merchant) {
             merchant = await prisma.merchant.create({ data: { name: 'Demo Merchant' }});
           }
           customer = await prisma.customer.create({
             data: {
               id: customerId,
               merchantId: merchant.id,
               historySuccessRate: 0.8
             }
           });
        }

        // Create Payment
        const payment = await prisma.payment.create({
          data: {
            id: paymentEntity.id,
            customerId: customer.id,
            amount: (paymentEntity.amount / 100).toFixed(2),
            status: 'FAILED'
          }
        });

        // Create Attempt
        await prisma.paymentAttempt.create({
          data: {
            paymentId: payment.id,
            method: paymentEntity.method || 'card',
            failureReason: paymentEntity.error_code || 'unknown_error'
          }
        });

        // Trigger Evaluation asynchronously
        recoveryService.evaluatePayment(payment.id).catch(err => {
          console.error('[Webhook] Failed to evaluate payment:', err);
        });
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook Error]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
