import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { complianceService } from '../services/complianceService.js';
import { createError } from '../middleware/errorHandler.js';
import { getStateRules, getAllStatesWithRules, getStateRulesSummary } from '../services/compliance/stateRules.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const initializeComplianceSchema = z.object({
  firstWorkDate: z.string().datetime(),
});

const markSentSchema = z.object({
  sentVia: z.enum(['email', 'certified_mail', 'both', 'hand_delivered', 'regular_mail']),
  trackingNumber: z.string().optional(),
});

const markFiledSchema = z.object({
  documentUrl: z.string().url().optional(),
});

const updateNotesSchema = z.object({
  notes: z.string(),
});

// ============ DASHBOARD ============

/**
 * Get compliance dashboard for the company
 */
router.get(
  '/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const dashboard = await complianceService.getComplianceDashboard(req.companyId!);
    res.json({
      success: true,
      data: dashboard,
    });
  })
);

// ============ STATE RULES ============

/**
 * Get list of all states with compliance rules
 */
router.get(
  '/states',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const states = getAllStatesWithRules();
    const summaries = states.map((state) => ({
      state,
      ...getStateRulesSummary(state),
    }));

    res.json({
      success: true,
      data: summaries,
    });
  })
);

/**
 * Get compliance rules for a specific state
 */
router.get(
  '/states/:state',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { state } = req.params;
    const rules = getStateRules(state);

    if (!rules) {
      throw createError(`No compliance rules found for state: ${state}`, 404);
    }

    res.json({
      success: true,
      data: {
        state: state.toUpperCase(),
        rules,
        summary: getStateRulesSummary(state),
      },
    });
  })
);

// ============ PROJECT COMPLIANCE ============

/**
 * Initialize compliance tracking for a project
 */
router.post(
  '/projects/:projectId/initialize',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = initializeComplianceSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const records = await complianceService.initializeProjectCompliance(
      projectId,
      new Date(validated.firstWorkDate)
    );

    res.json({
      success: true,
      data: records,
      message: records.length > 0
        ? `Created ${records.length} compliance deadline(s)`
        : 'No compliance requirements for this state',
    });
  })
);

/**
 * Get compliance records for a project
 */
router.get(
  '/projects/:projectId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const records = await complianceService.getProjectCompliance(projectId);

    res.json({
      success: true,
      data: records,
    });
  })
);

/**
 * Get state rules for a project
 */
router.get(
  '/projects/:projectId/rules',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const rules = await complianceService.getStateRulesForProject(projectId);

    res.json({
      success: true,
      data: rules,
    });
  })
);

/**
 * Mark project as complete (creates lien deadline)
 */
router.post(
  '/projects/:projectId/complete',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const { completionDate } = req.body;

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const record = await complianceService.markProjectComplete(
      projectId,
      completionDate ? new Date(completionDate) : new Date()
    );

    res.json({
      success: true,
      data: record,
      message: record
        ? 'Mechanics lien deadline created'
        : 'No lien deadline required for this state',
    });
  })
);

// ============ COMPLIANCE RECORD ACTIONS ============

/**
 * Get a single compliance record
 */
router.get(
  '/records/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const record = await prisma.complianceRecord.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            name: true,
            companyId: true,
            clientFirstName: true,
            clientLastName: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
      },
    });

    if (!record || record.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    res.json({
      success: true,
      data: record,
    });
  })
);

/**
 * Generate preliminary notice document
 */
router.post(
  '/records/:id/generate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Verify record belongs to company
    const record = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!record || record.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const content = await complianceService.generatePreliminaryNotice(id);

    res.json({
      success: true,
      data: content,
    });
  })
);

/**
 * Mark compliance item as sent
 */
router.post(
  '/records/:id/send',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const validated = markSentSchema.parse(req.body);

    // Verify record belongs to company
    const existing = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const record = await complianceService.markAsSent(
      id,
      validated.sentVia,
      validated.trackingNumber
    );

    res.json({
      success: true,
      data: record,
      message: 'Marked as sent',
    });
  })
);

/**
 * Mark compliance item as delivered
 */
router.post(
  '/records/:id/delivered',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Verify record belongs to company
    const existing = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const record = await complianceService.markAsDelivered(id);

    res.json({
      success: true,
      data: record,
      message: 'Marked as delivered',
    });
  })
);

/**
 * Mark compliance item as filed (for liens)
 */
router.post(
  '/records/:id/filed',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const validated = markFiledSchema.parse(req.body);

    // Verify record belongs to company
    const existing = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const record = await complianceService.markAsFiled(id, validated.documentUrl);

    res.json({
      success: true,
      data: record,
      message: 'Marked as filed',
    });
  })
);

/**
 * Mark compliance item as waived
 */
router.post(
  '/records/:id/waived',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    // Verify record belongs to company
    const existing = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const record = await complianceService.markAsWaived(id, notes);

    res.json({
      success: true,
      data: record,
      message: 'Marked as waived',
    });
  })
);

/**
 * Update compliance record notes
 */
router.patch(
  '/records/:id/notes',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const validated = updateNotesSchema.parse(req.body);

    // Verify record belongs to company
    const existing = await prisma.complianceRecord.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Compliance record not found', 404);
    }

    const record = await complianceService.updateNotes(id, validated.notes);

    res.json({
      success: true,
      data: record,
    });
  })
);

// ============ WARNINGS CHECK (for cron jobs) ============

/**
 * Check and update compliance warnings
 * This endpoint would typically be called by a scheduled job
 */
router.post(
  '/check-warnings',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await complianceService.checkComplianceWarnings(req.companyId!);

    res.json({
      success: true,
      data: result,
      message: `Updated ${result.warnings} warnings and ${result.expired} expired items`,
    });
  })
);

export default router;
