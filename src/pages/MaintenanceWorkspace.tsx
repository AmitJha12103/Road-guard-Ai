import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RoadIssue } from '../types';
import {
  Wrench,
  Navigation,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  AlertTriangle,
  Play,
  FileCheck,
  X,
  ExternalLink,
} from 'lucide-react';

const REPAIRED_SAMPLE_IMG = '/src/assets/images/repaired_smooth_asphalt_1791542528669.jpg';
const CREW_SAMPLE_IMG = '/src/assets/images/road_repair_crew_1791542513670.jpg';

export const MaintenanceWorkspace: React.FC = () => {
  const { setSelectedIssueId, setActiveTab, showToast, currentUser } = useApp();

  const [assignedIssues, setAssignedIssues] = useState<RoadIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Submit Evidence Modal
  const [evidenceModalIssue, setEvidenceModalIssue] = useState<RoadIssue | null>(null);
  const [repairNotes, setRepairNotes] = useState<string>('Sawcut 50mm perimeter, removed loose aggregate, applied tack coat bitumen binder, filled with HMA-19 and compacted with 2.5T vibratory roller.');
  const [materialsUsed, setMaterialsUsed] = useState<string>('Hot-Mix Asphalt Type II (350 kg), Bitumen Tack Coat (12 L)');
  const [afterImagePreview, setAfterImagePreview] = useState<string>(REPAIRED_SAMPLE_IMG);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.getMaintenanceAssignments();
      setAssignedIssues(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading crew assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleStartWork = async (issueId: string) => {
    try {
      const res = await api.startRepair(issueId, currentUser?.name || 'David Chen');
      if (res.data) {
        showToast('Work order started. On-site status broadcasted.');
        loadAssignments();
      }
    } catch {
      showToast('Could not initiate work order.');
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceModalIssue) return;
    try {
      const res = await api.submitRepairEvidence(evidenceModalIssue.id, {
        notes: repairNotes,
        materials: materialsUsed,
        after_image_url: afterImagePreview,
        before_image_url: evidenceModalIssue.primary_image_url,
        actor_name: currentUser?.name || 'David Chen',
      });
      if (res.data) {
        showToast('Repair photographic evidence submitted for supervisor sign-off!');
        setEvidenceModalIssue(null);
        loadAssignments();
      }
    } catch {
      showToast('Failed to submit repair evidence.');
    }
  };

  const handleResolveDirectly = async (issueId: string) => {
    try {
      const res = await api.resolveIssue(issueId, currentUser?.name || 'David Chen', 'Supervisor verified completed repair on site.');
      if (res.data) {
        showToast('Issue certified closed!');
        loadAssignments();
      }
    } catch {
      showToast('Failed to certify closure.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            Mobile Field Work Order Queue
          </div>
          <h1 className="text-2xl font-bold text-white">Maintenance Crew Workspace</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet: <strong className="text-slate-200">{currentUser?.department || 'Central Rapid Asphalt Paving Unit'}</strong> · Supervisor: Marcus Vance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#0b1120] border border-cyan-500/20 text-cyan-300">
            <strong>{assignedIssues.length}</strong> Assigned Tasks in Queue
          </span>
        </div>
      </div>

      {/* Field Crew Banner */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-5 shadow-xl">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-800">
          <img src={CREW_SAMPLE_IMG} alt="Paving crew" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1 flex-1 text-center md:text-left">
          <h2 className="text-sm font-bold text-white">Standard Compaction Policy (IRC:SP:98-2020)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All asphalt pothole patches require mechanical square saw-cutting, subgrade clearing, tack coat application, and minimum 95% Marshall compaction. Photographic proof of after-repair tamped surface is mandatory prior to supervisor sign-off.
          </p>
        </div>
      </div>

      {/* Assigned Issues Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>Active Assigned Work Orders (Priority Sorted)</span>
        </h2>

        {assignedIssues.length === 0 ? (
          <div className="p-8 text-center bg-[#0b1120] border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No pending repairs assigned to this team currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedIssues.map((iss) => (
              <div
                key={iss.id}
                className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl hover:border-cyan-500/30 transition-colors"
              >
                {/* Reference, Severity, Priority */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      {iss.public_reference}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{iss.road_name}</h3>
                    <p className="text-xs text-slate-400">{iss.locality}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-white">
                      Priority {iss.priority_score}
                    </span>
                    <div className="text-[10px] uppercase font-semibold text-red-400">
                      {iss.severity} · {iss.priority_tier}
                    </div>
                  </div>
                </div>

                {/* Photo & GPS */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={iss.primary_image_url}
                    alt={iss.road_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                    GPS: {iss.latitude.toFixed(4)}, {iss.longitude.toFixed(4)}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-950/90 border border-slate-800 text-slate-200">
                    Status: {iss.issue_status.replace('_', ' ')}
                  </div>
                </div>

                {/* Road Context and Hazards */}
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    Hazards: <strong>{iss.hazard_types.length > 0 ? iss.hazard_types.join(', ').replace(/_/g, ' ') : 'Standard road defect'}</strong>
                  </div>
                  {iss.due_at && (
                    <div className="text-[11px] text-amber-400">
                      Target Deadline: {new Date(iss.due_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${iss.latitude},${iss.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Navigate</span>
                  </a>

                  <div className="flex items-center gap-2">
                    {iss.issue_status === 'assigned' && (
                      <button
                        onClick={() => handleStartWork(iss.id)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {iss.issue_status === 'in_progress' && (
                      <button
                        onClick={() => setEvidenceModalIssue(iss)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Submit Repair Proof</span>
                      </button>
                    )}

                    {iss.issue_status === 'repair_submitted' && (
                      <button
                        onClick={() => handleResolveDirectly(iss.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Certify Closed</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedIssueId(iss.id);
                        setActiveTab('issue_detail');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      File
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Repair Evidence Modal */}
      {evidenceModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Upload Pothole Patch Evidence</span>
              </h3>
              <button onClick={() => setEvidenceModalIssue(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="font-mono text-cyan-400 font-bold">{evidenceModalIssue.public_reference}</div>
              <div className="font-bold text-white mt-0.5">{evidenceModalIssue.road_name}</div>
            </div>

            {/* After Photo Preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                After-Compaction Photographic Evidence:
              </label>
              <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                <img
                  src={afterImagePreview}
                  alt="Repaired asphalt"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-cyan-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  VERIFIED REPAIRED SURFACE
                </div>
              </div>
            </div>

            {/* Field Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Compaction Notes &amp; Subgrade Treatment:
              </label>
              <textarea
                rows={2}
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Materials Used */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Asphalt Material &amp; Binder Tonnage:
              </label>
              <input
                type="text"
                value={materialsUsed}
                onChange={(e) => setMaterialsUsed(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEvidenceModalIssue(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEvidence}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow transition-colors"
              >
                Submit for Supervisor Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
