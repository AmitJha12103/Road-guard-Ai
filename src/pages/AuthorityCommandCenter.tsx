import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RoadIssue, MaintenanceTeam, SeverityLevel, IssueStatus } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  X,
  Send,
  Eye,
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

export const AuthorityCommandCenter: React.FC = () => {
  const { setSelectedIssueId, setActiveTab, showToast, currentUser } = useApp();

  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeam[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Assign Team Modal State
  const [assignModalIssue, setAssignModalIssue] = useState<RoadIssue | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team_central');
  const [deadlineDays, setDeadlineDays] = useState<number>(3);
  const [assignNotes, setAssignNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [issRes, teamsRes, anaRes] = await Promise.all([
        api.getIssues(),
        api.getMaintenanceTeams(),
        api.getAnalyticsSummary(),
      ]);
      setIssues(issRes.data || []);
      setTeams(teamsRes.data || []);
      setAnalytics(anaRes.data || null);
    } catch (err) {
      console.error(err);
      showToast('Error loading authority command records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (issueId: string) => {
    try {
      const res = await api.verifyIssue(issueId, currentUser?.name || 'Marcus Vance');
      if (res.data) {
        showToast(`Issue ${res.data.public_reference} officially verified!`);
        loadData();
      }
    } catch {
      showToast('Verification failed.');
    }
  };

  const handleReject = async (issueId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    try {
      const res = await api.rejectIssue(issueId, reason, currentUser?.name || 'Marcus Vance');
      if (res.data) {
        showToast('Issue marked rejected.');
        loadData();
      }
    } catch {
      showToast('Rejection failed.');
    }
  };

  const handleConfirmAssignment = async () => {
    if (!assignModalIssue) return;
    try {
      const res = await api.assignTeam(
        assignModalIssue.id,
        selectedTeamId,
        deadlineDays,
        currentUser?.name || 'Marcus Vance'
      );
      if (res.data) {
        showToast(`Work order assigned to ${res.data.assigned_team_name}!`);
        setAssignModalIssue(null);
        loadData();
      }
    } catch {
      showToast('Team assignment failed.');
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && i.issue_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.road_name.toLowerCase().includes(q) ||
        i.locality.toLowerCase().includes(q) ||
        i.public_reference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unresolvedCount = issues.filter((i) => i.issue_status !== 'resolved' && i.issue_status !== 'rejected').length;
  const criticalAwaiting = issues.filter((i) => i.severity === 'critical' && i.issue_status !== 'resolved').length;
  const underRepair = issues.filter((i) => i.issue_status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.issue_status === 'resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            Department of Transportation Operations Desk
          </div>
          <h1 className="text-2xl font-bold text-white">Authority Command Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Triage AI road damage detections, authorize work orders, allocate paving fleets, and verify repair certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/v1/admin/export"
            download
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-colors border border-cyan-500/30 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </a>
        </div>
      </div>

      {/* High-Density KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Unresolved</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white mt-0.5">{unresolvedCount}</div>
          <div className="text-[10px] text-slate-500">Active municipal work</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-red-900/40">
          <div className="text-[11px] text-red-400 font-semibold">Critical Hazards</div>
          <div className="text-xl font-bold font-mono tabular-nums text-red-400 mt-0.5">{criticalAwaiting}</div>
          <div className="text-[10px] text-red-300">Urgent 24h response</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800">
          <div className="text-[11px] text-slate-400">Under Repair</div>
          <div className="text-xl font-bold font-mono tabular-nums text-orange-400 mt-0.5">{underRepair}</div>
          <div className="text-[10px] text-slate-500">Crews mobilized</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800">
          <div className="text-[11px] text-slate-400">Repaired &amp; Certified</div>
          <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">{resolvedCount}</div>
          <div className="text-[10px] text-slate-500">Verified closures</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800">
          <div className="text-[11px] text-slate-400">Median Verification</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-200 mt-0.5">3.4h</div>
          <div className="text-[10px] text-slate-500">SLA benchmark &lt;6h</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0b1120] border border-slate-800">
          <div className="text-[11px] text-slate-400">Median Repair SLA</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-200 mt-0.5">28.5h</div>
          <div className="text-[10px] text-slate-500">Target 48h</div>
        </div>
      </div>

      {/* Operational Analytics Visualizations (Recharts) */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Trends (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Monthly Reported vs Repaired Potholes (2026)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Trend Telemetry</span>
            </div>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrends}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1120', borderColor: '#06b6d4', fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="reported" fill="#f97316" name="Reported" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="repaired" fill="#06b6d4" name="Repaired" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Breakdown Pie (5 cols) */}
          <div className="lg:col-span-5 bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Damage Severity Breakdown
            </h3>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.severityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {analytics.severityBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b1120', borderColor: '#06b6d4', fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Data Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        {/* Table Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by road, locality, or reference..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Hazard</option>
              <option value="high">High Severity</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low Severity</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="repair_submitted">Repair Evidence Submitted</option>
              <option value="resolved">Certified Closed</option>
            </select>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Showing <strong>{filteredIssues.length}</strong> of {issues.length} operational records
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Corridor &amp; Locality</th>
                <th className="py-2.5 px-3">Priority Score</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned Fleet</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-normal">
              {filteredIssues.map((iss) => (
                <tr key={iss.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-cyan-400 whitespace-nowrap">
                    {iss.public_reference}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{iss.road_name}</div>
                    <div className="text-[11px] text-slate-400">{iss.locality}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-white">
                      {iss.priority_score} / 100
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        iss.priority_tier === 'urgent'
                          ? 'text-red-400'
                          : iss.priority_tier === 'high'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {iss.priority_tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 capitalize whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        iss.severity === 'critical'
                          ? 'text-red-400'
                          : iss.severity === 'high'
                          ? 'text-orange-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {iss.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 capitalize">
                      {iss.issue_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    {iss.assigned_team_name ? (
                      <span className="text-white font-medium">{iss.assigned_team_name}</span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                    {/* Verify button if awaiting review */}
                    {['submitted', 'ai_analyzed', 'awaiting_verification'].includes(iss.issue_status) && (
                      <button
                        onClick={() => handleVerify(iss.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-semibold transition-colors"
                        title="Confirm issue validity"
                      >
                        Verify
                      </button>
                    )}

                    {/* Assign Fleet button */}
                    <button
                      onClick={() => {
                        setAssignModalIssue(iss);
                        setSelectedTeamId(iss.assigned_team_id || teams[0]?.id || 'team_central');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      title="Dispatch maintenance team"
                    >
                      Dispatch
                    </button>

                    {/* View File */}
                    <button
                      onClick={() => {
                        setSelectedIssueId(iss.id);
                        setActiveTab('issue_detail');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Maintenance Fleet Modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Dispatch Maintenance Crew</span>
              </h3>
              <button onClick={() => setAssignModalIssue(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-mono text-[11px]">{assignModalIssue.public_reference}</div>
              <div className="font-bold text-white">{assignModalIssue.road_name}</div>
              <div className="text-slate-400">{assignModalIssue.locality}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Resurfacing / Paving Unit:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.active_jobs_count} active jobs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Completion SLA Window:</label>
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>24 Hours (Urgent Hazard)</option>
                <option value={2}>48 Hours (High Priority)</option>
                <option value={3}>72 Hours (Standard Inspection)</option>
                <option value={7}>7 Days (Routine Corridor Queue)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssignModalIssue(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow transition-colors"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
