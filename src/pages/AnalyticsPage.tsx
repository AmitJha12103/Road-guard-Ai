import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RoadHealthScore, RoadIssue } from '../types';
import {
  Activity,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { setSelectedIssueId, setActiveTab, showToast } = useApp();

  const [healthScores, setHealthScores] = useState<RoadHealthScore[]>([]);
  const [recurringIssues, setRecurringIssues] = useState<RoadIssue[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [healthRes, issRes, anaRes] = await Promise.all([
          api.getRoadHealthScores(),
          api.getIssues(),
          api.getAnalyticsSummary(),
        ]);
        setHealthScores(healthRes.data || []);
        const recurring = (issRes.data || []).filter((i: RoadIssue) => i.is_recurring);
        setRecurringIssues(recurring);
        setAnalytics(anaRes.data || null);
      } catch (err) {
        console.error('Error loading analytics:', err);
        showToast('Failed to load open-data telemetry.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            Civic Transparency &amp; Open Infrastructure Data
          </div>
          <h1 className="text-2xl font-bold text-white">Road Network Health &amp; Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Public metrics on pavement degradation, recurrence frequency, and municipal repair turnaround.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/v1/admin/export"
            download
            className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Open Dataset (CSV)</span>
          </a>
        </div>
      </div>

      {/* Demonstration Data Banner */}
      <div className="p-3.5 rounded-xl bg-[#0b1120] border border-cyan-500/20 flex items-center gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <p>
          <strong className="text-slate-200">Open Data Demonstration:</strong> This dataset reflects synthetic and calibrated
          demonstration road inspections across the metropolitan corridor. Personal reporter identifiers (emails, phone numbers)
          are completely excluded from public open data feeds.
        </p>
      </div>

      {/* Road Health Index Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Network Health Score</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">74.2 / 100</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Composite index calculated from defect density, hazard severity, recurrence rate, and verified closures.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recurring Failure Rate</span>
            <RotateCcw className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-red-400 tabular-nums">
            {recurringIssues.length} Recurring Spots
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Potholes that reappeared at the same coordinates within 180 days of an official asphalt repair patch.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1120] border border-slate-800 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Repair SLA</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">28.5 Hours</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Elapsed duration between municipal work order authorization and field crew asphalt compaction.
          </p>
        </div>
      </div>

      {/* Road Health Score by Sector Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Corridor Health Index by Municipal Ward</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Formula: 100 - (12×Unresolved + 18×Critical) + 10×Repaired</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Ward / Locality</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Condition Rating</th>
                <th className="py-2.5 px-3">Active Hazards</th>
                <th className="py-2.5 px-3">Certified Repaired</th>
                <th className="py-2.5 px-3 text-right">Assessment Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {healthScores.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{h.locality}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${
                            h.score >= 80 ? 'bg-cyan-400' : h.score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${h.score}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-200">{h.score}/100</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 uppercase text-[11px] font-bold">
                    <span
                      className={
                        h.status === 'good'
                          ? 'text-cyan-400'
                          : h.status === 'fair'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{h.active_potholes} active</td>
                  <td className="py-3 px-3 text-cyan-400 font-mono">{h.repaired_count} completed</td>
                  <td className="py-3 px-3 text-right text-slate-500 font-mono">{h.last_assessment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recurring Potholes Section */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-400" />
            <span>Recurring Pavement Failure Watchlist</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Road segments where repairs have failed prematurely, requiring deep base drainage reassessment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringIssues.map((iss) => (
            <div key={iss.id} className="p-4 rounded-xl bg-slate-950 border border-red-950 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-mono text-cyan-400 font-bold">{iss.public_reference}</span>
                <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold uppercase">
                  Recurrence #{iss.recurrence_count || 2}
                </span>
              </div>
              <div className="font-semibold text-white">{iss.road_name}</div>
              <div className="text-slate-400">{iss.locality}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                Previous repairs on record: {iss.previous_repairs_count || 1}
              </div>
              <button
                onClick={() => {
                  setSelectedIssueId(iss.id);
                  setActiveTab('issue_detail');
                }}
                className="w-full mt-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-[11px] transition-colors"
              >
                Inspect Repair History
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
