import { RoadIssue, SeverityLevel } from '../src/types';

export function calculatePriorityScore(issue: {
  severity: SeverityLevel;
  road_type?: string;
  hazard_types?: string[];
  reports_count?: number;
  first_reported_at: string;
  is_recurring?: boolean;
}): {
  score: number;
  tier: 'urgent' | 'high' | 'standard' | 'routine';
  factors: {
    severity_weight: number;
    road_context_weight: number;
    reports_count_weight: number;
    time_unresolved_weight: number;
    recurrence_weight: number;
  };
} {
  // 1. Severity weight (40%)
  let severityScore = 20;
  if (issue.severity === 'critical') severityScore = 100;
  else if (issue.severity === 'high') severityScore = 75;
  else if (issue.severity === 'moderate') severityScore = 45;
  else if (issue.severity === 'low') severityScore = 20;
  const severityWeight = Math.round(severityScore * 0.4);

  // 2. Safety-relevant Road Context (20%)
  let contextScore = 30; // default local residential
  if (issue.road_type === 'arterial_highway') contextScore = 90;
  else if (issue.road_type === 'commercial_corridor') contextScore = 70;
  else if (issue.road_type === 'collector_avenue') contextScore = 50;

  if (issue.hazard_types && issue.hazard_types.length > 0) {
    contextScore = Math.min(100, contextScore + issue.hazard_types.length * 10);
  }
  const roadContextWeight = Math.round(contextScore * 0.2);

  // 3. Independent supporting reports (15%)
  const count = issue.reports_count || 1;
  const reportsScore = Math.min(100, count * 25);
  const reportsCountWeight = Math.round(reportsScore * 0.15);

  // 4. Time unresolved (15%)
  const reportedDate = new Date(issue.first_reported_at).getTime();
  const now = Date.now();
  const daysUnresolved = Math.max(0, Math.floor((now - reportedDate) / (1000 * 60 * 60 * 24)));
  const timeScore = Math.min(100, daysUnresolved * 8 + 10);
  const timeUnresolvedWeight = Math.round(timeScore * 0.15);

  // 5. Confirmed recurrence (10%)
  const recurrenceScore = issue.is_recurring ? 100 : 0;
  const recurrenceWeight = Math.round(recurrenceScore * 0.1);

  // Total Score (0 - 100)
  const totalScore = Math.min(
    100,
    Math.max(0, severityWeight + roadContextWeight + reportsCountWeight + timeUnresolvedWeight + recurrenceWeight)
  );

  let tier: 'urgent' | 'high' | 'standard' | 'routine' = 'routine';
  if (totalScore >= 80) tier = 'urgent';
  else if (totalScore >= 60) tier = 'high';
  else if (totalScore >= 35) tier = 'standard';

  return {
    score: totalScore,
    tier,
    factors: {
      severity_weight: severityWeight,
      road_context_weight: roadContextWeight,
      reports_count_weight: reportsCountWeight,
      time_unresolved_weight: timeUnresolvedWeight,
      recurrence_weight: recurrenceWeight,
    },
  };
}
