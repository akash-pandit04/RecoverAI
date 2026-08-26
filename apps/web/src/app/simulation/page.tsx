'use client';

import { useState } from 'react';
import { runSimulation } from '../../lib/api';
import { PlaySquare, Settings, Play, CreditCard, TrendingUp, Brain, CheckCircle2, AlertTriangle, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SimulationPage() {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runSimulation(count);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="max-w-[1280px] mx-auto pb-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <PlaySquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">Run Recovery Simulation</h1>
          </div>
          <p className="text-gray-500 text-[14px]">Generate synthetic failed payments and evaluate the ML/AI pipeline in a sandboxed environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <h2 className="text-[15px] font-bold text-gray-900">Configuration</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 mb-6">
                <p className="text-[13px] text-indigo-900/80 leading-relaxed font-medium">
                  This tool will inject <strong className="text-indigo-700">{count}</strong> synthetic failed payments into the database and immediately run them through the full prediction and policy pipeline.
                </p>
              </div>
              
              <div className="mb-8">
                <label className="block text-[13px] font-bold text-gray-700 mb-2">Number of Payments to Simulate</label>
                <input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#FAFAFA] border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  min="1"
                  max="500"
                />
                <p className="text-[11px] text-gray-400 mt-2 font-medium">Max 500 payments per simulation batch.</p>
              </div>

              <button 
                onClick={handleSimulate}
                disabled={loading || count < 1 || count > 500}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-indigo-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing {count} payments...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Demo Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-[13px] font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {result ? (
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-[15px] font-bold text-gray-900">Simulation Complete</h2>
                </div>
                <Link href="/cases" className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-indigo-600 border border-indigo-100/50 bg-indigo-50/50 rounded-[8px] hover:bg-indigo-50 transition-colors">
                  View Cases <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              <div className="p-6 flex-1 bg-[#FAFAFA]/50">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">Evaluated</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{result.evaluated}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">Recovered</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{result.recovered_payments}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">Recovery Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{(result.recovery_rate * 100).toFixed(1)}%</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Brain className="w-4 h-4 text-orange-500" />
                      <span className="text-[11px] font-bold tracking-wide uppercase">Avg Prob</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{(result.average_probability * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold text-gray-500 mb-1">Attempted Revenue</div>
                      <div className="text-xl font-bold text-gray-900">₹{formatINR(result.attempted_revenue)}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-lg">₹</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
                    <div>
                      <div className="text-[12px] font-bold text-gray-500 mb-1">Recovered Revenue</div>
                      <div className="text-xl font-bold text-emerald-600">₹{formatINR(result.recovered_revenue)}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold text-lg">₹</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-red-500">
                    <div>
                      <div className="text-[12px] font-bold text-gray-500 mb-1">Escalated Payments</div>
                      <div className="text-xl font-bold text-red-600">{result.escalated}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                      <div className="text-[12px] font-bold text-gray-500 mb-1">Messaged Customers</div>
                      <div className="text-xl font-bold text-blue-600">{result.messaged}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[14px] shadow-sm border border-gray-200 border-dashed h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <PlaySquare className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Ready to Simulate</h3>
              <p className="text-[13px] text-gray-500 max-w-sm">Configure your simulation parameters on the left and click run to generate synthetic recovery cases and evaluate the pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
