import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Key, Map, CheckCircle2, Layers, X, Shield, Globe, ExternalLink } from 'lucide-react';

interface MapApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapApiKeyModal: React.FC<MapApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { mapApiKey, setMapApiKey, mapTileProvider, setMapTileProvider, showToast } = useApp();
  const [tempKey, setTempKey] = useState<string>(mapApiKey || '');
  const [selectedProvider, setSelectedProvider] = useState<string>(mapTileProvider || 'carto_voyager');

  if (!isOpen) return null;

  const handleSave = () => {
    setMapApiKey(tempKey);
    setMapTileProvider(selectedProvider);
    showToast('Map provider & API key settings updated! Refreshing map tiles.');
    onClose();
  };

  const providers = [
    {
      id: 'carto_voyager',
      name: 'CartoDB Voyager (Recommended / Keyless)',
      desc: 'High-contrast clean urban street styling with clear road hierarchy and high visibility.',
      needsKey: false,
      badge: 'Active & Instant',
    },
    {
      id: 'osm_standard',
      name: 'OpenStreetMap Official Tiles',
      desc: 'Standard global open-source community road cartography.',
      needsKey: false,
      badge: 'Public Tier',
    },
    {
      id: 'esri_satellite',
      name: 'Esri World Satellite Imagery',
      desc: 'High-resolution aerial satellite photography for inspecting pavement texture and road shoulders.',
      needsKey: false,
      badge: 'Satellite Aerial',
    },
    {
      id: 'maptiler',
      name: 'MapTiler Cloud Streets',
      desc: 'Custom vector-rendered street map requiring a free MapTiler API Key.',
      needsKey: true,
      badge: 'API Key Required',
    },
  ];

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1120] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Map Tile Provider &amp; API Key</h3>
              <p className="text-xs text-slate-400">Configure map rendering layers and custom service credentials</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tile Provider Options */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Select Active Map Layer:</label>
          <div className="space-y-2">
            {providers.map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/30'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>

                  <input
                    type="radio"
                    name="map-provider"
                    checked={isSelected}
                    onChange={() => setSelectedProvider(p.id)}
                    className="mt-1 text-cyan-500 focus:ring-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Custom Map API Key (Optional / MapTiler or Mapbox):
            </label>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Visible on Site</span>
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="e.g. maptiler_key_xyz... or pk.eyJ1Ijo..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            CartoDB and OpenStreetMap tiles are permanently active and do not require a paid key. Entering a key unlocks MapTiler or Mapbox HD vector layers.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shadow"
          >
            Apply &amp; Reload Map
          </button>
        </div>
      </div>
    </div>
  );
};
