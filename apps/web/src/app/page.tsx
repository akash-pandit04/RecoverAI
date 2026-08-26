import { TrendingUp, Calendar, Play, CreditCard, Brain, Info, Lock, ArrowRight, Shield, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getDashboardMetrics, getRecoveryCases } from '../lib/api';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let metrics;
  let cases: any[] = [];
  try {
    metrics = await getDashboardMetrics();
    cases = await getRecoveryCases();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    // Fallback defaults if API is down
    metrics = {
      paymentsEvaluated: 0,
      paymentsRecovered: 0,
      recoveryRate: 0,
      attemptedRevenue: 0,
      recoveredRevenue: 0,
      actions: { retry: 0, message: 0, escalate: 0 },
      averageRecoveryProbability: 0
    };
  }

  const totalActions = metrics.actions.retry + metrics.actions.message + metrics.actions.escalate;
  const retryPct = totalActions > 0 ? (metrics.actions.retry / totalActions) * 100 : 0;
  const msgPct = totalActions > 0 ? (metrics.actions.message / totalActions) * 100 : 0;
  const escPct = totalActions > 0 ? (metrics.actions.escalate / totalActions) * 100 : 0;
  
  // Format numbers to match Indian numbering system (e.g. 1,15,362)
  const formatINR = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-orange-600 bg-orange-50 border-orange-100/50';
      case 'RECOVERED': return 'text-emerald-600 bg-emerald-50 border-emerald-100/50';
      case 'ESCALATED': return 'text-red-500 bg-red-50 border-red-100/50';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };
  
  const getFailureReason = (c: any) => {
    if (c.payment?.attempts && c.payment.attempts.length > 0) {
      return c.payment.attempts[0].failureReason || 'unknown_error';
    }
    return 'unknown_error';
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Overview</h1>
          </div>
          <p className="text-gray-500 text-[14px]">Monitor AI-powered recovery performance</p>
        </div>
        <div className="flex items-center gap-4">

          <Link href="/simulation" className="flex items-center gap-2 px-5 py-2 bg-indigo-600 rounded-lg text-[13px] font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors">
            <Play className="w-[14px] h-[14px] fill-current" />
            Run Simulation
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5 relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <div className="text-[13px] font-semibold text-gray-500">Revenue Recovered</div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-lg">₹</span>
            </div>
          </div>
          <div className="text-[28px] font-bold text-gray-900 mb-2.5">₹{formatINR(metrics.recoveredRevenue)}</div>

          <div className="text-[11px] font-medium text-gray-500 pt-3 border-t border-gray-100/80">Attempted: ₹{formatINR(metrics.attemptedRevenue)}</div>
        </div>

        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-[13px] font-semibold text-gray-500">Payments Recovered</div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-gray-900 mb-2.5">{metrics.paymentsRecovered}</div>

          <div className="text-[11px] font-medium text-gray-500 pt-3 border-t border-gray-100/80">Evaluated: {metrics.paymentsEvaluated}</div>
        </div>

        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-[13px] font-semibold text-gray-500">Recovery Rate</div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-gray-900 mb-2.5">{(metrics.recoveryRate * 100).toFixed(1)}%</div>

          <div className="text-[11px] font-medium text-gray-500 pt-3 border-t border-gray-100/80">(Recovered Payments ÷ Evaluated)</div>
        </div>

        <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="text-[13px] font-semibold text-gray-500">Avg ML Probability</div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-gray-900 mb-2.5">{(metrics.averageRecoveryProbability * 100).toFixed(1)}%</div>

          <div className="text-[11px] font-medium text-gray-500 pt-3 border-t border-gray-100/80">Overall prediction average</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Action Distribution */}
        <div className="lg:col-span-5 bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-1.5 mb-8">
            <h2 className="text-[15px] font-bold text-gray-900">Action Distribution</h2>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex items-center justify-between mb-auto px-4">
            <div className="relative w-36 h-36">
              {/* Donut chart dynamically colored. Note: fallback if totalActions is 0 */}
              <div className="absolute inset-0 rounded-full" 
                   style={{ background: totalActions > 0 ? `conic-gradient(#ef4444 0% ${escPct}%, #3b82f6 ${escPct}% ${escPct+msgPct}%, #10b981 ${escPct+msgPct}% 100%)` : '#e5e7eb' }}></div>
              <div className="absolute inset-[14px] bg-white rounded-full flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-900 leading-tight">{totalActions}</div>
                <div className="text-[10px] font-semibold text-gray-500">Total Actions</div>
              </div>
            </div>
            
            <div className="flex-1 ml-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Retry
                </div>
                <div className="text-[13px] font-medium text-gray-500">{metrics.actions.retry} ({retryPct.toFixed(1)}%)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Message
                </div>
                <div className="text-[13px] font-medium text-gray-500">{metrics.actions.message} ({msgPct.toFixed(1)}%)</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div> Escalate
                </div>
                <div className="text-[13px] font-medium text-gray-500">{metrics.actions.escalate} ({escPct.toFixed(1)}%)</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-[#FAFAFA] rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-0.5">Recovery Rate</div>
              <div className="text-[18px] font-bold text-emerald-500">{(metrics.recoveryRate * 100).toFixed(1)}%</div>
            </div>
            <div className="h-10 w-24">
              <svg viewBox="0 0 100 40" className="w-full h-full text-emerald-500 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M0 30 L20 25 L40 28 L60 15 L80 20 L100 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Recovery Pipeline */}
        <div className="lg:col-span-7 bg-white rounded-[14px] shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center gap-1.5 mb-10">
            <h2 className="text-[15px] font-bold text-gray-900">Recovery Pipeline</h2>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex-1 flex items-center justify-between relative px-2">
            <div className="flex flex-col items-center flex-1 text-center relative z-10">
              <div className="w-14 h-14 bg-white border-2 border-green-100 rounded-xl flex items-center justify-center mb-4 shadow-sm relative">
                <Brain className="w-6 h-6 text-green-600" />
                <div className="absolute -bottom-2.5 w-5 h-5 bg-green-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">1</div>
              </div>
              <div className="text-[12px] font-bold text-green-600 mb-1 leading-tight">ML Prediction</div>
              <div className="text-[10px] font-medium text-gray-500 max-w-[90px] leading-snug">Evaluates probability of recovery</div>
            </div>

            <div className="text-gray-300 font-bold tracking-widest text-[16px] z-0 mb-12 w-10 text-center">----&gt;</div>

            <div className="flex flex-col items-center flex-1 text-center relative z-10">
              <div className="w-14 h-14 bg-white border-2 border-blue-100 rounded-xl flex items-center justify-center mb-4 shadow-sm relative">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <div className="absolute -bottom-2.5 w-5 h-5 bg-blue-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">2</div>
              </div>
              <div className="text-[12px] font-bold text-blue-600 mb-1 leading-tight">AI Recommendation</div>
              <div className="text-[10px] font-medium text-gray-500 max-w-[90px] leading-snug">Proposes next best action</div>
            </div>

            <div className="text-gray-300 font-bold tracking-widest text-[16px] z-0 mb-12 w-10 text-center">----&gt;</div>

            <div className="flex flex-col items-center flex-1 text-center relative z-10">
              <div className="w-14 h-14 bg-white border-2 border-purple-100 rounded-xl flex items-center justify-center mb-4 shadow-sm relative">
                <Shield className="w-6 h-6 text-purple-600" />
                <div className="absolute -bottom-2.5 w-5 h-5 bg-purple-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">3</div>
              </div>
              <div className="text-[12px] font-bold text-purple-600 mb-1 leading-tight">Policy Validation</div>
              <div className="text-[10px] font-medium text-gray-500 max-w-[90px] leading-snug">Enforces deterministic business rules</div>
            </div>

            <div className="text-gray-300 font-bold tracking-widest text-[16px] z-0 mb-12 w-10 text-center">----&gt;</div>

            <div className="flex flex-col items-center flex-1 text-center relative z-10">
              <div className="w-14 h-14 bg-white border-2 border-orange-100 rounded-xl flex items-center justify-center mb-4 shadow-sm relative">
                <Zap className="w-6 h-6 text-orange-500" />
                <div className="absolute -bottom-2.5 w-5 h-5 bg-orange-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">4</div>
              </div>
              <div className="text-[12px] font-bold text-orange-500 mb-1 leading-tight">Recovery Action</div>
              <div className="text-[10px] font-medium text-gray-500 max-w-[90px] leading-snug">Simulated execution (Retry/Message)</div>
            </div>

            <div className="text-gray-300 font-bold tracking-widest text-[16px] z-0 mb-12 w-10 text-center">----&gt;</div>

            <div className="flex flex-col items-center flex-1 text-center relative z-10">
              <div className="w-14 h-14 bg-white border-2 border-green-100 rounded-xl flex items-center justify-center mb-4 shadow-sm relative">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div className="absolute -bottom-2.5 w-5 h-5 bg-green-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">5</div>
              </div>
              <div className="text-[12px] font-bold text-green-600 mb-1 leading-tight">Outcome</div>
              <div className="text-[10px] font-medium text-gray-500 max-w-[90px] leading-snug">Recovered or Escalated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">Recent Recovery Cases</h2>
          <Link href="/cases" className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-indigo-600 border border-indigo-100/50 bg-indigo-50/50 rounded-[8px] hover:bg-indigo-50 transition-colors">
            View all cases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#FAFAFA] border-b border-gray-100 text-gray-900 font-bold">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Payment ID</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Amount</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Failure Reason</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">ML Probability</th>
                <th className="px-5 py-3.5 whitespace-nowrap">AI Recommendation</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Policy Decision</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Action Taken</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Outcome</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.slice(0, 10).map((c: any) => {
                const prob = c.recoveryProbability || 0;
                let probColor = 'bg-emerald-500';
                if (prob < 0.3) probColor = 'bg-red-500';
                else if (prob < 0.6) probColor = 'bg-orange-500';

                const lastAction = c.actions && c.actions.length > 0 ? c.actions[c.actions.length - 1].actionType : 'NONE';
                let actionColor = 'text-gray-500';
                if (lastAction === 'RETRY') actionColor = 'text-emerald-600';
                if (lastAction === 'MESSAGE') actionColor = 'text-blue-600';
                if (lastAction === 'ESCALATE') actionColor = 'text-red-500';

                const outcome = c.status;
                const outcomeClass = getStatusColor(outcome);
                
                const failureReason = getFailureReason(c);
                
                // Extract real AI recommendation and policy decision from audit events
                const aiEvent = c.auditEvents?.find((e: any) => e.event === 'AI_RECOMMENDATION_GENERATED' || e.event === 'AI_RECOMMENDATION_REJECTED');
                const policyEvent = c.auditEvents?.find((e: any) => e.event === 'POLICY_EVALUATED');
                
                let aiRec = 'AI UNAVAILABLE';
                if (aiEvent?.details?.recommendation?.recommended_action) {
                   aiRec = `${aiEvent.details.recommendation.recommended_action} (${(aiEvent.details.recommendation.confidence || 0).toFixed(2)})`;
                } else if (aiEvent?.details?.aiAction) {
                   aiRec = `${aiEvent.details.aiAction} (N/A)`;
                }

                let policyDec = 'NOT REACHED';
                if (policyEvent?.details?.decision) {
                   policyDec = policyEvent.details.decision.allowed ? 'APPROVED' : 'REJECTED';
                }
                
                let aiColor = 'text-gray-500';
                if (aiRec.includes('RETRY')) aiColor = 'text-emerald-600';
                if (aiRec.includes('MESSAGE')) aiColor = 'text-blue-600';
                if (aiRec.includes('ESCALATE')) aiColor = 'text-red-500';

                const policyColor = policyDec === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-red-50 text-red-600 border-red-100/50';

                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-indigo-600 cursor-pointer">pay_{c.paymentId.substring(0, 8)}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">₹{formatINR(Number(c.payment?.amount || 0))}</td>
                    <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-red-50 text-red-600 truncate max-w-[150px] inline-block">{failureReason}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-gray-700">
                        <div className={`w-1.5 h-1.5 rounded-full ${probColor}`}></div>
                        {prob.toFixed(2)}
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-bold ${aiColor} text-[10.5px]`}>{aiRec}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold border ${policyColor}`}>
                        {policyDec}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-bold ${actionColor} text-center text-[10.5px]`}>{lastAction}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${outcomeClass}`}>
                        {outcome}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-500 whitespace-nowrap">
                      {new Date(c.auditEvents?.[0]?.timestamp || Date.now()).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-gray-500 font-medium">No recovery cases found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-gray-400 mt-6 mb-2">
        <Lock className="w-3.5 h-3.5 text-gray-300" />
        RecoverAI uses AI and deterministic rules to maximize revenue recovery while ensuring customer trust and safety.
      </div>
    </div>
  );
}
