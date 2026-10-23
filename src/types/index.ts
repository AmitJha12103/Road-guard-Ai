export type UserRole = 'citizen' | 'maintenance' | 'authority' | 'superadmin';

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical' | 'unclassified';

export type IssueStatus =
  | 'submitted'
  | 'ai_analyzed'
  | 'awaiting_verification'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'repair_submitted'
  | 'resolved'
  | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

export interface BoundingBox {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

export interface PotholeDetection {
  detection_id: string;
  class_name: 'pothole' | 'alligator_crack' | 'longitudinal_crack' | 'surface_depression';
  confidence: number; // 0.0 to 1.0
  bounding_box: BoundingBox;
  estimated_severity: SeverityLevel;
  severity_indicators: string[];
  area_percentage: number;
}

export interface AIDetectionResponse {
  image_id: string;
  inference_id: string;
  model_name: string;
  model_version: string;
  is_simulated_demo: boolean;
  processing_status: 'success' | 'partial' | 'failed';
  detections: PotholeDetection[];
  overall_image_quality: 'good' | 'adequate' | 'poor';
  overall_severity: SeverityLevel;
  requires_manual_review: boolean;
  warning_messages: string[];
  latency_ms: number;
}

export interface IssueEvent {
  id: string;
  issue_id: string;
  actor_name: string;
  actor_role: UserRole;
  event_type:
    | 'reported'
    | 'ai_analyzed'
    | 'verified'
    | 'priority_updated'
    | 'assigned'
    | 'status_changed'
    | 'repair_started'
    | 'repair_submitted'
    | 'resolved'
    | 'reopened'
    | 'duplicate_merged'
    | 'comment';
  previous_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
}

export interface MaintenanceTeam {
  id: string;
  name: string;
  department: string;
  jurisdiction: string;
  leader_name: string;
  active_jobs_count: number;
  contact_phone: string;
}

export interface RepairRecord {
  id: string;
  issue_id: string;
  team_id: string;
  team_name: string;
  started_at: string;
  submitted_at: string;
  completed_at?: string;
  repair_notes: string;
  materials_used: string;
  before_image_url: string;
  after_image_url: string;
  supervisor_name?: string;
  supervisor_verified: boolean;
}

export interface RoadIssue {
  id: string;
  public_reference: string;
  representative_report_id: string;
  road_name: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  location_source: 'browser_gps' | 'map_pin' | 'manual_coords' | 'exif_gps';
  severity: SeverityLevel;
  severity_source: 'ai_estimated' | 'authority_overridden' | 'field_verified';
  priority_score: number; // 0 - 100
  priority_tier: 'urgent' | 'high' | 'standard' | 'routine';
  priority_factors: {
    severity_weight: number;
    road_context_weight: number;
    reports_count_weight: number;
    time_unresolved_weight: number;
    recurrence_weight: number;
  };
  issue_status: IssueStatus;
  first_reported_at: string;
  last_confirmed_at: string;
  verified_at?: string;
  assigned_team_id?: string;
  assigned_team_name?: string;
  due_at?: string;
  resolved_at?: string;
  reports_count: number;
  confirmations_count: number;
  still_present_votes: number;
  appears_repaired_votes: number;
  is_recurring: boolean;
  recurrence_count: number;
  previous_repairs_count: number;
  primary_image_url: string;
  all_images: string[];
  detections: PotholeDetection[];
  description: string;
  hazard_types: string[]; // 'standing_water', 'near_junction', 'school_zone', 'blind_spot', 'heavy_traffic'
  road_type: 'arterial_highway' | 'collector_avenue' | 'local_residential' | 'commercial_corridor';
  repair_record?: RepairRecord;
  history: IssueEvent[];
}

export interface CitizenReport {
  id: string;
  public_reference: string;
  reporter_id?: string;
  reporter_name: string;
  reporter_email?: string;
  issue_id?: string;
  description: string;
  road_name: string;
  locality: string;
  city: string;
  latitude: number;
  longitude: number;
  location_source: 'browser_gps' | 'map_pin' | 'manual_coords';
  location_accuracy_m?: number;
  image_urls: string[];
  reported_at: string;
  verification_status: 'pending' | 'verified' | 'duplicate_linked' | 'rejected';
  detections: PotholeDetection[];
  estimated_severity: SeverityLevel;
  hazard_types: string[];
  road_type: string;
}

export interface DuplicateCandidate {
  report_id: string;
  candidate_issue_id: string;
  match_score: number; // 0 - 100
  distance_meters: number;
  match_reasons: string[];
  status: 'pending_review' | 'merged' | 'dismissed_distinct';
}

export interface FalsePositiveFeedback {
  id: string;
  issue_id: string;
  reporter_id: string;
  reason: 'shadow_mistaken' | 'road_marking' | 'manhole_cover' | 'water_puddle' | 'debris' | 'other';
  notes: string;
  created_at: string;
}

export interface RoadHealthScore {
  road_name: string;
  locality: string;
  score: number; // 0 - 100 (100 = perfect, 0 = severe distress)
  status: 'critical' | 'poor' | 'fair' | 'good';
  active_potholes: number;
  repaired_count: number;
  total_length_km?: number;
  last_assessment: string;
}
