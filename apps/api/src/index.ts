import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PaymentEvent } from '@recoverai/shared';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

import { recoveryRouter } from './recovery/recovery.routes';
import { webhookRouter } from './webhooks/razorpay.routes';

app.use(cors());
// Note: In production, Razorpay signature verification requires raw body, but for this hackathon JSON is fine
app.use(express.json());

app.use('/api/recovery', recoveryRouter);
app.use('/api/webhooks', webhookRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
