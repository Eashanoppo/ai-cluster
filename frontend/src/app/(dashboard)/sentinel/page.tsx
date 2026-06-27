import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Bell, History } from 'lucide-react';
import { SentinelChart } from '../../components/ui/Chart';
import { getPredictions, getAlerts } from '../../services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SentinelPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value;

  if (!token) {
    redirect('/login');
  }

  // Fetch predictions and alerts concurrently
  const [predictions, alerts] = await Promise.all([
    getPredictions().catch(() => []),
    getAlerts().catch(() => [])
  ]);

  const safePredictions = Array.isArray(predictions) ? predictions : ((predictions as any).results || []);
  const safeAlerts = Array.isArray(alerts) ? alerts : ((alerts as any).results || []);

  const activeAlerts = safeAlerts.filter((a: any) => !a.resolved);
  const resolvedAlerts = safeAlerts.filter((a: any) => a.resolved);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-serif leading-none tracking-tight">Sentinel Alert Dashboard</h2>
          <p className="text-xs text-gray-500 mt-1.5">GPU Anomaly Detection & Thermal Failure Forecasting</p>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 bg-red-50 text-red-500 rounded-xl border border-red-100 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            {activeAlerts.length} Active Warnings
          </span>
        </div>
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Charts & Predictions Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Thermal Failure Forecast Timeline
            </h3>
            <div className="h-72">
              {safePredictions.length > 0 ? (
                <SentinelChart data={safePredictions} />
              ) : (
                <div className="h-full flex items-center justify-center font-mono text-xs text-gray-400">AWAITING TELEMETRY...</div>
              )}
            </div>
          </div>

          {/* Historical Predictions Log */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              Observability Tick Predictions (Last 50)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-mono uppercase tracking-wider text-[9px] pb-2">
                    <th className="py-2.5">Timestamp</th>
                    <th className="py-2.5">Node</th>
                    <th className="py-2.5">Failure Prob</th>
                    <th className="py-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-gray-600">
                  {safePredictions.map((pred: any) => {
                    const pct = Math.round(pred.failure_probability * 100);
                    return (
                      <tr key={pred.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-[10px] text-gray-400">
                          {new Date(pred.predicted_at).toLocaleString()}
                        </td>
                        <td className="py-3 font-bold text-gray-800">{pred.node_id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                            pct >= 80 
                              ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' 
                              : pct >= 50 
                                ? 'bg-amber-50 text-amber-500 border-amber-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 text-[11px] font-serif max-w-[200px] truncate text-gray-500" title={pred.reason}>
                          {pred.reason}
                        </td>
                      </tr>
                    );
                  })}
                  {safePredictions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-mono text-xs">No prediction history sync.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) - System Alerts & Resolved Feed */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Hardware Warnings */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Active Hardware Alerts
            </h3>
            <div className="space-y-3">
              {activeAlerts.map((alert: any) => (
                <div key={alert.id} className="p-3.5 bg-red-50 border border-red-100 rounded-xl space-y-1 font-mono text-xs">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-red-500">
                    <span>{alert.severity}</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm font-serif mt-1">{alert.node_id}</p>
                  <p className="text-[11px] text-red-600 leading-relaxed mt-1">{alert.message}</p>
                </div>
              ))}
              {activeAlerts.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-mono text-xs uppercase flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
                  All GPUs Nominal
                </div>
              )}
            </div>
          </div>

          {/* Resolved Alert History */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col h-[350px] overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex-shrink-0 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Resolved Cooldown Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {resolvedAlerts.map((alert: any) => (
                <div key={alert.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 uppercase">
                    <span>COOLDOWN COMPLETE</span>
                    <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="font-bold text-gray-800 font-serif">{alert.node_id}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {resolvedAlerts.length === 0 && (
                <p className="text-center font-mono text-xs text-gray-400 py-16">No resolved alert history.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
