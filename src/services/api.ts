import {
  RoadIssue,
  CitizenReport,
  AIDetectionResponse,
  MaintenanceTeam,
  FalsePositiveFeedback,
  RoadHealthScore,
  User,
} from '../types';

export const api = {
  // Auth
  async getCurrentUser(role: string = 'citizen'): Promise<{ user: User; allUsers: User[] }> {
    const res = await fetch(`/api/v1/auth/me?role=${encodeURIComponent(role)}`);
    const json = await res.json();
    return json;
  },

  // Issues
  async getIssues(params?: {
    severity?: string;
    status?: string;
    search?: string;
    onlyUnresolved?: boolean;
    locality?: string;
  }): Promise<{ data: RoadIssue[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.onlyUnresolved) query.append('onlyUnresolved', 'true');
    if (params?.locality) query.append('locality', params.locality);

    const res = await fetch(`/api/v1/issues?${query.toString()}`);
    return res.json();
  },

  async getIssueById(id: string): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(id)}`);
    return res.json();
  },

  // Reports
  async submitReport(reportData: Partial<CitizenReport>): Promise<{
    success: boolean;
    report: CitizenReport;
    issue: RoadIssue;
    duplicate_candidates: any[];
  }> {
    const res = await fetch('/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    return res.json();
  },

  async getReports(): Promise<{ data: CitizenReport[] }> {
    const res = await fetch('/api/v1/reports');
    return res.json();
  },

  // AI Inference
  async detectRoadDamage(imageData: string, imageId?: string): Promise<AIDetectionResponse> {
    const res = await fetch('/api/v1/ai/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData, image_id: imageId }),
    });
    return res.json();
  },

  async getAIModels(): Promise<any> {
    const res = await fetch('/api/v1/ai/models');
    return res.json();
  },

  // Authority Operations
  async verifyIssue(issueId: string, actorName?: string, notes?: string): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName, notes }),
    });
    return res.json();
  },

  async rejectIssue(issueId: string, reason: string, actorName?: string): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, actor_name: actorName }),
    });
    return res.json();
  },

  async assignTeam(
    issueId: string,
    teamId: string,
    deadlineDays: number = 3,
    actorName?: string
  ): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId, deadline_days: deadlineDays, actor_name: actorName }),
    });
    return res.json();
  },

  async mergeDuplicate(sourceIssueId: string, targetIssueId: string, actorName?: string): Promise<any> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(sourceIssueId)}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_issue_id: targetIssueId, actor_name: actorName }),
    });
    return res.json();
  },

  // Maintenance Workflow
  async getMaintenanceTeams(): Promise<{ data: MaintenanceTeam[] }> {
    const res = await fetch('/api/v1/maintenance/teams');
    return res.json();
  },

  async getMaintenanceAssignments(teamId?: string): Promise<{ data: RoadIssue[] }> {
    const url = teamId
      ? `/api/v1/maintenance/assignments?team_id=${encodeURIComponent(teamId)}`
      : '/api/v1/maintenance/assignments';
    const res = await fetch(url);
    return res.json();
  },

  async startRepair(issueId: string, actorName?: string): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/start-repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName }),
    });
    return res.json();
  },

  async submitRepairEvidence(
    issueId: string,
    payload: {
      notes: string;
      materials: string;
      after_image_url?: string;
      before_image_url?: string;
      actor_name?: string;
    }
  ): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/submit-repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async resolveIssue(issueId: string, actorName?: string, notes?: string): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_name: actorName, notes }),
    });
    return res.json();
  },

  // Community Votes
  async voteIssue(issueId: string, type: 'still_present' | 'appears_repaired'): Promise<{ data: RoadIssue }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(issueId)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    return res.json();
  },

  // AI False-Positive Feedback
  async submitFalsePositiveFeedback(payload: {
    issue_id: string;
    reporter_id: string;
    reason: FalsePositiveFeedback['reason'];
    notes: string;
  }): Promise<{ data: FalsePositiveFeedback }> {
    const res = await fetch(`/api/v1/issues/${encodeURIComponent(payload.issue_id)}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary(): Promise<{ data: any }> {
    const res = await fetch('/api/v1/analytics/summary');
    return res.json();
  },

  async getRoadHealthScores(): Promise<{ data: RoadHealthScore[] }> {
    const res = await fetch('/api/v1/analytics/road-health');
    return res.json();
  },
};
