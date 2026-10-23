import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Users,
  ShieldCheck,
  Wrench,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({ isOpen, onClose }) => {
  const { switchRole, currentRole, showToast, setActiveTab } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'citizen');

  if (!isOpen) return null;

  const roles: {
    id: UserRole;
    title: string;
    personaName: string;
    organization: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
    colorBorder: string;
    accentBg: string;
    targetTab: string;
  }[] = [
    {
      id: 'citizen',
      title: 'Citizen / Reporter',
      personaName: 'Elena Rostova',
      organization: 'Civic Community Contributor',
      description: 'Upload photographs of potholes, review instant AI damage segmentation, pin GPS coordinates, and follow live repair progress.',
      badge: 'Public Reporting',
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      colorBorder: 'border-cyan-500/50 hover:border-cyan-400',
      accentBg: 'bg-cyan-500/10 text-cyan-400',
      targetTab: 'citizen',
    },
    {
      id: 'authority',
      title: 'Municipal Authority',
      personaName: 'Marcus Vance',
      organization: 'Department of Transportation',
      description: 'Validate AI road defect triage, merge duplicate citizen submissions, assign work orders to paving fleets, and enforce repair SLAs.',
      badge: 'Operational Control',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      colorBorder: 'border-emerald-500/50 hover:border-emerald-400',
      accentBg: 'bg-emerald-500/10 text-emerald-400',
      targetTab: 'command',
    },
    {
      id: 'maintenance',
      title: 'Maintenance Crew',
      personaName: 'David Chen',
      organization: 'Central Rapid Asphalt Paving Unit',
      description: 'View dispatched road repairs on mobile, navigate to coordinates, start on-site compaction, and upload before/after proof.',
      badge: 'Field Operations',
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      colorBorder: 'border-amber-500/50 hover:border-amber-400',
      accentBg: 'bg-amber-500/10 text-amber-400',
      targetTab: 'maintenance',
    },
    {
      id: 'superadmin',
      title: 'Super Administrator',
      personaName: 'Sarah Jenkins',
      organization: 'Infrastructure Systems Command',
      description: 'Manage computer vision thresholds, configure map API keys, review municipal audit trails, and export open infrastructure datasets.',
      badge: 'Full Governance',
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      colorBorder: 'border-purple-500/50 hover:border-purple-400',
      accentBg: 'bg-purple-500/10 text-purple-400',
      targetTab: 'command',
    },
  ];

  const handleSelectRole = (role: UserRole, targetTab: string) => {
    setSelectedRole(role);
    switchRole(role);
    setActiveTab(targetTab);
    showToast(`Signed in as ${role.toUpperCase()} · Welcome to RoadGuard AI!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select Your Role to Enter
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Choose your identity below to launch the matching dashboard. You can switch between roles at any time from the top navigation bar.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {roles.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleSelectRole(r.id, r.targetTab)}
                className={`p-4 rounded-xl border bg-slate-900/90 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? `${r.colorBorder} bg-slate-900 ring-2 ring-cyan-500/40 shadow-lg`
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${r.accentBg}`}>
                        {r.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {r.title}
                        </h3>
                        <div className="text-[11px] text-slate-400">
                          {r.personaName} · <span className="text-slate-500">{r.organization}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                  <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded ${r.accentBg}`}>
                    {r.badge}
                  </span>

                  <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-800/80">
          <span className="font-mono text-[11px]">
            Demo Authentication Engine · Pre-authenticated for immediate evaluation
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors underline font-medium"
          >
            Continue as Guest / Close
          </button>
        </div>
      </div>
    </div>
  );
};
