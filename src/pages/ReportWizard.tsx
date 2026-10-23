import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AIDetectionResponse, PotholeDetection, SeverityLevel } from '../types';
import {
  Upload,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Layers,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

const SAMPLE_CRATER = '/src/assets/images/pothole_crater_damaged_1791542493436.jpg';
const SAMPLE_INSPECTION = '/src/assets/images/hero_road_inspection_1791542479083.jpg';

export const ReportWizard: React.FC = () => {
  const { setActiveTab, setSelectedIssueId, showToast } = useApp();

  // Wizard state: 1 (Upload) -> 2 (AI Detect) -> 3 (Location) -> 4 (Details) -> 5 (Submit/Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(SAMPLE_CRATER);

  // Step 2: AI Detection
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<AIDetectionResponse | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('high');

  // Step 3: Location
  const [latitude, setLatitude] = useState<number>(28.5912);
  const [longitude, setLongitude] = useState<number>(77.1615);
  const [roadName, setRoadName] = useState<string>('Ring Road Expressway Mile 4');
  const [locality, setLocality] = useState<string>('Dhaula Kuan Junction');
  const [locationSource, setLocationSource] = useState<'browser_gps' | 'map_pin' | 'manual_coords'>('browser_gps');

  // Step 4: Details
  const [roadType, setRoadType] = useState<string>('arterial_highway');
  const [potholeCount, setPotholeCount] = useState<number>(1);
  const [hazards, setHazards] = useState<string[]>(['standing_water']);
  const [notes, setNotes] = useState<string>('Severe depression in the center wheel lane. Water accumulating after rain.');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(true);

  // Step 5: Submission Result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Mini Leaflet Map Ref for Step 3
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Handle Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviewUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sampleUrl: string, sampleRoad: string, sampleLoc: string, lat: number, lng: number) => {
    setImagePreviewUrl(sampleUrl);
    setRoadName(sampleRoad);
    setLocality(sampleLoc);
    setLatitude(lat);
    setLongitude(lng);
    showToast('Loaded sample road damage photograph.');
  };

  // Run AI Inference
  const runDetection = async () => {
    try {
      setIsDetecting(true);
      const res = await api.detectRoadDamage(imagePreviewUrl);
      setDetectionResult(res);
      if (res.overall_severity) {
        setSelectedSeverity(res.overall_severity);
      }
      showToast(`AI inference complete: ${res.detections.length} road defects segmented.`);
    } catch (err) {
      console.error('Detection error:', err);
      showToast('Computer vision inference failed; fallback to manual entry.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Auto-run AI detection when entering Step 2 if not already done
  useEffect(() => {
    if (currentStep === 2 && !detectionResult && !isDetecting) {
      runDetection();
    }
  }, [currentStep]);

  // Leaflet Map setup for Step 3
  useEffect(() => {
    if (currentStep !== 3) return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(Number(pos.lat.toFixed(5)));
        setLongitude(Number(pos.lng.toFixed(5)));
        setLocationSource('map_pin');
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.invalidateSize();
      markerRef.current?.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], 14);
    }

    return () => {
      if (mapInstanceRef.current && currentStep !== 3) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [currentStep, latitude, longitude]);

  const handleBrowserLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(Number(lat.toFixed(5)));
        setLongitude(Number(lng.toFixed(5)));
        setLocationSource('browser_gps');
        mapInstanceRef.current?.setView([lat, lng], 15);
        markerRef.current?.setLatLng([lat, lng]);
        showToast('Acquired browser GPS coordinates.');
      },
      (err) => {
        showToast(`GPS Error: ${err.message}`);
      }
    );
  };

  const handleToggleHazard = (h: string) => {
    setHazards((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!consentAccepted) {
      showToast('Please confirm the consent notice before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitReport({
        road_name: roadName,
        locality: locality,
        latitude,
        longitude,
        location_source: locationSource,
        image_urls: [imagePreviewUrl],
        description: notes,
        estimated_severity: selectedSeverity,
        detections: detectionResult?.detections || [],
        hazard_types: hazards,
        road_type: roadType,
      });

      if (res.success) {
        setSubmissionResult(res);
        setCurrentStep(5);
        showToast('Road defect report filed successfully!');
      } else {
        showToast('Submission failed. Check details.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending report to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Wizard Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
          <span className={currentStep === 1 ? 'text-cyan-400 font-bold' : ''}>1. Photo Evidence</span>
          <span className={currentStep === 2 ? 'text-cyan-400 font-bold' : ''}>2. AI Triage</span>
          <span className={currentStep === 3 ? 'text-cyan-400 font-bold' : ''}>3. Location</span>
          <span className={currentStep === 4 ? 'text-cyan-400 font-bold' : ''}>4. Details</span>
          <span className={currentStep === 5 ? 'text-cyan-400 font-bold' : ''}>5. Confirmation</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Upload Photo */}
      {currentStep === 1 && (
        <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">Step 1: Upload Road Damage Photograph</h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide a clear image of the road surface cavity or crack. Good lighting and wheel-path perspective improve detection accuracy.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center transition-colors bg-slate-950/60">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="pothole-file-upload"
            />
            <label htmlFor="pothole-file-upload" className="cursor-pointer space-y-3 block">
              <Upload className="w-10 h-10 text-cyan-400 mx-auto" />
              <div className="text-sm font-semibold text-white">Click or drag &amp; drop to upload photo</div>
              <div className="text-xs text-slate-500">Supports PNG, JPG, WebP up to 15MB</div>
            </label>
          </div>

          {/* Quick Preset Demonstrations */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Or Select Demonstration Sample:
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  handleSelectSample(
                    SAMPLE_CRATER,
                    'Ring Road Expressway Mile 4',
                    'Dhaula Kuan Junction',
                    28.5912,
                    77.1615
                  )
                }
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  imagePreviewUrl === SAMPLE_CRATER
                    ? 'border-cyan-500 bg-cyan-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                }`}
              >
                <img
                  src={SAMPLE_CRATER}
                  alt="Damaged pothole"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">Severe Crater</div>
                  <div className="text-slate-400 text-[11px]">Deep cavity in traffic lane</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectSample(
                    SAMPLE_INSPECTION,
                    'Barakhamba Avenue Crossway',
                    'Connaught Place Central',
                    28.6304,
                    77.2219
                  )
                }
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  imagePreviewUrl === SAMPLE_INSPECTION
                    ? 'border-cyan-500 bg-cyan-950/40 text-white'
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
                }`}
              >
                <img
                  src={SAMPLE_INSPECTION}
                  alt="Chalk markings on road"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">Inspection Markings</div>
                  <div className="text-slate-400 text-[11px]">Chalked carriageway defect</div>
                </div>
              </button>
            </div>
          </div>

          {/* Preview */}
          {imagePreviewUrl && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold">Active Selection:</div>
              <div className="aspect-video w-full max-h-56 rounded-lg overflow-hidden">
                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to AI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI Triage & Bounding Box Inspection */}
      {currentStep === 2 && (
        <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Step 2: AI Computer Vision Triage</h2>
              <p className="text-xs text-slate-400 mt-1">
                The neural network segments road defects, calculates depth indicators, and assigns a preliminary severity.
              </p>
            </div>
            <button
              onClick={runDetection}
              disabled={isDetecting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>Re-run Inference</span>
            </button>
          </div>

          {/* Inference Model Telemetry Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span>{detectionResult?.model_name || 'Inference Pipeline Initializing...'}</span>
            </div>
            <span className="text-slate-500">
              {detectionResult?.is_simulated_demo ? 'Mode: Calibrated Demo CV' : 'Mode: Live Gemini Vision'}
            </span>
          </div>

          {/* Annotated Photo Canvas */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src={imagePreviewUrl} alt="Analysis canvas" className="w-full h-full object-cover" />

            {/* Overlaid bounding boxes */}
            {detectionResult?.detections.map((det, idx) => (
              <div
                key={det.detection_id || idx}
                className="absolute border-2 border-red-500 bg-red-500/20"
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

          {/* Detections Summary */}
          {detectionResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-500">Damage Classification:</div>
                  <div className="font-bold text-white uppercase">
                    {detectionResult.detections[0]?.class_name.replace('_', ' ') || 'Pothole'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Surface area impact: {detectionResult.detections[0]?.area_percentage || 18}% of carriageway window
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-slate-500">Automated Severity Proposal:</div>
                  <div className="font-bold text-red-400 uppercase">
                    {detectionResult.overall_severity}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Calibrated depth estimate: &gt; 50mm rim fracture risk
                  </div>
                </div>
              </div>

              {/* Severity Override Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm or Adjust Severity Category:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'moderate', 'high', 'critical'] as SeverityLevel[]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSelectedSeverity(sev)}
                      className={`py-2 px-3 rounded-lg border text-xs capitalize font-semibold transition-colors ${
                        selectedSeverity === sev
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center gap-2"
            >
              <span>Confirm Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm Location */}
      {currentStep === 3 && (
        <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">Step 3: Pin Precise Geographic Location</h2>
            <p className="text-xs text-slate-400 mt-1">
              Drag the marker or use your device GPS. Precise coordinates ensure maintenance teams locate the defect immediately.
            </p>
          </div>

          {/* Interactive Map Pinning */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleBrowserLocation}
              className="px-3.5 py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Acquire Browser GPS (Device Fix)</span>
            </button>
            <span className="text-xs font-mono text-slate-400">
              Lat: {latitude} · Lng: {longitude}
            </span>
          </div>

          {/* Road name & locality inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Road / Street Name *
              </label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Ring Road Expressway Mile 4"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Locality / Ward / Landmark *
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Dhaula Kuan Junction"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center gap-2"
            >
              <span>Add Road Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Details & Hazard Assessment */}
      {currentStep === 4 && (
        <div className="bg-[#0b1120] border border-cyan-500/20 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">Step 4: Operational Road Context</h2>
            <p className="text-xs text-slate-400 mt-1">
              Contextual hazards heavily factor into the algorithmic priority score and response times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Corridor Hierarchy</label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="arterial_highway">Arterial Highway / Expressway (High Speed)</option>
                <option value="commercial_corridor">Commercial Business Corridor (Heavy Transit)</option>
                <option value="collector_avenue">Collector Avenue / Secondary Route</option>
                <option value="local_residential">Local Residential Street</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Visible Defect Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={potholeCount}
                onChange={(e) => setPotholeCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Hazard Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Aggravating Safety Hazards:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'standing_water', label: 'Standing Water / Concealed' },
                { id: 'near_junction', label: 'Near Busy Intersection' },
                { id: 'school_zone', label: 'School / Hospital Zone' },
                { id: 'blind_spot', label: 'Curve / Blind Crest' },
                { id: 'heavy_traffic', label: 'High Truck / Bus Volume' },
              ].map((h) => (
                <label
                  key={h.id}
                  className={`p-2.5 rounded-lg border cursor-pointer select-none flex items-center gap-2 transition-colors ${
                    hazards.includes(h.id)
                      ? 'border-cyan-500 bg-cyan-950/40 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hazards.includes(h.id)}
                    onChange={() => handleToggleHazard(h.id)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                  />
                  <span>{h.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Field Observations</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Center lane pothole causing sudden braking for two-wheelers..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Consent Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              id="consent-check"
              className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
            />
            <label htmlFor="consent-check" className="cursor-pointer select-none">
              I certify that this photograph was captured at the specified road location. I understand this report
              will undergo municipal review and be tracked publicly for civic accountability.
            </label>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !consentAccepted}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Transmitting Report...' : 'File Official Road Defect Report'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Confirmation & Duplicate Clustering Feedback */}
      {currentStep === 5 && submissionResult && (
        <div className="bg-[#0b1120] border border-cyan-500/30 rounded-2xl p-8 space-y-6 text-center animate-in fade-in duration-300 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Report Successfully Logged</h2>
            <p className="text-xs text-slate-400 font-mono">
              Public Reference: <strong className="text-cyan-400">{submissionResult.report.public_reference}</strong>
            </p>
          </div>

          {/* Duplicate candidates warning / banner */}
          {submissionResult.duplicate_candidates && submissionResult.duplicate_candidates.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Nearby Duplicate Candidate Detected</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Our spatial engine identified an existing active work order{' '}
                <strong>{submissionResult.duplicate_candidates[0].candidate_issue_id}</strong> within{' '}
                <strong>{submissionResult.duplicate_candidates[0].distance_meters} meters</strong> on the same road segment.
                Your submission has been associated to bolster the priority score.
              </p>
            </div>
          )}

          {/* Workflow Status Tracker */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="text-[11px] text-cyan-400 font-bold">1. SUBMITTED</div>
              <div className="text-slate-400">Citizen Evidence Stored</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-cyan-400 font-bold">2. AI ANALYZED</div>
              <div className="text-slate-400">{selectedSeverity.toUpperCase()} Severity Segmented</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-amber-400 font-bold">3. IN QUEUE</div>
              <div className="text-slate-400">Awaiting Authority Dispatch</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedIssueId(submissionResult.issue.id);
                setActiveTab('issue_detail');
              }}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors text-xs flex items-center gap-2 shadow"
            >
              <span>Track in Issue Inspector</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs"
            >
              View on Live Map
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setSubmissionResult(null);
                setDetectionResult(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs"
            >
              Report Another Pothole
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
