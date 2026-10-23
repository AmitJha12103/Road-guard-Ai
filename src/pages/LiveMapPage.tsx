import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { RoadIssue, SeverityLevel } from '../types';
import {
  Search,
  Filter,
  Navigation,
  ExternalLink,
  ThumbsUp,
  AlertOctagon,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Key,
  Globe,
} from 'lucide-react';

const SEVERITY_COLORS: Record<SeverityLevel, { hex: string; label: string; textClass: string }> = {
  critical: { hex: '#EF4444', label: 'Critical Hazard', textClass: 'text-red-500' },
  high: { hex: '#F97316', label: 'High Severity', textClass: 'text-orange-500' },
  moderate: { hex: '#F59E0B', label: 'Moderate', textClass: 'text-amber-500' },
  low: { hex: '#EAB308', label: 'Low / Minor', textClass: 'text-yellow-400' },
  unclassified: { hex: '#64748B', label: 'Unclassified', textClass: 'text-slate-400' },
};

export const LiveMapPage: React.FC = () => {
  const {
    setActiveTab,
    setSelectedIssueId,
    showToast,
    mapTileProvider,
    mapApiKey,
    setIsMapKeyModalOpen,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [issues, setIssues] = useState<RoadIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<RoadIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);

  // Fetch issues
  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues({
        search: searchQuery || undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        onlyUnresolved,
      });
      setIssues(res.data || []);
    } catch (err) {
      console.error('Failed to load issues for map:', err);
      showToast('Error loading road issues from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [searchQuery, severityFilter, statusFilter, onlyUnresolved]);

  // Helper to get tile URL according to active provider and key
  const getTileConfig = () => {
    if (mapTileProvider === 'osm_standard') {
      return {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      };
    }
    if (mapTileProvider === 'esri_satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        },
      };
    }
    if (mapTileProvider === 'maptiler') {
      const key = mapApiKey || 'get_free_maptiler_key';
      return {
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
        options: {
          attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
          maxZoom: 20,
        },
      };
    }
    // Default: CartoDB Voyager (Keyless, high-resolution, instant visibility)
    return {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.59, 77.20],
      zoom: 12,
      zoomControl: false,
    });

    const tileCfg = getTileConfig();
    const tileLayer = L.tileLayer(tileCfg.url, tileCfg.options).addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer if provider or key changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileCfg = getTileConfig();
    const newTile = L.tileLayer(tileCfg.url, tileCfg.options).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapTileProvider, mapApiKey]);

  // Update map markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    issues.forEach((issue) => {
      const colorInfo = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.unclassified;

      const iconHtml = `
        <div style="
          background-color: ${colorInfo.hex};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 3px 8px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${issue.severity === 'critical' ? '!' : issue.severity === 'high' ? 'H' : issue.reports_count}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-road-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedIssue(issue);
        mapInstanceRef.current?.panTo([issue.latitude, issue.longitude], { animate: true });
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [issues]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 14, { animate: true });
        showToast('Centered map on your current location.');
      },
      (err) => {
        showToast(`Could not access location: ${err.message}`);
      }
    );
  };

  const handleConfirmStillExists = async (issue: RoadIssue) => {
    try {
      const res = await api.voteIssue(issue.id, 'still_present');
      if (res.data) {
        setSelectedIssue(res.data);
        showToast('Confirmation recorded! Priority refreshed.');
        loadIssues();
      }
    } catch {
      showToast('Failed to record confirmation.');
    }
  };

  return (
    <div className="relative h-[calc(100vh-6.5rem)] w-full flex flex-col overflow-hidden bg-[#070b14]">
      {/* Map Filter Bar */}
      <div className="z-10 bg-[#0b1120]/95 backdrop-blur border-b border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search road or sector..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Level 4: Critical</option>
            <option value="high">Level 3: High</option>
            <option value="moderate">Level 2: Moderate</option>
            <option value="low">Level 1: Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="repair_submitted">Repair Submitted</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Only Unresolved Toggle */}
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyUnresolved}
              onChange={(e) => setOnlyUnresolved(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-950"
            />
            <span>Unresolved only</span>
          </label>
        </div>

        {/* Map API Key & Layers Button + Locate Me */}
        <div className="flex items-center gap-2">
          {/* Map API Key / Provider Configuration Trigger */}
          <button
            onClick={() => setIsMapKeyModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 flex items-center gap-1.5 text-xs font-medium transition-colors shadow-sm"
            title="Configure Map API Key & Tile Layers"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers &amp; Key</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          <span className="text-slate-400 font-mono hidden md:inline text-[11px]">
            <strong>{issues.length}</strong> markers
          </span>

          <button
            onClick={handleLocateMe}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center gap-1 transition-colors"
            title="Pan to current GPS location"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Active Layer Tag on Map */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur border border-cyan-500/30 text-[11px] font-mono text-cyan-300 shadow-xl flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>LAYER: {mapTileProvider.toUpperCase().replace('_', ' ')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-10 p-3 rounded-xl bg-slate-950/95 backdrop-blur border border-slate-800 text-xs space-y-1.5 shadow-2xl hidden sm:block">
          <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1">
            Severity Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white/50" />
            <span className="text-slate-300">Level 4: Critical Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white/50" />
            <span className="text-slate-300">Level 3: High Failure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/50" />
            <span className="text-slate-300">Level 2: Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 border border-white/50" />
            <span className="text-slate-300">Level 1: Minor</span>
          </div>
        </div>

        {/* Selected Issue Detail Drawer */}
        {selectedIssue && (
          <div className="absolute top-4 right-4 bottom-4 z-20 w-full max-w-sm bg-[#0b1120] border border-cyan-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {selectedIssue.public_reference}
                </span>
                <span className="text-[11px] text-slate-400 uppercase">· {selectedIssue.issue_status.replace('_', ' ')}</span>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Photo preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={selectedIssue.primary_image_url}
                  alt={selectedIssue.road_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800 text-cyan-300">
                  {selectedIssue.detections[0]?.confidence
                    ? `AI Conf: ${(selectedIssue.detections[0].confidence * 100).toFixed(0)}%`
                    : 'Field Inspected'}
                </div>
              </div>

              {/* Title & Locality */}
              <div>
                <h3 className="text-sm font-bold text-white">{selectedIssue.road_name}</h3>
                <p className="text-slate-400 mt-0.5">{selectedIssue.locality}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-1">
                  GPS: {selectedIssue.latitude.toFixed(5)}° N, {selectedIssue.longitude.toFixed(5)}° E
                </p>
              </div>

              {/* Severity & Priority Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-500">Assigned Severity</div>
                  <div className={`font-bold mt-0.5 capitalize ${SEVERITY_COLORS[selectedIssue.severity]?.textClass}`}>
                    {selectedIssue.severity}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-500">Priority Score</div>
                  <div className="font-bold text-white font-mono mt-0.5">
                    {selectedIssue.priority_score} / 100 ({selectedIssue.priority_tier.toUpperCase()})
                  </div>
                </div>
              </div>

              {/* Reports and verification status */}
              <div className="space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Linked Citizen Reports:</span>
                  <span className="font-semibold text-slate-200">{selectedIssue.reports_count} reports</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>First Reported:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedIssue.first_reported_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Crew:</span>
                  <span className="text-slate-200">{selectedIssue.assigned_team_name || 'Awaiting assignment'}</span>
                </div>
                {selectedIssue.is_recurring && (
                  <div className="pt-1 text-red-400 font-medium">
                    ⚠ Recurring pothole: Reappeared at previously patched coordinates.
                  </div>
                )}
              </div>

              {/* Community Confirmation */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] text-slate-400">Confirm Road Condition:</div>
                <button
                  onClick={() => handleConfirmStillExists(selectedIssue)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  <span>I see this pothole too ({selectedIssue.still_present_votes} confirmed)</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedIssueId(selectedIssue.id);
                  setActiveTab('issue_detail');
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <span>Full Issue File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.latitude},${selectedIssue.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Open Google Maps Navigation"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
