import { getRecoveryCase } from '../../../lib/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let caseData = null;
  try {
    const { id } = await params;
    caseData = await getRecoveryCase(id);
  } catch (e) {
    return <div className="p-8 text-red-500 font-medium">Failed to load case details</div>;
  }

  const payment = caseData.payment;
  const attempts = payment.attempts || [];
  const lastAttempt = attempts[attempts.length - 1];
  const aiGeneratedEvent = caseData.auditEvents.find((e: any) => e.event === 'AI_RECOMMENDATION_GENERATED');
  const policyEvent = caseData.auditEvents.find((e: any) => e.event === 'POLICY_EVALUATED');
  const aiRejectedEvent = caseData.auditEvents.find((e: any) => e.event === 'AI_RECOMMENDATION_REJECTED');

  const aiRec = aiGeneratedEvent?.details?.recommendation;
  const policyDecision = policyEvent?.details?.decision;

  const isOverride = !!aiRejectedEvent;

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/cases" className="flex items-center gap-2 text-[14px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight ml-2">Case Details</h1>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide uppercase border ${
          caseData.status === 'RECOVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 
          caseData.status === 'ESCALATED' ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-white text-gray-700 border-gray-200 shadow-sm'
        }`}>
          {caseData.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Facts */}
        <div className="space-y-6 lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex-1">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">Payment Facts</h2>
            <dl className="space-y-4 text-[13px]">
              <div>
                <dt className="text-gray-500 mb-1">Amount</dt>
                <dd className="font-semibold text-gray-900">Rs. {payment.amount}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Method</dt>
                <dd className="font-semibold text-gray-900">{lastAttempt?.method || 'NETBANKING'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Failure Reason</dt>
                <dd className="font-semibold text-red-600">{lastAttempt?.failureReason || 'unknown'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">Retry Count</dt>
                <dd className="font-semibold text-gray-900">{Math.max(attempts.length - 1, 0)}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">ML Prediction</h2>
            <div className="text-[32px] font-bold text-blue-600 leading-none mb-1">
              {caseData.recoveryProbability ? (caseData.recoveryProbability * 100).toFixed(1) + '%' : 'N/A'}
            </div>
            <div className="text-[12px] font-medium text-gray-500">Recovery Probability</div>
          </div>
        </div>

        {/* Right Column - Intelligence & Decision */}
        <div className="space-y-6 lg:col-span-8">
          
          <div className={`rounded-[14px] shadow-sm border p-6 ${isOverride ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-[16px] font-bold flex items-center gap-3 text-gray-900">
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-[6px] uppercase tracking-wider font-bold">AI</span> 
                  Recommendation
               </h2>
               {isOverride && <span className="bg-orange-100 text-orange-700 text-[10px] px-2.5 py-1 rounded-[6px] font-bold uppercase tracking-wide border border-orange-200/50">Rejected by Policy</span>}
            </div>
            
            {aiRec ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4 text-[14px]">
                  <div className="font-medium text-gray-600">Action: <span className="font-bold text-gray-900 ml-1">{aiRec.recommended_action}</span></div>
                  <div className="text-gray-400 font-medium ml-2">Confidence: {(aiRec.confidence * 100).toFixed(0)}%</div>
                </div>
                
                <div className="bg-[#FAFAFA] p-4 rounded-xl border border-gray-100">
                  <div className="text-[11px] text-gray-400 mb-2 uppercase font-bold tracking-widest">AI Rationale</div>
                  <div className="text-[13px] font-medium text-gray-600 italic leading-relaxed">&quot;{aiRec.reason}&quot;</div>
                </div>

                {aiRec.customer_message && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                    <div className="text-[11px] text-blue-500 mb-2 uppercase font-bold tracking-widest">Generated Message</div>
                    <div className="text-[13px] font-medium text-blue-900 leading-relaxed">&quot;{aiRec.customer_message}&quot;</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[13px] text-gray-500 font-medium italic">No AI recommendation generated (Fallback triggered or Fatal Error).</div>
            )}
          </div>

          <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6">
             <h2 className="text-[16px] font-bold flex items-center gap-3 text-gray-900 mb-6">
                <span className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded-[6px] uppercase tracking-wider font-bold">Policy Engine</span> 
                Authoritative Decision
             </h2>
             
             {policyDecision ? (
                <div className="space-y-4 text-[14px]">
                  <div className="flex items-center gap-2">
                     <div className="font-medium text-gray-600">Final Action:</div>
                     <div className="font-bold text-gray-900">{policyDecision.action}</div>
                  </div>
                  <div>
                     <div className="font-medium text-gray-600 mb-2">Policy Rationale:</div>
                     <div className="bg-[#FAFAFA] p-4 rounded-xl border border-gray-100 text-[13px] font-medium text-gray-700">
                       {policyDecision.reason}
                     </div>
                  </div>
                </div>
             ) : (
                <div className="text-[13px] text-gray-500 font-medium italic">Policy decision pending or failed.</div>
             )}
          </div>

        </div>
      </div>

      {/* Audit Timeline */}
      <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-[16px] font-bold text-gray-900 mb-8">Audit Timeline</h2>
        <div className="space-y-0 ml-4">
          {caseData.auditEvents.map((event: any, i: number) => (
            <div key={event.id} className="flex gap-6 relative">
              <div className="w-24 shrink-0 text-[12px] font-medium text-gray-400 text-right mt-0.5">
                {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toLowerCase()}
              </div>
              <div className="relative flex-1 pb-8 border-l-2 border-gray-100 pl-6 last:border-l-transparent last:pb-0">
                <div className="absolute w-2.5 h-2.5 bg-gray-300 rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                <div className="text-[13px] font-bold text-gray-900">{event.event}</div>
                {Object.keys(event.details || {}).length > 0 && (
                  <pre className="mt-3 bg-[#FAFAFA] p-4 rounded-xl text-[11px] font-medium text-gray-600 overflow-x-auto border border-gray-100/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
