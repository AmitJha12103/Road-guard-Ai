import {
  RoadIssue,
  CitizenReport,
  MaintenanceTeam,
  IssueEvent,
  DuplicateCandidate,
  FalsePositiveFeedback,
  RoadHealthScore,
  SeverityLevel,
  IssueStatus,
  User,
} from '../src/types';
import { calculatePriorityScore } from './priorityScorer';
import { findDuplicateCandidates } from './duplicateDetector';

// Default Demo Images
const IMG_DAMAGED = '/src/assets/images/pothole_crater_damaged_1791542493436.jpg';
const IMG_CREW = '/src/assets/images/road_repair_crew_1791542513670.jpg';
const IMG_REPAIRED = '/src/assets/images/repaired_smooth_asphalt_1791542528669.jpg';
const IMG_HERO = '/src/assets/images/hero_road_inspection_1791542479083.jpg';

export class InDatabaseStore {
  public users: User[] = [
    {
      id: 'usr_citizen_1',
      name: 'Elena Rostova',
      email: 'elena.rostova@civic.org',
      role: 'citizen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_crew_1',
      name: 'David Chen',
      email: 'david.chen@highways.gov',
      role: 'maintenance',
      department: 'Central Rapid Asphalt Paving Unit',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_admin_1',
      name: 'Marcus Vance',
      email: 'm.vance@transport.gov',
      role: 'authority',
      department: 'Municipal Works & Transportation Authority',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_super_1',
      name: 'Sarah Jenkins',
      email: 's.jenkins@roadguard.system',
      role: 'superadmin',
      department: 'Infrastructure Systems Command',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
  ];

  public maintenanceTeams: MaintenanceTeam[] = [
    {
      id: 'team_central',
      name: 'Central Rapid Response Paving Unit',
      department: 'Public Works Division 1',
      jurisdiction: 'Metro Central & Business Corridor',
      leader_name: 'David Chen',
      active_jobs_count: 3,
      contact_phone: '+1 (555) 234-8801',
    },
    {
      id: 'team_north',
      name: 'North Highway Infrastructure Squad',
      department: 'Department of Transportation',
      jurisdiction: 'North Ring Expressway & Suburbs',
      leader_name: 'Robert Miller',
      active_jobs_count: 4,
      contact_phone: '+1 (555) 345-8802',
    },
    {
      id: 'team_south',
      name: 'South Sector Resurfacing Fleet',
      department: 'Municipal Roads Board',
      jurisdiction: 'Industrial District & South Avenue',
      leader_name: 'Aisha Al-Mansoor',
      active_jobs_count: 2,
      contact_phone: '+1 (555) 456-8803',
    },
    {
      id: 'team_east',
      name: 'East Residential Street Maintenance',
      department: 'Civic Urban Renewal',
      jurisdiction: 'East Boroughs & School Zones',
      leader_name: 'Carlos Mendez',
      active_jobs_count: 1,
      contact_phone: '+1 (555) 567-8804',
    },
  ];

  public issues: RoadIssue[] = [];
  public reports: CitizenReport[] = [];
  public auditLogs: IssueEvent[] = [];
  public falsePositiveFeedbacks: FalsePositiveFeedback[] = [];

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // Generate 32 realistic road issues across urban centers (Metro demonstration corridor)
    // Centers around coordinates [28.6139, 77.2090] (Connaught/Delhi corridor) or [37.7749, -122.4194]
    // Let's create realistic coordinates centered around a modern metropolitan grid (e.g., lat: 28.5355 to 28.6450, lng: 77.1000 to 77.2600)
    const basePoints = [
      { name: 'Ring Road Expressway Mile 4', locality: 'Dhaula Kuan Junction', lat: 28.5912, lng: 77.1615, sev: 'critical', type: 'arterial_highway', status: 'verified', haz: ['heavy_traffic', 'standing_water'] },
      { name: 'Barakhamba Avenue Crossway', locality: 'Connaught Place Central', lat: 28.6304, lng: 77.2219, sev: 'high', type: 'commercial_corridor', status: 'in_progress', haz: ['near_junction'] },
      { name: 'Mehrauli-Badarpur Corridor', locality: 'Saket Metro Sector', lat: 28.5244, lng: 77.2066, sev: 'critical', type: 'arterial_highway', status: 'assigned', haz: ['near_junction', 'standing_water'] },
      { name: 'Lodi Gardens Access Boulevard', locality: 'Civil Lines West', lat: 28.5933, lng: 77.2197, sev: 'low', type: 'local_residential', status: 'resolved', haz: [] },
      { name: 'Nehru Place Outer Ring Ramp', locality: 'Nehru Commercial Zone', lat: 28.5492, lng: 77.2529, sev: 'high', type: 'commercial_corridor', status: 'repair_submitted', haz: ['heavy_traffic'] },
      { name: 'Mathura Road Service Lane', locality: 'Pragati Maidan Corridor', lat: 28.6189, lng: 77.2432, sev: 'moderate', type: 'collector_avenue', status: 'awaiting_verification', haz: ['standing_water'] },
      { name: 'Vasant Vihar Marg Outer', locality: 'South District Suburbs', lat: 28.5583, lng: 77.1578, sev: 'moderate', type: 'local_residential', status: 'in_progress', haz: ['school_zone'] },
      { name: 'Rajpath Vista Connecting Lane', locality: 'Central Vista Zone', lat: 28.6129, lng: 77.2295, sev: 'low', type: 'collector_avenue', status: 'resolved', haz: [] },
      { name: 'Janakpuri District Center Main Road', locality: 'West Sector 3', lat: 28.6291, lng: 77.0812, sev: 'high', type: 'commercial_corridor', status: 'assigned', haz: ['near_junction'] },
      { name: 'Nizamuddin Flyover Descent', locality: 'South East Gate', lat: 28.5876, lng: 77.2514, sev: 'critical', type: 'arterial_highway', status: 'verified', haz: ['heavy_traffic', 'blind_spot'] },
      { name: 'Pusa Road Metro Pillar 114', locality: 'Karol Bagh West', lat: 28.6438, lng: 77.1894, sev: 'high', type: 'commercial_corridor', status: 'in_progress', haz: ['near_junction'] },
      { name: 'Dwarka Expressway Link Road', locality: 'Sector 21 Transit Hub', lat: 28.5521, lng: 77.0583, sev: 'critical', type: 'arterial_highway', status: 'submitted', haz: ['heavy_traffic'] },
      { name: 'Defence Colony Main Ring Corner', locality: 'South Extension', lat: 28.5724, lng: 77.2341, sev: 'moderate', type: 'collector_avenue', status: 'verified', haz: ['near_junction'] },
      { name: 'Mayur Vihar Phase 1 Bridge Ramp', locality: 'East Trans-Yamuna', lat: 28.6044, lng: 77.2912, sev: 'high', type: 'arterial_highway', status: 'assigned', haz: ['standing_water'] },
      { name: 'Laxmi Nagar Vikas Marg', locality: 'East Market Corridor', lat: 28.6322, lng: 77.2798, sev: 'critical', type: 'commercial_corridor', status: 'ai_analyzed', haz: ['heavy_traffic'] },
      { name: 'Okhla Phase 3 Industrial Way', locality: 'Industrial Estate', lat: 28.5367, lng: 77.2711, sev: 'high', type: 'commercial_corridor', status: 'in_progress', haz: ['standing_water'] },
      { name: 'Rohini Sector 7 School Crossing', locality: 'North West Sector', lat: 28.7121, lng: 77.1214, sev: 'moderate', type: 'local_residential', status: 'resolved', haz: ['school_zone'] },
      { name: 'Pitampura Outer Ring Connector', locality: 'North Sector', lat: 28.6989, lng: 77.1432, sev: 'moderate', type: 'collector_avenue', status: 'verified', haz: [] },
      { name: 'Chanakyapuri Shanti Path Service Lane', locality: 'Diplomatic Enclave', lat: 28.5911, lng: 77.1892, sev: 'low', type: 'local_residential', status: 'resolved', haz: [] },
      { name: 'ITO Intersection Transit Bay', locality: 'Supreme Court Sector', lat: 28.6288, lng: 77.2411, sev: 'critical', type: 'arterial_highway', status: 'verified', haz: ['heavy_traffic', 'near_junction'] },
      { name: 'Hauz Khas Village Entry Way', locality: 'South Heritage Quarter', lat: 28.5494, lng: 77.2001, sev: 'low', type: 'local_residential', status: 'awaiting_verification', haz: [] },
      { name: 'Greater Kailash 2 M-Block Road', locality: 'GK Residential South', lat: 28.5344, lng: 77.2422, sev: 'moderate', type: 'local_residential', status: 'resolved', haz: [] },
      { name: 'Ashok Vihar Satyawati Link', locality: 'North Central', lat: 28.6872, lng: 77.1812, sev: 'high', type: 'collector_avenue', status: 'in_progress', haz: ['standing_water'] },
      { name: 'Kailash Colony Metro Underpass', locality: 'South East Enclave', lat: 28.5533, lng: 77.2444, sev: 'high', type: 'commercial_corridor', status: 'repair_submitted', haz: ['near_junction'] },
      { name: 'Gurugram Border NH-48 Toll Lane', locality: 'South Gateway Corridor', lat: 28.5088, lng: 77.0933, sev: 'critical', type: 'arterial_highway', status: 'in_progress', haz: ['heavy_traffic'] },
      { name: 'Noida Link Bridge Western Foot', locality: 'Yamuna Bank Way', lat: 28.6183, lng: 77.2755, sev: 'high', type: 'arterial_highway', status: 'assigned', haz: ['standing_water'] },
      { name: 'Model Town Mall Road Concourse', locality: 'North Sector 2', lat: 28.7055, lng: 77.1944, sev: 'moderate', type: 'collector_avenue', status: 'verified', haz: [] },
      { name: 'Sarita Vihar Pocket C Approach', locality: 'South East Extension', lat: 28.5291, lng: 77.2911, sev: 'low', type: 'local_residential', status: 'resolved', haz: [] },
      { name: 'Punjabi Bagh Club Road Junction', locality: 'West Central Ring', lat: 28.6655, lng: 77.1322, sev: 'high', type: 'collector_avenue', status: 'verified', haz: ['near_junction'] },
      { name: 'Munirka Flyover Underpass Lane', locality: 'JNU South Corridor', lat: 28.5588, lng: 77.1722, sev: 'critical', type: 'arterial_highway', status: 'in_progress', haz: ['standing_water', 'heavy_traffic'] },
    ];

    basePoints.forEach((pt, index) => {
      const issueId = `iss_${1000 + index + 1}`;
      const pubRef = `RG-2026-${(1000 + index + 1).toString().padStart(5, '0')}`;
      const repId = `rep_${2000 + index + 1}`;

      const reportedDate = new Date(Date.now() - (index * 2 + 1) * 86400000).toISOString();
      const isRecurring = index % 5 === 0;
      const reportsCount = (index % 4) + 1;

      const priority = calculatePriorityScore({
        severity: pt.sev as SeverityLevel,
        road_type: pt.type,
        hazard_types: pt.haz,
        reports_count: reportsCount,
        first_reported_at: reportedDate,
        is_recurring: isRecurring,
      });

      let assignedTeamId: string | undefined;
      let assignedTeamName: string | undefined;
      if (['assigned', 'in_progress', 'repair_submitted', 'resolved'].includes(pt.status)) {
        const team = this.maintenanceTeams[index % this.maintenanceTeams.length];
        assignedTeamId = team.id;
        assignedTeamName = team.name;
      }

      const issue: RoadIssue = {
        id: issueId,
        public_reference: pubRef,
        representative_report_id: repId,
        road_name: pt.name,
        locality: pt.locality,
        city: 'National Capital Region (Demonstration Zone)',
        latitude: pt.lat,
        longitude: pt.lng,
        location_source: 'browser_gps',
        severity: pt.sev as SeverityLevel,
        severity_source: 'ai_estimated',
        priority_score: priority.score,
        priority_tier: priority.tier,
        priority_factors: priority.factors,
        issue_status: pt.status as IssueStatus,
        first_reported_at: reportedDate,
        last_confirmed_at: new Date(Date.now() - (index * 12) * 3600000).toISOString(),
        verified_at: ['verified', 'assigned', 'in_progress', 'repair_submitted', 'resolved'].includes(pt.status)
          ? new Date(Date.now() - index * 86400000).toISOString()
          : undefined,
        assigned_team_id: assignedTeamId,
        assigned_team_name: assignedTeamName,
        due_at: ['assigned', 'in_progress'].includes(pt.status)
          ? new Date(Date.now() + ((index % 3) + 1) * 86400000).toISOString()
          : undefined,
        resolved_at: pt.status === 'resolved'
          ? new Date(Date.now() - 12 * 3600000).toISOString()
          : undefined,
        reports_count: reportsCount,
        confirmations_count: (index % 6) + 3,
        still_present_votes: pt.status === 'resolved' ? 1 : (index % 5) + 4,
        appears_repaired_votes: pt.status === 'resolved' ? 14 : (pt.status === 'repair_submitted' ? 5 : 0),
        is_recurring: isRecurring,
        recurrence_count: isRecurring ? 2 : 0,
        previous_repairs_count: isRecurring ? 1 : 0,
        primary_image_url: pt.status === 'resolved' ? IMG_REPAIRED : IMG_DAMAGED,
        all_images: [
          pt.status === 'resolved' ? IMG_REPAIRED : IMG_DAMAGED,
          IMG_HERO,
          IMG_CREW,
        ],
        detections: [
          {
            detection_id: `det_seed_${index}_1`,
            class_name: 'pothole',
            confidence: 0.93 - (index % 5) * 0.02,
            bounding_box: {
              x: 22 + (index % 4) * 5,
              y: 35 + (index % 3) * 6,
              width: 44,
              height: 34,
            },
            estimated_severity: pt.sev as SeverityLevel,
            severity_indicators: [
              `Pavement cavity depth estimate > 60mm with rim fracture hazard`,
              `Located on high-throughput corridor (${pt.name})`,
            ],
            area_percentage: 18.5,
          },
        ],
        description: `Visual inspection flagged severe pavement subsidence and cratering along ${pt.name}. Hazardous to two-wheelers and automotive suspension.`,
        hazard_types: pt.haz,
        road_type: pt.type as any,
        repair_record: ['repair_submitted', 'resolved'].includes(pt.status)
          ? {
              id: `rep_rec_${index}`,
              issue_id: issueId,
              team_id: assignedTeamId || 'team_central',
              team_name: assignedTeamName || 'Central Rapid Response Paving Unit',
              started_at: new Date(Date.now() - 48 * 3600000).toISOString(),
              submitted_at: new Date(Date.now() - 16 * 3600000).toISOString(),
              completed_at: pt.status === 'resolved' ? new Date(Date.now() - 12 * 3600000).toISOString() : undefined,
              repair_notes: 'Excavated deteriorated subgrade, applied tack coat bitumen binder, filled with hot-mix asphalt (HMA-19) and compacted with 2.5T roller.',
              materials_used: 'Hot-Mix Asphalt Type II (450 kg), Bituminous Tack Coat (15 L), Rubberized Joint Sealant (8 kg)',
              before_image_url: IMG_DAMAGED,
              after_image_url: IMG_REPAIRED,
              supervisor_name: 'Marcus Vance',
              supervisor_verified: pt.status === 'resolved',
            }
          : undefined,
        history: [
          {
            id: `evt_${index}_1`,
            issue_id: issueId,
            actor_name: 'Elena Rostova',
            actor_role: 'citizen',
            event_type: 'reported',
            notes: 'Citizen submitted photographic evidence and GPS fix.',
            created_at: reportedDate,
          },
          {
            id: `evt_${index}_2`,
            issue_id: issueId,
            actor_name: 'RoadGuard Vision Engine',
            actor_role: 'superadmin',
            event_type: 'ai_analyzed',
            notes: `Detection model classified severity as ${pt.sev.toUpperCase()} with 93% confidence.`,
            created_at: new Date(new Date(reportedDate).getTime() + 15000).toISOString(),
          },
        ],
      };

      if (['verified', 'assigned', 'in_progress', 'repair_submitted', 'resolved'].includes(pt.status)) {
        issue.history.push({
          id: `evt_${index}_3`,
          issue_id: issueId,
          actor_name: 'Marcus Vance',
          actor_role: 'authority',
          event_type: 'verified',
          notes: 'Municipal highway inspector confirmed issue authenticity and approved priority schedule.',
          created_at: issue.verified_at!,
        });
      }

      if (assignedTeamName) {
        issue.history.push({
          id: `evt_${index}_4`,
          issue_id: issueId,
          actor_name: 'Marcus Vance',
          actor_role: 'authority',
          event_type: 'assigned',
          notes: `Assigned repair work order to ${assignedTeamName}.`,
          created_at: new Date(Date.now() - (index * 12 + 6) * 3600000).toISOString(),
        });
      }

      this.issues.push(issue);

      // Create matching citizen report
      this.reports.push({
        id: repId,
        public_reference: `REP-${pubRef}`,
        reporter_name: 'Elena Rostova',
        reporter_email: 'elena.rostova@civic.org',
        issue_id: issueId,
        description: issue.description,
        road_name: pt.name,
        locality: pt.locality,
        city: 'National Capital Region',
        latitude: pt.lat,
        longitude: pt.lng,
        location_source: 'browser_gps',
        location_accuracy_m: 4.8,
        image_urls: issue.all_images,
        reported_at: reportedDate,
        verification_status: pt.status === 'resolved' ? 'verified' : 'pending',
        detections: issue.detections,
        estimated_severity: pt.sev as SeverityLevel,
        hazard_types: pt.haz,
        road_type: pt.type,
      });
    });
  }

