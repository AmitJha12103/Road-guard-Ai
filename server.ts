import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbStore } from './server/db';
import { aiInferenceService } from './server/aiService';
import { CitizenReport } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Authentication & Current User
  app.get('/api/v1/auth/me', (req: Request, res: Response) => {
    const role = (req.query.role as string) || 'citizen';
    const user = dbStore.users.find((u) => u.role === role) || dbStore.users[0];
    res.json({ success: true, user, allUsers: dbStore.users });
  });

  // AI Inference & Models
  app.post('/api/v1/ai/detect', async (req: Request, res: Response) => {
    try {
      const { image, image_id } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data or URL is required' });
      }
      const result = await aiInferenceService.detectRoadDamage(image, image_id);
      res.json(result);
    } catch (err: any) {
      console.error('Error in AI detection endpoint:', err);
      res.status(500).json({ error: 'Inference failed', message: err?.message });
    }
  });

  app.get('/api/v1/ai/models', (req: Request, res: Response) => {
    res.json({
      active_model: process.env.GEMINI_API_KEY ? 'gemini-3.8-flash' : 'RoadGuard-YOLOv8-Sim-v2.1',
      is_live_gemini: Boolean(process.env.GEMINI_API_KEY),
      mode: process.env.GEMINI_API_KEY ? 'Live Multi-modal Gemini Vision' : 'Calibrated Edge CV Engine (Demo Mode)',
      supported_classes: ['pothole', 'alligator_crack', 'longitudinal_crack', 'surface_depression'],
      recommended_confidence_threshold: 0.65,
    });
  });

  app.get('/api/v1/ai/health', (req: Request, res: Response) => {
    res.json({
      status: 'operational',
      engine: 'RoadGuard Vision Engine',
      latency_p50_ms: 240,
      timestamp: new Date().toISOString(),
    });
  });

  // Road Issues Endpoints
  app.get('/api/v1/issues', (req: Request, res: Response) => {
    const { severity, status, search, onlyUnresolved, locality } = req.query;
    const issues = dbStore.getAllIssues({
      severity: severity as string,
      status: status as string,
      search: search as string,
      onlyUnresolved: onlyUnresolved === 'true',
      locality: locality as string,
    });
    res.json({ success: true, count: issues.length, data: issues });
  });

  app.get('/api/v1/issues/:id', (req: Request, res: Response) => {
    const issue = dbStore.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Road issue not found' });
    }
    res.json({ success: true, data: issue });
  });

  // Citizen Reports & Submission
  app.get('/api/v1/reports', (req: Request, res: Response) => {
    res.json({ success: true, data: dbStore.reports });
  });

  app.post('/api/v1/reports', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.road_name || !body.latitude || !body.longitude) {
      return res.status(400).json({ error: 'road_name, latitude, and longitude are required' });
    }

    const reportId = `rep_${Date.now()}`;
    const pubRef = `REP-RG-${Math.floor(10000 + Math.random() * 90000)}`;

    const newReport: CitizenReport = {
      id: reportId,
      public_reference: pubRef,
      reporter_name: body.reporter_name || 'Anonymous Citizen',
      reporter_email: body.reporter_email,
      description: body.description || 'Pothole observed on carriageway.',
      road_name: body.road_name,
      locality: body.locality || 'Metro Area',
      city: body.city || 'National Capital Region',
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      location_source: body.location_source || 'browser_gps',
      location_accuracy_m: body.location_accuracy_m || 5.0,
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
      reported_at: new Date().toISOString(),
      verification_status: 'pending',
      detections: Array.isArray(body.detections) ? body.detections : [],
      estimated_severity: body.estimated_severity || 'moderate',
      hazard_types: Array.isArray(body.hazard_types) ? body.hazard_types : [],
      road_type: body.road_type || 'collector_avenue',
    };

    const { issue, duplicateCandidates } = dbStore.createIssueFromReport(newReport);
    res.status(201).json({
      success: true,
      report: newReport,
      issue,
      duplicate_candidates: duplicateCandidates,
    });
  });

  // Administrative Operations
  app.post('/api/v1/issues/:id/verify', (req: Request, res: Response) => {
    const { actor_name, notes } = req.body;
    const issue = dbStore.verifyIssue(req.params.id, actor_name, notes);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  app.post('/api/v1/issues/:id/reject', (req: Request, res: Response) => {
    const { reason, actor_name } = req.body;
    const issue = dbStore.rejectIssue(req.params.id, reason || 'Rejected during authority review', actor_name);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  app.post('/api/v1/issues/:id/assign', (req: Request, res: Response) => {
    const { team_id, deadline_days, actor_name } = req.body;
    if (!team_id) return res.status(400).json({ error: 'team_id is required' });
    const issue = dbStore.assignTeam(req.params.id, team_id, Number(deadline_days) || 3, actor_name);
    if (!issue) return res.status(404).json({ error: 'Issue or team not found' });
    res.json({ success: true, data: issue });
  });

  app.post('/api/v1/issues/:id/merge', (req: Request, res: Response) => {
    const { target_issue_id, actor_name } = req.body;
    if (!target_issue_id) return res.status(400).json({ error: 'target_issue_id is required' });
    const ok = dbStore.mergeDuplicate(req.params.id, target_issue_id, actor_name);
    if (!ok) return res.status(400).json({ error: 'Merge failed, check issue IDs' });
    res.json({ success: true, message: 'Successfully merged duplicate issue' });
  });

  // Maintenance Workflow
  app.get('/api/v1/maintenance/teams', (req: Request, res: Response) => {
    res.json({ success: true, data: dbStore.maintenanceTeams });
  });

  app.get('/api/v1/maintenance/assignments', (req: Request, res: Response) => {
    const teamId = req.query.team_id as string;
    let issues = dbStore.issues.filter((i) => i.assigned_team_id);
    if (teamId) {
      issues = issues.filter((i) => i.assigned_team_id === teamId);
    }
    res.json({ success: true, data: issues });
  });

  app.post('/api/v1/issues/:id/start-repair', (req: Request, res: Response) => {
    const { actor_name } = req.body;
    const issue = dbStore.startRepair(req.params.id, actor_name);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  app.post('/api/v1/issues/:id/submit-repair', (req: Request, res: Response) => {
    const { notes, materials, after_image_url, before_image_url, actor_name } = req.body;
    const issue = dbStore.submitRepairEvidence(req.params.id, {
      notes: notes || 'Pothole patch complete',
      materials: materials || 'Hot-Mix Asphalt',
      afterImageUrl: after_image_url,
      beforeImageUrl: before_image_url,
      actorName: actor_name,
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  app.post('/api/v1/issues/:id/resolve', (req: Request, res: Response) => {
    const { actor_name, notes } = req.body;
    const issue = dbStore.resolveIssue(req.params.id, actor_name, notes);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  // Community Votes & Verification
  app.post('/api/v1/issues/:id/vote', (req: Request, res: Response) => {
    const { type } = req.body;
    if (type !== 'still_present' && type !== 'appears_repaired') {
      return res.status(400).json({ error: 'type must be still_present or appears_repaired' });
    }
    const issue = dbStore.voteIssue(req.params.id, type);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ success: true, data: issue });
  });

  // AI False-Positive Feedback
  app.post('/api/v1/issues/:id/feedback', (req: Request, res: Response) => {
    const { reporter_id, reason, notes } = req.body;
    const record = dbStore.submitFeedback({
      issue_id: req.params.id,
      reporter_id: reporter_id || 'anonymous',
      reason: reason || 'other',
      notes: notes || '',
    });
    res.status(201).json({ success: true, data: record });
  });

  // Analytics & Health Scores
  app.get('/api/v1/analytics/summary', (req: Request, res: Response) => {
    res.json({ success: true, data: dbStore.getAnalyticsSummary() });
  });

  app.get('/api/v1/analytics/road-health', (req: Request, res: Response) => {
    res.json({ success: true, data: dbStore.getRoadHealthScores() });
  });

  // Export CSV
  app.get('/api/v1/admin/export', (req: Request, res: Response) => {
    const issues = dbStore.issues;
    const headers = [
      'Public Reference',
      'Road Name',
      'Locality',
      'Latitude',
      'Longitude',
      'Severity',
      'Priority Score',
      'Priority Tier',
      'Status',
      'First Reported At',
      'Reports Count',
      'Assigned Team',
    ];

    const rows = issues.map((i) => [
      i.public_reference,
      `"${i.road_name.replace(/"/g, '""')}"`,
      `"${i.locality.replace(/"/g, '""')}"`,
      i.latitude,
      i.longitude,
      i.severity,
      i.priority_score,
      i.priority_tier,
      i.issue_status,
      i.first_reported_at,
      i.reports_count,
      `"${(i.assigned_team_name || 'Unassigned').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="roadguard_issues_export.csv"');
    res.send(csvContent);
  });

  // ==========================================
  // STATIC ASSETS & VITE MIDDLEWARE
  // ==========================================
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`RoadGuard AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
