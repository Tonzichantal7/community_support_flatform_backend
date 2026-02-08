import express from 'express';
import {
  submitAbuseReport,
  getAllAbuseReports,
  getAbuseReportById,
  getMyAbuseReports,
  resolveAbuseReport,
  reopenAbuseReport,
  getAbuseReportStats
} from '../controller/abuseReportController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { validateAbuseReportSubmission } from '../middleware/validateAbuseReport';

const router = express.Router();

// User routes (require authentication)
router.post('/abuse-reports', authenticate, validateAbuseReportSubmission, submitAbuseReport);
router.get('/abuse-reports/my', authenticate, getMyAbuseReports);
router.get('/abuse-reports/:reportId', authenticate, getAbuseReportById);

// Admin routes (require authentication + admin role)
router.get('/admin/abuse-reports/stats', authenticate, requireAdmin, getAbuseReportStats);
router.get('/admin/abuse-reports', authenticate, requireAdmin, getAllAbuseReports);
router.put('/admin/abuse-reports/:reportId/resolve', authenticate, requireAdmin, resolveAbuseReport);
router.put('/admin/abuse-reports/:reportId/reopen', authenticate, requireAdmin, reopenAbuseReport);

export default router;
