const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getDashboardMetrics() {
  const res = await fetch(`${API_BASE_URL}/recovery/dashboard/metrics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function getRecoveryCases() {
  const res = await fetch(`${API_BASE_URL}/recovery/cases`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

export async function getRecoveryCase(id: string) {
  const res = await fetch(`${API_BASE_URL}/recovery/cases/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch case');
  return res.json();
}

export async function runSimulation(count: number) {
  const res = await fetch(`${API_BASE_URL}/recovery/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  });
  if (!res.ok) throw new Error('Failed to run simulation');
  return res.json();
}