  public getAllIssues(filters?: {
    severity?: string;
    status?: string;
    search?: string;
    onlyUnresolved?: boolean;
    locality?: string;
  }): RoadIssue[] {
    let result = [...this.issues];

    if (filters?.severity && filters.severity !== 'all') {
      result = result.filter((i) => i.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'all') {
      result = result.filter((i) => i.issue_status === filters.status);
    }
    if (filters?.onlyUnresolved) {
      result = result.filter((i) => i.issue_status !== 'resolved' && i.issue_status !== 'rejected');
    }
    if (filters?.locality && filters.locality !== 'all') {
      result = result.filter((i) => i.locality.toLowerCase().includes(filters.locality!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.road_name.toLowerCase().includes(q) ||
          i.locality.toLowerCase().includes(q) ||
          i.public_reference.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => b.priority_score - a.priority_score);
  }

  public getIssueById(id: string): RoadIssue | undefined {
    return this.issues.find((i) => i.id === id || i.public_reference === id);
  }

  public createIssueFromReport(report: CitizenReport): { issue: RoadIssue; duplicateCandidates: DuplicateCandidate[] } {
    // Check for duplicate candidates in spatial range
    const duplicates = findDuplicateCandidates(
      {
        id: report.id,
        latitude: report.latitude,
        longitude: report.longitude,
        road_name: report.road_name,
        locality: report.locality,
      },
      this.issues
    );

    const issueId = `iss_${Date.now()}`;
    const pubRef = `RG-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const priority = calculatePriorityScore({
      severity: report.estimated_severity,
      road_type: report.road_type,
      hazard_types: report.hazard_types,
      reports_count: 1,
      first_reported_at: report.reported_at,
      is_recurring: false,
    });

    const newIssue: RoadIssue = {
      id: issueId,
      public_reference: pubRef,
      representative_report_id: report.id,
      road_name: report.road_name,
      locality: report.locality,
      city: report.city || 'Metro Demonstration Sector',
      latitude: report.latitude,
      longitude: report.longitude,
      location_source: report.location_source,
      severity: report.estimated_severity,
      severity_source: 'ai_estimated',
      priority_score: priority.score,
      priority_tier: priority.tier,
      priority_factors: priority.factors,
      issue_status: 'ai_analyzed',
      first_reported_at: report.reported_at,
      last_confirmed_at: report.reported_at,
      reports_count: 1,
      confirmations_count: 1,
      still_present_votes: 1,
      appears_repaired_votes: 0,
      is_recurring: false,
      recurrence_count: 0,
      previous_repairs_count: 0,
      primary_image_url: report.image_urls[0] || IMG_DAMAGED,
      all_images: report.image_urls.length > 0 ? report.image_urls : [IMG_DAMAGED],
      detections: report.detections,
      description: report.description,
      hazard_types: report.hazard_types,
      road_type: (report.road_type as any) || 'collector_avenue',
      history: [
        {
          id: `evt_${Date.now()}_1`,
          issue_id: issueId,
          actor_name: report.reporter_name,
          actor_role: 'citizen',
          event_type: 'reported',
          notes: 'Report submitted by citizen via RoadGuard web portal.',
          created_at: report.reported_at,
        },
        {
          id: `evt_${Date.now()}_2`,
          issue_id: issueId,
          actor_name: 'RoadGuard Vision Engine',
          actor_role: 'superadmin',
          event_type: 'ai_analyzed',
          notes: `Computer vision detected ${report.detections.length} road defects with severity estimated as ${report.estimated_severity.toUpperCase()}.`,
          created_at: new Date().toISOString(),
        },
      ],
    };

    report.issue_id = issueId;
    this.reports.unshift(report);
    this.issues.unshift(newIssue);

    return { issue: newIssue, duplicateCandidates: duplicates };
  }

  public verifyIssue(issueId: string, actorName: string = 'Marcus Vance', notes?: string): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    issue.issue_status = 'verified';
    issue.verified_at = new Date().toISOString();
    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: actorName,
      actor_role: 'authority',
      event_type: 'verified',
      notes: notes || 'Verified by municipal highway operations desk.',
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public rejectIssue(issueId: string, reason: string, actorName: string = 'Marcus Vance'): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    issue.issue_status = 'rejected';
    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: actorName,
      actor_role: 'authority',
      event_type: 'status_changed',
      previous_value: issue.issue_status,
      new_value: 'rejected',
      notes: reason,
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public assignTeam(
    issueId: string,
    teamId: string,
    deadlineDays: number = 3,
    actorName: string = 'Marcus Vance'
  ): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;
    const team = this.maintenanceTeams.find((t) => t.id === teamId);
    if (!team) return null;

    issue.assigned_team_id = team.id;
    issue.assigned_team_name = team.name;
    issue.issue_status = 'assigned';
    issue.due_at = new Date(Date.now() + deadlineDays * 86400000).toISOString();
    team.active_jobs_count += 1;

    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: actorName,
      actor_role: 'authority',
      event_type: 'assigned',
      notes: `Assigned to ${team.name} with expected completion in ${deadlineDays} days.`,
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public mergeDuplicate(sourceIssueId: string, targetIssueId: string, actorName: string = 'Marcus Vance'): boolean {
    const source = this.getIssueById(sourceIssueId);
    const target = this.getIssueById(targetIssueId);
    if (!source || !target) return false;

    target.reports_count += source.reports_count;
    target.confirmations_count += source.confirmations_count;
    target.all_images = Array.from(new Set([...target.all_images, ...source.all_images]));
    source.issue_status = 'rejected';

    target.history.push({
      id: `evt_${Date.now()}`,
      issue_id: target.id,
      actor_name: actorName,
      actor_role: 'authority',
      event_type: 'duplicate_merged',
      notes: `Consolidated duplicate report ${source.public_reference} into this primary issue.`,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  public startRepair(issueId: string, actorName: string = 'David Chen'): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    issue.issue_status = 'in_progress';
    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: actorName,
      actor_role: 'maintenance',
      event_type: 'repair_started',
      notes: 'Maintenance crew on-site. Cones positioned and saw-cutting started.',
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public submitRepairEvidence(
    issueId: string,
    data: {
      notes: string;
      materials: string;
      afterImageUrl?: string;
      beforeImageUrl?: string;
      actorName?: string;
    }
  ): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    issue.issue_status = 'repair_submitted';
    issue.repair_record = {
      id: `rep_rec_${Date.now()}`,
      issue_id: issue.id,
      team_id: issue.assigned_team_id || 'team_central',
      team_name: issue.assigned_team_name || 'Central Rapid Response Paving Unit',
      started_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      submitted_at: new Date().toISOString(),
      repair_notes: data.notes,
      materials_used: data.materials,
      before_image_url: data.beforeImageUrl || issue.primary_image_url || IMG_DAMAGED,
      after_image_url: data.afterImageUrl || IMG_REPAIRED,
      supervisor_verified: false,
    };

    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: data.actorName || 'David Chen',
      actor_role: 'maintenance',
      event_type: 'repair_submitted',
      notes: `Submitted repair evidence with compaction notes: "${data.notes}". Awaiting supervisor verification.`,
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public resolveIssue(issueId: string, actorName: string = 'Marcus Vance', notes?: string): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    issue.issue_status = 'resolved';
    issue.resolved_at = new Date().toISOString();
    if (issue.repair_record) {
      issue.repair_record.supervisor_verified = true;
      issue.repair_record.supervisor_name = actorName;
      issue.repair_record.completed_at = new Date().toISOString();
    }

    issue.history.push({
      id: `evt_${Date.now()}`,
      issue_id: issue.id,
      actor_name: actorName,
      actor_role: 'authority',
      event_type: 'resolved',
      notes: notes || 'Supervisor inspected repair evidence and certified pothole closure.',
      created_at: new Date().toISOString(),
    });

    return issue;
  }

  public voteIssue(issueId: string, type: 'still_present' | 'appears_repaired'): RoadIssue | null {
    const issue = this.getIssueById(issueId);
    if (!issue) return null;

    if (type === 'still_present') {
      issue.still_present_votes += 1;
      issue.confirmations_count += 1;
      issue.last_confirmed_at = new Date().toISOString();
      if (issue.issue_status === 'resolved') {
        // Citizen claims resolved pothole is back!
        issue.is_recurring = true;
        issue.recurrence_count += 1;
        issue.issue_status = 'in_progress';
        issue.history.push({
          id: `evt_${Date.now()}`,
          issue_id: issue.id,
          actor_name: 'Community Verification',
          actor_role: 'citizen',
          event_type: 'reopened',
          notes: 'Reopened automatically due to repeated community feedback that damage has recurred.',
          created_at: new Date().toISOString(),
        });
      }
    } else {
      issue.appears_repaired_votes += 1;
    }

    return issue;
  }

  public submitFeedback(feedback: {
    issue_id: string;
    reporter_id: string;
    reason: FalsePositiveFeedback['reason'];
    notes: string;
  }): FalsePositiveFeedback {
    const record: FalsePositiveFeedback = {
      id: `fp_${Date.now()}`,
      issue_id: feedback.issue_id,
      reporter_id: feedback.reporter_id,
      reason: feedback.reason,
      notes: feedback.notes,
      created_at: new Date().toISOString(),
    };
    this.falsePositiveFeedbacks.push(record);
    return record;
  }

  public getRoadHealthScores(): RoadHealthScore[] {
    const localityMap = new Map<string, { total: number; unresolved: number; critical: number; repaired: number }>();

    for (const issue of this.issues) {
      const loc = issue.locality;
      const cur = localityMap.get(loc) || { total: 0, unresolved: 0, critical: 0, repaired: 0 };
      cur.total += 1;
      if (issue.issue_status === 'resolved') cur.repaired += 1;
      else cur.unresolved += 1;
      if (issue.severity === 'critical') cur.critical += 1;
      localityMap.set(loc, cur);
    }

    const scores: RoadHealthScore[] = [];
    localityMap.forEach((stats, loc) => {
      // Calculate health: 100 - (unresolved * 10 + critical * 15) + (repaired * 8)
      let rawScore = 100 - (stats.unresolved * 12 + stats.critical * 18) + stats.repaired * 10;
      const score = Math.max(15, Math.min(98, rawScore));
      let status: 'critical' | 'poor' | 'fair' | 'good' = 'fair';
      if (score >= 80) status = 'good';
      else if (score >= 60) status = 'fair';
      else if (score >= 40) status = 'poor';
      else status = 'critical';

      scores.push({
        road_name: loc,
        locality: loc,
        score,
        status,
        active_potholes: stats.unresolved,
        repaired_count: stats.repaired,
        last_assessment: 'October 2026',
      });
    });

    return scores.sort((a, b) => a.score - b.score);
  }

  public getAnalyticsSummary() {
    const total = this.issues.length;
    const unresolved = this.issues.filter((i) => i.issue_status !== 'resolved' && i.issue_status !== 'rejected').length;
    const critical = this.issues.filter((i) => i.severity === 'critical' && i.issue_status !== 'resolved').length;
    const high = this.issues.filter((i) => i.severity === 'high' && i.issue_status !== 'resolved').length;
    const underRepair = this.issues.filter((i) => i.issue_status === 'in_progress').length;
    const resolved = this.issues.filter((i) => i.issue_status === 'resolved').length;
    const recurring = this.issues.filter((i) => i.is_recurring).length;

    const severityBreakdown = [
      { name: 'Critical', count: this.issues.filter((i) => i.severity === 'critical').length, color: '#DC2626' },
      { name: 'High', count: this.issues.filter((i) => i.severity === 'high').length, color: '#F97316' },
      { name: 'Moderate', count: this.issues.filter((i) => i.severity === 'moderate').length, color: '#F59E0B' },
      { name: 'Low', count: this.issues.filter((i) => i.severity === 'low').length, color: '#EAB308' },
    ];

    const monthlyTrends = [
      { month: 'May 2026', reported: 18, repaired: 12 },
      { month: 'Jun 2026', reported: 28, repaired: 22 },
      { month: 'Jul 2026', reported: 45, repaired: 34 },
      { month: 'Aug 2026', reported: 62, repaired: 48 },
      { month: 'Sep 2026', reported: 54, repaired: 51 },
      { month: 'Oct 2026', reported: 32, repaired: 29 },
    ];

    return {
      total,
      unresolved,
      critical,
      high,
      underRepair,
      resolved,
      recurring,
      medianHoursToVerify: 3.4,
      medianHoursToRepair: 28.5,
      severityBreakdown,
      monthlyTrends,
      activeTeamsCount: this.maintenanceTeams.length,
    };
  }
}

export const dbStore = new InDatabaseStore();
