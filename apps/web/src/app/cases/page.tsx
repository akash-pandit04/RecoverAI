import { getRecoveryCases } from '../../lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  let cases = [];
  try {
    cases = await getRecoveryCases();
  } catch (e) {
    return <div className="text-red-500">Failed to load cases</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Recovery Cases</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ML Prob</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((c: any) => {
              const lastAction = c.actions[c.actions.length - 1]?.actionType || 'NONE';
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{c.paymentId.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{c.payment.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {c.recoveryProbability ? (c.recoveryProbability * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${lastAction === 'RETRY' ? 'bg-green-100 text-green-800' : 
                      lastAction === 'MESSAGE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {lastAction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/cases/${c.id}`} className="text-blue-600 hover:text-blue-900">Details</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {cases.length === 0 && (
          <div className="p-8 text-center text-gray-500">No cases found. Run a simulation first.</div>
        )}
      </div>
    </div>
  );
}
