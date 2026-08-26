import { prisma } from '../../db/prisma';
import { RecoveryService } from '../recovery.service';

export class SimulationService {
  private recoveryService = new RecoveryService();

  async simulateBatch(count: number) {
    console.log(`[Simulator] Seeding ${count} synthetic payments into DB...`);
    
    const merchant = await prisma.merchant.create({
      data: { name: 'Demo Merchant' }
    });

    const failureReasons = ['insufficient_balance', 'bank_timeout', 'network_error', 'account_issue', 'invalid_payment_details', 'temporary_bank_error'];
    const methods = ['UPI', 'CARD', 'NETBANKING'];

    const paymentsToEvaluate = [];
    let attemptedRevenue = 0;

    for (let i = 0; i < count; i++) {
      const amount = Math.floor(Math.random() * 5000) + 100;
      attemptedRevenue += amount;
      
      const successRate = Math.random() * 0.5 + 0.5; // 50% to 100%
      const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];

      const customer = await prisma.customer.create({
        data: { merchantId: merchant.id, historySuccessRate: successRate }
      });

      const payment = await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: amount,
          status: 'FAILED',
          attempts: {
            create: { method: method, failureReason: reason }
          }
        }
      });
      paymentsToEvaluate.push(payment.id);
    }

    console.log(`[Simulator] Running ML & Policy evaluation on ${count} cases...`);
    
    let recoveredCount = 0;
    let escalatedCount = 0;
    let messagedCount = 0;
    let recoveredRevenue = 0;
    let totalProb = 0;

    for (const paymentId of paymentsToEvaluate) {
      const result = await this.recoveryService.evaluatePayment(paymentId);
      
      if (result.status === 'PROCESSED' && result.decision) {
         if (result.decision.action === 'RETRY' && result.executionSuccess) {
            recoveredCount++;
            const p = await prisma.payment.findUnique({ where: { id: paymentId } });
            if (p) recoveredRevenue += Number(p.amount);
         } else if (result.decision.action === 'ESCALATE') {
            escalatedCount++;
         } else if (result.decision.action === 'MESSAGE') {
            messagedCount++;
         }
      }
      
      const caseRecord = await prisma.recoveryCase.findFirst({ where: { paymentId: paymentId } });
      if (caseRecord && caseRecord.recoveryProbability) {
          totalProb += caseRecord.recoveryProbability;
      }
    }

    return {
      total_failed: count,
      evaluated: count,
      recovered_payments: recoveredCount,
      escalated: escalatedCount,
      messaged: messagedCount,
      recovery_rate: recoveredCount / count,
      attempted_revenue: attemptedRevenue,
      recovered_revenue: recoveredRevenue,
      average_probability: totalProb / count
    };
  }
}
