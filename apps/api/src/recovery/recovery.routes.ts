import { Router } from 'express';
import { RecoveryService } from './recovery.service';
import { SimulationService } from './simulation/simulator';
import { prisma } from '../db/prisma';

export const recoveryRouter = Router();
const recoveryService = new RecoveryService();
const simulationService = new SimulationService();

recoveryRouter.post('/evaluate/:paymentId', async (req, res) => {
  try {
    const result = await recoveryService.evaluatePayment(req.params.paymentId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

recoveryRouter.post('/simulate', async (req, res) => {
  try {
    const count = parseInt(req.body.count || '50', 10);
    if (isNaN(count) || count < 1 || count > 500) {
      return res.status(400).json({ error: 'Simulation count must be between 1 and 500.' });
    }
    const metrics = await simulationService.simulateBatch(count);
    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

recoveryRouter.get('/cases', async (req, res) => {
  try {
    const cases = await prisma.recoveryCase.findMany({
      include: {
        payment: {
          include: { attempts: { orderBy: { timestamp: 'asc' } } }
        },
        actions: { orderBy: { timestamp: 'asc' } },
        auditEvents: { orderBy: { timestamp: 'asc' } }
      },
      take: 50,
      orderBy: { id: 'desc' }
    });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

recoveryRouter.get('/cases/:id', async (req, res) => {
  try {
    const caseData = await prisma.recoveryCase.findUnique({
      where: { id: req.params.id },
      include: {
        payment: { include: { attempts: { orderBy: { timestamp: 'asc' } } } },
        actions: { orderBy: { timestamp: 'asc' } },
        auditEvents: { orderBy: { timestamp: 'asc' } },
        modelPredictions: { orderBy: { timestamp: 'asc' } }
      }
    });
    if (!caseData) return res.status(404).json({ error: 'Not found' });
    res.json(caseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

recoveryRouter.get('/dashboard/metrics', async (req, res) => {
  try {
    const cases = await prisma.recoveryCase.findMany({
      include: {
        payment: true,
        actions: { orderBy: { timestamp: 'asc' } }
      }
    });

    let paymentsEvaluated = cases.length;
    let paymentsRecovered = 0;
    let attemptedRevenue = 0;
    let recoveredRevenue = 0;
    let retry = 0;
    let message = 0;
    let escalate = 0;
    let totalProb = 0;

    cases.forEach(c => {
      const amt = Number(c.payment.amount);
      attemptedRevenue += amt;
      totalProb += (c.recoveryProbability || 0);

      if (c.status === 'RECOVERED') {
         paymentsRecovered++;
         recoveredRevenue += amt;
      }

      const lastAction = c.actions[c.actions.length - 1];
      if (lastAction) {
         if (lastAction.actionType === 'RETRY') retry++;
         if (lastAction.actionType === 'MESSAGE') message++;
         if (lastAction.actionType === 'ESCALATE') escalate++;
      }
    });

    res.json({
      paymentsEvaluated,
      paymentsRecovered,
      recoveryRate: paymentsEvaluated > 0 ? (paymentsRecovered / paymentsEvaluated) : 0,
      attemptedRevenue,
      recoveredRevenue,
      actions: { retry, message, escalate },
      averageRecoveryProbability: paymentsEvaluated > 0 ? (totalProb / paymentsEvaluated) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
});
