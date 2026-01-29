import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { EstimateStatus } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';
import { aiEstimatingService } from '../services/aiEstimatingService.js';

const router = Router();

// Validation schemas
const lineItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('each'),
  unitCost: z.number().nonnegative(),
  laborHours: z.number().nonnegative().optional(),
  laborRate: z.number().nonnegative().optional(),
  materialId: z.string().optional(),
  supplierName: z.string().optional(),
  subcontractorName: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const createEstimateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  materialMarkup: z.number().nonnegative().default(0),
  laborRate: z.number().nonnegative().default(0),
  overheadPercent: z.number().nonnegative().default(0),
  profitMarginPercent: z.number().nonnegative().default(0),
});

const aiEstimateSchema = z.object({
  photos: z.array(z.string().url()).optional(),
  measurements: z.record(z.number()).optional(),
  scopeDescription: z.string().min(10, 'Please provide a detailed scope description'),
  projectType: z.string(),
  qualityTier: z.enum(['standard', 'mid-range', 'premium']).default('mid-range'),
});

// Apply auth middleware
router.use(authMiddleware);

// Create estimate
router.post(
  '/:projectId/estimates',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = createEstimateSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Calculate totals
    let materialCost = 0;
    let laborCost = 0;
    let totalLaborHours = 0;

    const lineItemsWithTotals = validated.lineItems.map((item, index) => {
      const totalCost = item.quantity * item.unitCost;
      if (item.category.toLowerCase() === 'materials') {
        materialCost += totalCost;
      } else if (item.category.toLowerCase() === 'labor') {
        laborCost += totalCost;
        totalLaborHours += item.laborHours || 0;
      }
      return {
        ...item,
        totalCost,
        sortOrder: item.sortOrder ?? index,
      };
    });

    const subtotal = materialCost + laborCost;
    const overhead = subtotal * (validated.overheadPercent / 100);
    const profit = subtotal * (validated.profitMarginPercent / 100);
    const totalCost = subtotal + overhead + profit;

    // Create estimate with line items
    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        name: validated.name,
        description: validated.description,
        materialCost,
        laborCost,
        laborHours: totalLaborHours,
        overhead,
        profit,
        totalCost,
        materialMarkup: validated.materialMarkup,
        laborRate: validated.laborRate,
        overheadPercent: validated.overheadPercent,
        profitMarginPercent: validated.profitMarginPercent,
        lineItems: {
          create: lineItemsWithTotals,
        },
      },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: estimate,
    });
  })
);

// AI generate estimate
router.post(
  '/:projectId/estimates/ai-generate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = aiEstimateSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Generate AI estimate
    const aiOutput = await aiEstimatingService.generateEstimate({
      projectId,
      companyId: req.companyId!,
      photos: validated.photos,
      measurements: validated.measurements,
      scopeDescription: validated.scopeDescription,
      projectType: validated.projectType,
      qualityTier: validated.qualityTier,
    });

    // Save the estimate to database
    const estimateId = await aiEstimatingService.saveEstimate(projectId, aiOutput, {
      projectId,
      companyId: req.companyId!,
      photos: validated.photos,
      measurements: validated.measurements,
      scopeDescription: validated.scopeDescription,
      projectType: validated.projectType,
      qualityTier: validated.qualityTier,
    });

    // Fetch the saved estimate with line items
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: estimate,
      aiAnalysis: {
        summary: aiOutput.projectSummary,
        suggestedTiers: aiOutput.suggestedGoodBetterBest,
        warnings: aiOutput.warnings,
        questions: aiOutput.questionsForContractor,
      },
    });
  })
);

// List project estimates
router.get(
  '/:projectId/estimates',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const estimates = await prisma.estimate.findMany({
      where: { projectId },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: estimates,
    });
  })
);

// Get single estimate
router.get(
  '/:projectId/estimates/:estimateId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, estimateId } = req.params;

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        project: {
          select: { companyId: true },
        },
      },
    });

    if (!estimate || estimate.project.companyId !== req.companyId!) {
      throw createError('Estimate not found', 404);
    }

    if (estimate.projectId !== projectId) {
      throw createError('Estimate does not belong to this project', 400);
    }

    res.json({
      success: true,
      data: estimate,
    });
  })
);

// Update estimate
router.put(
  '/:projectId/estimates/:estimateId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, estimateId } = req.params;
    const validated = createEstimateSchema.partial().parse(req.body);

    // Verify estimate exists and belongs to company
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        project: { select: { companyId: true } },
      },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Estimate not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw createError('Only draft estimates can be edited', 400);
    }

    // If line items are provided, recalculate
    if (validated.lineItems) {
      let materialCost = 0;
      let laborCost = 0;
      let totalLaborHours = 0;

      const lineItemsWithTotals = validated.lineItems.map((item, index) => {
        const totalCost = item.quantity * item.unitCost;
        if (item.category.toLowerCase() === 'materials') {
          materialCost += totalCost;
        } else if (item.category.toLowerCase() === 'labor') {
          laborCost += totalCost;
          totalLaborHours += item.laborHours || 0;
        }
        return {
          ...item,
          totalCost,
          sortOrder: item.sortOrder ?? index,
        };
      });

      const subtotal = materialCost + laborCost;
      const overheadPercent = validated.overheadPercent ?? existing.overheadPercent;
      const profitMarginPercent = validated.profitMarginPercent ?? existing.profitMarginPercent;
      const overhead = subtotal * (overheadPercent / 100);
      const profit = subtotal * (profitMarginPercent / 100);
      const totalCost = subtotal + overhead + profit;

      // Delete existing line items and create new ones
      await prisma.estimateLineItem.deleteMany({
        where: { estimateId },
      });

      const estimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: {
          name: validated.name,
          description: validated.description,
          materialCost,
          laborCost,
          laborHours: totalLaborHours,
          overhead,
          profit,
          totalCost,
          materialMarkup: validated.materialMarkup,
          laborRate: validated.laborRate,
          overheadPercent,
          profitMarginPercent,
          version: { increment: 1 },
          lineItems: {
            create: lineItemsWithTotals,
          },
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      res.json({
        success: true,
        data: estimate,
      });
    } else {
      const estimate = await prisma.estimate.update({
        where: { id: estimateId },
        data: {
          name: validated.name,
          description: validated.description,
          materialMarkup: validated.materialMarkup,
          laborRate: validated.laborRate,
          overheadPercent: validated.overheadPercent,
          profitMarginPercent: validated.profitMarginPercent,
        },
        include: {
          lineItems: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      res.json({
        success: true,
        data: estimate,
      });
    }
  })
);

// Finalize estimate
router.post(
  '/:projectId/estimates/:estimateId/finalize',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { estimateId } = req.params;

    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        project: { select: { companyId: true } },
      },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Estimate not found', 404);
    }

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: { status: EstimateStatus.FINAL },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: estimate,
    });
  })
);

export default router;
