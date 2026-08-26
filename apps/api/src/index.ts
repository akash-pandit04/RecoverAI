import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PaymentEvent } from '@recoverai/shared';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

import { recoveryRouter } from './recovery/recovery.routes';

app.use(cors());
app.use(express.json());

app.use('/api/recovery', recoveryRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
