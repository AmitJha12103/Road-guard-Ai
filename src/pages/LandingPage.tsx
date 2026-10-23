import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  MapPin,
  Clock,
  Layers,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';

const HERO_IMG = '/src/assets/images/hero_road_inspection_1791542479083.jpg';
const DAMAGED_IMG = '/src/assets/images/pothole_crater_damaged_1791542493436.jpg';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useApp();
  const [showDetectionOverlay, setShowDetectionOverlay] = useState(true);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 border-b border-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Municipal Road Intelligence Platform</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400">Civic Infrastructure v2.4</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
                Every Pothole Has a Story. Let&apos;s Fix It.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Empowering citizens and municipal authorities with real-time computer vision detection,
                automated severity triage, and end-to-end repair lifecycle tracking.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('report')}
                  className="px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20 text-sm whitespace-nowrap"
                >
                  <span>Report a Pothole</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className="px-6 py-3 rounded-xl bg-[#0b1120] border border-cyan-500/30 text-slate-200 font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Explore Live Road Map</span>
                </button>
              </div>

              {/* Tagline note */}
              <div className="pt-4 flex items-center gap-3 text-xs text-slate-400">
                <span>Detect Smarter</span>
                <span aria-hidden="true">·</span>
                <span>Report Faster</span>
                <span aria-hidden="true">·</span>
                <span>Repair Roads Better</span>
              </div>
            </div>

            {/* Right Visual Column (Interactive AI Detection Preview) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-cyan-500/30 bg-[#0b1120] overflow-hidden shadow-2xl">
                <div className="p-3 bg-[#0b1120] border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>RoadGuard-Vision-YOLOv8</span>
                  </div>
                  <button
                    onClick={() => setShowDetectionOverlay(!showDetectionOverlay)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>{showDetectionOverlay ? 'Hide Overlays' : 'Show Bounding Box'}</span>
                  </button>
                </div>

                <div className="relative aspect-[4/3] bg-slate-950">
                  <img
                    src={HERO_IMG}
                    alt="Inspection photo of asphalt road with pothole damage"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Bounding Box Detection Overlay */}
                  {showDetectionOverlay && (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/15 pointer-events-none transition-all duration-300"
                      style={{
                        top: '46%',
                        left: '32%',
                        width: '38%',
                        height: '34%',
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-t font-semibold flex items-center gap-1 shadow">
                        <span>POTHOLE · 94.8% CONF</span>
                      </div>
                      <div className="absolute -bottom-5 right-0 bg-slate-950/90 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono border border-slate-800">
                        EST. SEVERITY: CRITICAL
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#0b1120] space-y-2 text-xs border-t border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target: Road Pavement Cavity</span>
                    <span className="font-mono text-cyan-400">Status: Verified Hazard</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Coordinates: 28.5912° N, 77.1615° E</span>
                    <span>Triage Tier: Urgent Action (Priority 92/100)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demonstration Notice Strip */}
          <div className="mt-12 p-3.5 rounded-xl bg-[#0b1120] border border-cyan-500/20 flex items-center gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <p>
              <strong className="text-slate-200">Demonstration Platform:</strong> All community statistics,
              GPS pins, and AI detection previews are generated using calibrated synthetic and demonstration datasets.
              No fabricated claims are represented as real municipal work orders.
            </p>
          </div>
        </div>
      </section>

      {/* Demonstration Key Metrics Strip */}
      <section className="py-12 bg-[#0b1120]/40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Demo Monitored Issues</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-white">32 Issues</div>
              <div className="text-[11px] text-cyan-400 mt-1">Across 4 municipal sectors</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Median Verification Time</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400">3.4 Hours</div>
              <div className="text-[11px] text-slate-400 mt-1">Simulated operational benchmark</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Duplicate Grouping Rate</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-white">78% Consolidated</div>
              <div className="text-[11px] text-slate-400 mt-1">Haversine 50m spatial cluster</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Median Resolution Turnaround</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-white">28.5 Hours</div>
              <div className="text-[11px] text-slate-400 mt-1">Work order to supervisor seal</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">The 4-Step Road Maintenance Pipeline</h2>
            <p className="text-sm text-slate-400 mt-2">
              From civic observation to asphalt compaction, every phase is logged in an immutable audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="text-base font-semibold text-white">Citizen Image Upload</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Snap a road defect photo and confirm the GPS pin. The system validates EXIF metadata and provides manual coordinate adjustments.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="text-base font-semibold text-white">Computer Vision AI Triage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The inference engine segments crater boundaries, calculates surface ratio, flags alligator cracking, and estimates initial severity.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="text-base font-semibold text-white">Authority Dispatch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transportation supervisors review flagged hazards, merge duplicate complaints into single work orders, and assign repair crews.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="text-base font-semibold text-white">Certified Closure</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Field teams upload after-repair photographic evidence and compaction records. Supervisors certify final closure with public tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Severity Classification System */}
      <section className="py-16 border-b border-slate-900 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">Severity Classification Standards</h2>
            <p className="text-sm text-slate-400 mt-2">
              Visual damage indicators calibrated against municipal highway maintenance thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#0b1120] border border-red-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Level 4 · Critical</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="text-sm font-semibold text-white">High Immediate Hazard</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extensive road-surface cavity (&gt;60mm depth) with sharp jagged rim, standing water, or located in high-speed wheel paths.
              </p>
              <div className="text-[11px] text-red-300 font-mono pt-2">Urgent 24h Action Queue</div>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-orange-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Level 3 · High</span>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              </div>
              <div className="text-sm font-semibold text-white">Significant Pavement Failure</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Large cavity causing vehicle suspension impact or near junctions, school zones, and heavy transit corridors.
              </p>
              <div className="text-[11px] text-orange-300 font-mono pt-2">Expedited 48h Inspection</div>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Level 2 · Moderate</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-sm font-semibold text-white">Noticeable Surface Defect</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clearly visible surface erosion with surrounding alligator cracking; causes driving discomfort but low acute hazard.
              </p>
              <div className="text-[11px] text-amber-300 font-mono pt-2">Scheduled Maintenance Queue</div>
            </div>

            <div className="p-5 rounded-xl bg-[#0b1120] border border-yellow-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Level 1 · Low</span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              </div>
              <div className="text-sm font-semibold text-white">Minor Surface Cavity</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Superficial asphalt chipping with stable subgrade; minor cosmetic wear on residential or low-traffic streets.
              </p>
              <div className="text-[11px] text-yellow-300 font-mono pt-2">Routine District Resurfacing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Priority Scoring Engine Explanation */}
      <section className="py-16 border-b border-slate-900 bg-[#0b1120]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Algorithmic Priority Score (0–100)</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Instead of treating complaints in random order, RoadGuard dynamically balances five transparent risk factors to direct maintenance dollars where they save the most lives and vehicle damage.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1120] border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">1. AI Visual Severity</span>
                  <span className="font-mono text-cyan-400 font-bold">40% Weight</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1120] border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">2. Road Corridor & Hazard Context</span>
                  <span className="font-mono text-cyan-400 font-bold">20% Weight</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1120] border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">3. Independent Citizen Reports</span>
                  <span className="font-mono text-cyan-400 font-bold">15% Weight</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1120] border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">4. Unresolved Age Escalation</span>
                  <span className="font-mono text-cyan-400 font-bold">15% Weight</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1120] border border-slate-800 text-xs">
                  <span className="font-medium text-slate-200">5. Confirmed Recurring Failure</span>
                  <span className="font-mono text-cyan-400 font-bold">10% Weight</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0b1120] border border-cyan-500/20 space-y-4">
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Example Real-Time Calculation</div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-slate-300">Target: Mehrauli-Badarpur Arterial Highway</div>
                <div className="text-cyan-400">Severity: Critical (40 pts)</div>
                <div className="text-cyan-400">Context: Arterial + Standing Water (18 pts)</div>
                <div className="text-cyan-400">Reports: 3 independent citizens (12 pts)</div>
                <div className="text-cyan-400">Time Unresolved: 5 days (14 pts)</div>
                <div className="text-cyan-400">Recurrence: Previously patched (10 pts)</div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                  <span>TOTAL SCORE:</span>
                  <span className="text-red-400">94 / 100 (TIER: URGENT)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scores escalate deadlines automatically. When an issue reaches Tier 1 (Urgent), supervisors receive priority alerts and work order dispatch is expedited.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white tracking-tight mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <h3 className="text-sm font-semibold text-white">Does the AI officially verify that road damage exists?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                No. The AI provides operational triage and bounding box suggestions. Official verification requires confirmation from designated municipal authority reviewers or certified field inspectors.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <h3 className="text-sm font-semibold text-white">How does duplicate detection prevent multiple map pins?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                RoadGuard runs spatial distance queries using a calibrated 20–50 meter corridor radius. When multiple citizens report the same crater, individual reports are linked into a single consolidated Road Issue with aggregated voter counters.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0b1120] border border-slate-800">
              <h3 className="text-sm font-semibold text-white">What if my smartphone photo does not have GPS coordinates?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                You can easily pin the exact location on our interactive map or use browser location with explicit permission. We never fabricate coordinates for unlocated reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#070b14] border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-slate-300">RoadGuard AI Platform</div>
            <div>Civic Technology for Smarter, Faster, Safer Road Infrastructure.</div>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => setActiveTab('map')} className="hover:text-white transition-colors">
              Live Map
            </button>
            <button onClick={() => setActiveTab('analytics')} className="hover:text-white transition-colors">
              Open Data
            </button>
            <button onClick={() => setActiveTab('command')} className="hover:text-white transition-colors">
              Authority Desk
            </button>
          </div>
          <div className="text-slate-600">
            © 2026 RoadGuard Systems. Demonstration Mode Active.
          </div>
        </div>
      </footer>
    </div>
  );
};
