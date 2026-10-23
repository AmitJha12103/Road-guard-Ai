import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CitizenReport, RoadIssue } from '../types';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Bell,
  Eye,
  FileText,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { setActiveTab, setSelectedIssueId, showToast, currentUser } = useApp();
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [repRes, issRes] = await Promise.all([api.getReports(), api.getIssues()]);
        setReports(repRes.data || []);
        setIssues(issRes.data || []);
      } catch (err) {
        console.error('Error loading citizen portal data:', err);
        showToast('Could not load reports.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Mini-map of user's reports
  useEffect(() => {
    if (!miniMapRef.current || issues.length === 0) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(miniMapRef.current, {
      center: [28.59, 77.20],
      zoom: 11,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    issues.slice(0, 10).forEach((iss) => {
      L.marker([iss.latitude, iss.longitude])
        .addTo(map)
        .bindPopup(`<strong>${iss.road_name}</strong><br/>Status: ${iss.issue_status}`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [issues]);

  const submittedCount = reports.length;
  const underRepairCount = issues.filter((i) => i.issue_status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.issue_status === 'resolved').length;
  const pendingCount = issues.filter((i) => ['submitted', 'ai_analyzed', 'awaiting_verification'].includes(i.issue_status)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            Citizen Action Hub
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome, {currentUser?.name || 'Citizen Reporter'}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Track your submitted road hazards, review automated AI bounding boxes, and follow live progress as municipal teams patch your community roads.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('report')}
          className="px-5 py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Pothole</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Total Reports Submitted</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{submittedCount}</div>
          <div className="text-[11px] text-slate-500">Citizen submissions</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Awaiting Municipal Review</div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">{pendingCount}</div>
          <div className="text-[11px] text-slate-500">In triage queue</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Under Active Repair</div>
          <div className="text-2xl font-bold font-mono text-orange-400 tabular-nums">{underRepairCount}</div>
          <div className="text-[11px] text-slate-500">Crews on-site</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Repaired &amp; Certified</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{resolvedCount}</div>
          <div className="text-[11px] text-slate-500">Verified asphalt seal</div>
        </div>
      </div>

      {/* Split Grid: My Reports Table + Mini Map & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reports Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Your Reported Road Hazards</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">{reports.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Road &amp; Locality</th>
                  <th className="py-2.5 px-3">AI Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.slice(0, 8).map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">
                      {rep.public_reference}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{rep.road_name}</div>
                      <div className="text-[11px] text-slate-400">{rep.locality}</div>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      <span
                        className={`font-semibold ${
                          rep.estimated_severity === 'critical'
                            ? 'text-red-400'
                            : rep.estimated_severity === 'high'
                            ? 'text-orange-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {rep.estimated_severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 capitalize">
                        {rep.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {rep.issue_id && (
                        <button
                          onClick={() => {
                            setSelectedIssueId(rep.issue_id!);
                            setActiveTab('issue_detail');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                        >
                          View File
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Map & Notifications (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Map Preview */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geographic Spread</span>
              </span>
              <button
                onClick={() => setActiveTab('map')}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                Expand Map
              </button>
            </div>
            <div className="h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div ref={miniMapRef} className="w-full h-full" />
            </div>
          </div>

          {/* Activity Notifications */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Civic Updates</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-cyan-400 font-semibold">
                  <span>Repair Certified Complete</span>
                  <span className="text-slate-500 font-mono">1h ago</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Lodi Gardens Access Boulevard pothole marked repaired by Central Rapid Paving Unit.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-amber-400 font-semibold">
                  <span>Work Order Dispatched</span>
                  <span className="text-slate-500 font-mono">4h ago</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Mehrauli-Badarpur Corridor scheduled for hot-mix asphalt filling within 48h.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                  <span>Duplicate Report Merged</span>
                  <span className="text-slate-500 font-mono">Yesterday</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Your report for Barakhamba Ave was grouped with 2 nearby citizen submissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
