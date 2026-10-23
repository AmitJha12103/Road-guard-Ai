import { RoadIssue, DuplicateCandidate } from '../src/types';

/**
 * Calculates distance between two GPS coordinates in meters using the Haversine formula
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Evaluates duplicate candidates among existing road issues
 */
export function findDuplicateCandidates(
  newReport: {
    id: string;
    latitude: number;
    longitude: number;
    road_name: string;
    locality: string;
  },
  existingIssues: RoadIssue[],
  maxRadiusMeters: number = 65
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const issue of existingIssues) {
    if (issue.issue_status === 'resolved' || issue.issue_status === 'rejected') {
      continue;
    }

    const dist = calculateHaversineDistanceMeters(
      newReport.latitude,
      newReport.longitude,
      issue.latitude,
      issue.longitude
    );

    if (dist <= maxRadiusMeters) {
      const matchReasons: string[] = [];
      let score = 0;

      // Distance score (up to 60 points)
      if (dist <= 15) {
        score += 60;
        matchReasons.push(`Immediate proximity (${dist}m) on same carriageway`);
      } else if (dist <= 35) {
        score += 45;
        matchReasons.push(`Close proximity (${dist}m) within road corridor`);
      } else {
        score += 25;
        matchReasons.push(`Nearby road coordinate (${dist}m)`);
      }

      // Road Name & locality similarity (up to 25 points)
      const cleanNewRoad = newReport.road_name.toLowerCase().trim();
      const cleanIssueRoad = issue.road_name.toLowerCase().trim();
      if (cleanNewRoad === cleanIssueRoad || cleanNewRoad.includes(cleanIssueRoad) || cleanIssueRoad.includes(cleanNewRoad)) {
        score += 25;
        matchReasons.push(`Matching street/corridor name: "${issue.road_name}"`);
      } else if (newReport.locality.toLowerCase().trim() === issue.locality.toLowerCase().trim()) {
        score += 10;
        matchReasons.push(`Matching municipal ward/locality: "${issue.locality}"`);
      }

      // Active open issue bonus (15 points)
      score += 15;
      matchReasons.push(`Active open issue (${issue.public_reference}) currently in progress`);

      candidates.push({
        report_id: newReport.id,
        candidate_issue_id: issue.id,
        match_score: Math.min(100, score),
        distance_meters: dist,
        match_reasons: matchReasons,
        status: 'pending_review',
      });
    }
  }

  // Sort by highest match score first
  return candidates.sort((a, b) => b.match_score - a.match_score);
}
