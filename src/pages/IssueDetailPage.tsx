import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RoadIssue, SeverityLevel } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ThumbsUp,
  AlertTriangle,
  Share2,
  ShieldCheck,
  Cpu,
  Layers,
  Wrench,
  X,
  FileCheck,
} from 'lucide-react';

const SEVERITY_COLORS: Record<SeverityLevel, { hex: string; label: string; textClass: string }> = {
  critical: { hex: '#EF4444', label: 'Level 4: Critical Hazard', textClass: 'text-red-500' },
  high: { hex: '#F97316', label: 'Level 3: High Failure', textClass: 'text-orange-500' },
  moderate: { hex: '#F59E0B', label: 'Level 2: Moderate Deterioration', textClass: 'text-amber-500' },
  low: { hex: '#EAB308', label: 'Level 1: Minor Surface Chipping', textClass: 'text-yellow-400' },
  unclassified: { hex: '#64748B', label: 'Unclassified', textClass: 'text-slate-400' },
};

export const IssueDetailPage: React.FC = () => {
  const { selectedIssueId, setSelectedIssueId, setActiveTab, currentRole, showToast } = useApp();
  const [issue, setIssue] = useState<RoadIssue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Before & After comparison slider state (0 to 100%)
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // False-positive feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackReason, setFeedbackReason] = useState<string>('shadow_mistaken');
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');

  // Map ref
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fetchIssue = async () => {
    if (!selectedIssueId) return;
    try {
      setLoading(true);
      const res = await api.getIssueById(selectedIssueId);
      if (res.data) {
        setIssue(res.data);
      }
    } catch (err) {
      console.error('Error fetching issue detail:', err);
      showToast('Could not load issue file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [selectedIssueId]);

  // Mini Leaflet Map
  useEffect(() => {
    if (!issue || !miniMapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(miniMapRef.current, {
      center: [issue.latitude, issue.longitude],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.marker([issue.latitude, issue.longitude]).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [issue]);

  const handleVote = async (type: 'still_present' | 'appears_repaired') => {
    if (!issue) return;
    try {
      const res = await api.voteIssue(issue.id, type);
      if (res.data) {
        setIssue(res.data);
        showToast(type === 'still_present' ? 'Confirmed pothole still exists.' : 'Marked as apparently repaired.');
      }
    } catch {
      showToast('Vote recording failed.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!issue) return;
    try {
      await api.submitFalsePositiveFeedback({
        issue_id: issue.id,
        reporter_id: 'citizen_reviewer',
        reason: feedbackReason as any,
        notes: feedbackNotes,
      });
      setShowFeedbackModal(false);
      showToast('Feedback logged for AI model re-training.');
    } catch {
      showToast('Feedback failed to submit.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm">Retrieving road inspection records...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Road Issue Selected</h2>
        <p className="text-xs text-slate-400">Please choose an issue from the Live Map or Citizen Portal.</p>
        <button
          onClick={() => setActiveTab('map')}
          className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs shadow"
        >
          Return to Map
        </button>
      </div>
    );
  }

  const timelineSteps = [
    { key: 'reported', label: 'Reported', completed: true },
    { key: 'ai_analyzed', label: 'AI Analyzed', completed: true },
    {
      key: 'verified',
      label: 'Verified',
      completed: ['verified', 'assigned', 'in_progress', 'repair_submitted', 'resolved'].includes(issue.issue_status),
    },
    {
      key: 'assigned',
      label: 'Assigned',
      completed: ['assigned', 'in_progress', 'repair_submitted', 'resolved'].includes(issue.issue_status),
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      completed: ['in_progress', 'repair_submitted', 'resolved'].includes(issue.issue_status),
    },
    {
      key: 'repair_submitted',
      label: 'Repaired',
      completed: ['repair_submitted', 'resolved'].includes(issue.issue_status),
    },
    { key: 'resolved', label: 'Certified Closed', completed: issue.issue_status === 'resolved' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header / Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Map</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[#0b1120] border border-cyan-500/30 text-cyan-400 font-bold">
            {issue.public_reference}
          </span>
          <span className="text-xs text-slate-400 capitalize">
            Status: <strong className="text-white">{issue.issue_status.replace('_', ' ')}</strong>
          </span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              showToast('Issue reference copied to clipboard!');
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Share Issue"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Visuals & Inspection vs Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visuals & Before-After Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Inspection Canvas */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Surface Photographic Inspection</span>
              <button
                onClick={() => setShowOverlays(!showOverlays)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-medium transition-colors"
              >
                {showOverlays ? 'Hide AI Bounding Box' : 'Show AI Bounding Box'}
              </button>
            </div>

            <div className="relative aspect-video bg-slate-950">
              <img
                src={issue.all_images[activeImageIndex] || issue.primary_image_url}
                alt={issue.road_name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Bounding box overlays */}
              {showOverlays &&
                issue.detections.map((det) => (
                  <div
                    key={det.detection_id}
                    className="absolute border-2 border-red-500 bg-red-500/20 transition-all pointer-events-none"
                    style={{
                      left: `${det.bounding_box.x}%`,
                      top: `${det.bounding_box.y}%`,
                      width: `${det.bounding_box.width}%`,
                      height: `${det.bounding_box.height}%`,
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-red-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shadow">
                      {det.class_name.toUpperCase()} · {(det.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>

            {/* Thumbnail selector if multiple images */}
            {issue.all_images.length > 1 && (
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                {issue.all_images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-opacity ${
                      activeImageIndex === idx ? 'border-cyan-400 opacity-100' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Before & After Repair Comparison Slider */}
          {issue.repair_record && (
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Before &amp; After Repair Comparison</span>
                </h3>
                <span className="text-[11px] text-slate-400">Drag slider horizontally</span>
              </div>

              {/* Interactive Split View Slider */}
              <div
                className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 select-none cursor-ew-resize bg-slate-950"
                onMouseMove={(e) => {
                  if (e.buttons === 1) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = ((e.clientX - rect.left) / rect.width) * 100;
                    setSliderPosition(Math.max(0, Math.min(100, pos)));
                  }
                }}
              >
                {/* Repaired Image (Base) */}
                <img
                  src={issue.repair_record.after_image_url}
                  alt="Repaired smooth asphalt"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Damaged Image (Clipped Overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={issue.repair_record.before_image_url}
                    alt="Original pothole damage"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    BEFORE REPAIR
                  </div>
                </div>

                <div className="absolute top-2 right-2 bg-cyan-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  AFTER REPAIR
                </div>

                {/* Slider divider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-bold shadow-lg">
                    ⇄
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-200">Compaction &amp; Material Certification:</div>
                <p className="text-slate-400">{issue.repair_record.repair_notes}</p>
                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Materials: {issue.repair_record.materials_used}
                </div>
              </div>
            </div>
          )}

          {/* Lifecycle Status Timeline */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Repair Lifecycle Progress</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
              {timelineSteps.map((step) => (
                <div
                  key={step.key}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 ${
                    step.completed
                      ? 'border-cyan-500/40 bg-cyan-950/30 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${step.completed ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                  <span className="text-[11px] font-medium leading-tight">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata, Risk Factors & Operational Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Issue Header Info Card */}
          <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Target Corridor</div>
              <h1 className="text-lg font-bold text-white mt-0.5">{issue.road_name}</h1>
              <p className="text-xs text-slate-400">{issue.locality}, {issue.city}</p>
            </div>

            {/* Severity & Priority */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Severity Grade</div>
                <div className={`font-bold capitalize mt-0.5 ${SEVERITY_COLORS[issue.severity]?.textClass}`}>
                  {issue.severity}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-500 text-[11px]">Priority Score</div>
                <div className="font-bold text-white font-mono mt-0.5">
                  {issue.priority_score} / 100 ({issue.priority_tier.toUpperCase()})
                </div>
              </div>
            </div>

            {/* Algorithmic Factor Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                Priority Scoring Factors:
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>AI Visual Severity (40% max):</span>
                  <span className="font-mono text-cyan-400">+{issue.priority_factors.severity_weight} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Road Hierarchy & Hazards (20% max):</span>
                  <span className="font-mono text-cyan-400">+{issue.priority_factors.road_context_weight} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Independent Citizen Reports (15% max):</span>
                  <span className="font-mono text-cyan-400">+{issue.priority_factors.reports_count_weight} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Time Unresolved Age (15% max):</span>
                  <span className="font-mono text-cyan-400">+{issue.priority_factors.time_unresolved_weight} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Confirmed Recurrence (10% max):</span>
                  <span className="font-mono text-cyan-400">+{issue.priority_factors.recurrence_weight} pts</span>
                </div>
              </div>
            </div>

            {/* Geographic Coordinates & Mini Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>GPS Location:</span>
                <span className="font-mono text-slate-300">
                  {issue.latitude.toFixed(5)}° N, {issue.longitude.toFixed(5)}° E
                </span>
              </div>
              <div className="h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <div ref={miniMapRef} className="w-full h-full" />
              </div>
            </div>

            {/* Community Verification Actions */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Community Ground-Truth Verification:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleVote('still_present')}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Still Here ({issue.still_present_votes})</span>
                </button>
                <button
                  onClick={() => handleVote('appears_repaired')}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Repaired ({issue.appears_repaired_votes})</span>
                </button>
              </div>

              <button
                onClick={() => setShowFeedbackModal(true)}
                className="w-full py-1.5 text-center text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Flag incorrect detection (shadow / manhole / marking)
              </button>
            </div>
          </div>

          {/* Audit Trail & History Events */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white">Audit History &amp; Event Log</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {issue.history.map((evt) => (
                <div key={evt.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200">{evt.actor_name}</span>
                    <span className="text-slate-500 font-mono">
                      {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{evt.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* False Positive Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">AI False-Positive Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Help train the RoadGuard vision models. Specify what was mistaken for a road defect:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Category</label>
              <select
                value={feedbackReason}
                onChange={(e) => setFeedbackReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="shadow_mistaken">Tree or building shadow mistaken for crater</option>
                <option value="road_marking">White/yellow lane striping or crosswalk paint</option>
                <option value="manhole_cover">Circular or rectangular utility manhole cover</option>
                <option value="water_puddle">Shallow puddle without underlying structural defect</option>
                <option value="debris">Debris, tire rubber, or gravel patch</option>
                <option value="other">Other visual misclassification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Field Notes</label>
              <textarea
                rows={3}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Describe lighting angle or surface conditions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
