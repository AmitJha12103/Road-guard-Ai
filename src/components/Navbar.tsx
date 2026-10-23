import React from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, Globe, Shield, Key, Users } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    switchRole,
    language,
    toggleLanguage,
    currentUser,
    setIsLoginModalOpen,
    setIsMapKeyModalOpen,
  } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/95 backdrop-blur-md border-b border-cyan-500/20">
      {/* Top Bar Contract: Zone 1 (Brand wordmark) — Zone 2 (4-5 nav links) — Zone 3 (1 primary action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab('landing')}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] inline-block" />
          <span className="tracking-wide">RoadGuard AI</span>
        </button>

        {/* Zone 2: 4–5 single-line clean nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('landing')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'landing' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'map' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('citizen')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'citizen' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Citizen Portal
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'command' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Authority Center
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'maintenance' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Field Crew
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeTab === 'analytics' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Transparency
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('report')}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Pothole</span>
          </button>
        </div>
      </div>

      {/* Role & Operational Quick Bar (Discrete Sub-Bar) */}
      <div className="bg-[#0b1120] border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors text-[11px] font-semibold"
          >
            <Users className="w-3 h-3 text-cyan-400" />
            <span>Switch Role</span>
          </button>

          <span className="text-slate-500">·</span>

          <span className="text-slate-400 text-[11px]">
            Active Role: <strong className="text-cyan-300 uppercase">{currentRole}</strong>
          </span>

          {currentUser && (
            <span className="hidden sm:inline text-slate-400 text-[11px]">
              ({currentUser.name})
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Map API Key & Tile settings launcher */}
          <button
            onClick={() => setIsMapKeyModalOpen(true)}
            className="flex items-center gap-1 hover:text-cyan-300 text-slate-400 transition-colors text-[11px]"
            title="Configure Map Tile Providers and API Keys"
          >
            <Key className="w-3 h-3 text-cyan-400" />
            <span>Map Layers &amp; Key</span>
          </button>

          <span className="text-slate-600">·</span>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors text-[11px]"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{language === 'en' ? 'English (EN)' : 'हिन्दी (HI)'}</span>
          </button>

          <span className="text-slate-600">·</span>

          <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Demo Data Mode</span>
          </span>
        </div>
      </div>
    </header>
  );
};
