import { describe, it, expect, vi } from 'vitest';
import { getDashboardMetrics, runSimulation } from './index';

describe('API Client', () => {
  it('should fetch dashboard metrics successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ paymentsEvaluated: 10, recoveryRate: 0.5 })
    });

    const metrics = await getDashboardMetrics();
    expect(metrics.paymentsEvaluated).toBe(10);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/recovery/dashboard/metrics'), expect.any(Object));
  });

  it('should throw error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    await expect(getDashboardMetrics()).rejects.toThrow('Failed to fetch metrics');
  });

  it('should run simulation correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ evaluated: 100, recovered_payments: 50 })
    });

    const result = await runSimulation(100);
    expect(result.recovered_payments).toBe(50);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/recovery/simulate'), 
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ count: 100 }) })
    );
  });
});
