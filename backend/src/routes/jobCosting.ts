import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const timeEntrySchema = z.object({
  date: z.string().datetime(),
  hours: z.number().positive(),
  description: z.string().optional(),
  userId: z.string().min(1),
  hourlyRate: z.number().nonnegative().optional(),
});

const materialPurchaseSchema = z.object({
  date: z.string().datetime(),
  supplier: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  receiptUrl: z.string().url().optional(),
});

// Apply auth middleware
router.use(authMiddleware);

// Log time entry
router.post(
  '/:projectId/time-entries',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = timeEntrySchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: { select: { pricingConfig: true } },
      },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Use provided rate or get from company config
    const pricingConfig = project.company.pricingConfig as Record<string, unknown> || {};
    const hourlyRate = validated.hourlyRate || (pricingConfig.defaultLaborRate as number) || 65;
    const totalCost = validated.hours * hourlyRate;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        userId: validated.userId,
        date: new Date(validated.date),
        hours: validated.hours,
        description: validated.description,
        hourlyRate,
        totalCost,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Update project actual labor cost
    await prisma.project.update({
      where: { id: projectId },
      data: {
        actualLaborCost: { increment: totalCost },
        actualTotalCost: { increment: totalCost },
      },
    });

    res.status(201).json({
      success: true,
      data: timeEntry,
    });
  })
);

// List time entries
router.get(
  '/:projectId/time-entries',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: timeEntries,
    });
  })
);

// Log material purchase
router.post(
  '/:projectId/material-purchases',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = materialPurchaseSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const purchase = await prisma.materialPurchase.create({
      data: {
        projectId,
        date: new Date(validated.date),
        supplier: validated.supplier,
        description: validated.description,
        amount: validated.amount,
        receiptUrl: validated.receiptUrl,
      },
    });

    // Update project actual material cost
    await prisma.project.update({
      where: { id: projectId },
      data: {
        actualMaterialCost: { increment: validated.amount },
        actualTotalCost: { increment: validated.amount },
      },
    });

    res.status(201).json({
      success: true,
      data: purchase,
    });
  })
);

// List material purchases
router.get(
  '/:projectId/material-purchases',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const purchases = await prisma.materialPurchase.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: purchases,
    });
  })
);

// Get job cost report
router.get(
  '/:projectId/job-cost-report',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Get all time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Get all material purchases
    const materialPurchases = await prisma.materialPurchase.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const actualLaborCost = timeEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const actualLaborHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
    const actualMaterialCost = materialPurchases.reduce((sum, p) => sum + p.amount, 0);
    const actualTotalCost = actualLaborCost + actualMaterialCost;

    // Calculate variances
    const laborVariance = actualLaborCost - project.estimatedLaborCost;
    const materialVariance = actualMaterialCost - project.estimatedMaterialCost;
    const totalVariance = actualTotalCost - project.estimatedTotalCost;

    // Calculate profit
    const actualProfit = project.contractValue - actualTotalCost;
    const actualMargin = project.contractValue > 0
      ? (actualProfit / project.contractValue) * 100
      : 0;

    const report = {
      projectId,
      projectName: project.name,
      contractValue: project.contractValue,
      estimated: {
        materialCost: project.estimatedMaterialCost,
        laborCost: project.estimatedLaborCost,
        totalCost: project.estimatedTotalCost,
        profit: project.estimatedProfit,
        margin: project.estimatedMargin,
      },
      actual: {
        materialCost: actualMaterialCost,
        laborCost: actualLaborCost,
        laborHours: actualLaborHours,
        totalCost: actualTotalCost,
        profit: actualProfit,
        margin: actualMargin,
      },
      variance: {
        materialCost: materialVariance,
        laborCost: laborVariance,
        totalCost: totalVariance,
        materialPercent: project.estimatedMaterialCost > 0
          ? (materialVariance / project.estimatedMaterialCost) * 100
          : 0,
        laborPercent: project.estimatedLaborCost > 0
          ? (laborVariance / project.estimatedLaborCost) * 100
          : 0,
        totalPercent: project.estimatedTotalCost > 0
          ? (totalVariance / project.estimatedTotalCost) * 100
          : 0,
      },
      timeEntries: timeEntries.slice(0, 10), // Last 10
      materialPurchases: materialPurchases.slice(0, 10), // Last 10
    };

    res.json({
      success: true,
      data: report,
    });
  })
);

// Complete project
router.post(
  '/:projectId/complete',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Calculate final actuals
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
    });
    const materialPurchases = await prisma.materialPurchase.findMany({
      where: { projectId },
    });

    const actualLaborCost = timeEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const actualMaterialCost = materialPurchases.reduce((sum, p) => sum + p.amount, 0);
    const actualTotalCost = actualLaborCost + actualMaterialCost;
    const actualProfit = project.contractValue - actualTotalCost;
    const actualMargin = project.contractValue > 0
      ? (actualProfit / project.contractValue) * 100
      : 0;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        actualMaterialCost,
        actualLaborCost,
        actualTotalCost,
        actualProfit,
        actualMargin,
      },
    });

    // TODO: Trigger learning loop to analyze estimate accuracy
    // TODO: Send review request to client

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project marked as completed',
    });
  })
);

export default router;
