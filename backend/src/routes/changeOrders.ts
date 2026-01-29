import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { ChangeOrderStatus } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('each'),
  unitCost: z.number().nonnegative(),
});

const createChangeOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  reason: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

// Apply auth middleware
router.use(authMiddleware);

// Create change order
router.post(
  '/:projectId/change-orders',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = createChangeOrderSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Get next change order number for this project
    const existingCount = await prisma.changeOrder.count({
      where: { projectId },
    });
    const changeOrderNumber = existingCount + 1;

    // Calculate totals
    let additionalMaterialCost = 0;
    let additionalLaborCost = 0;

    const lineItemsWithTotals = validated.lineItems.map((item) => {
      const totalCost = item.quantity * item.unitCost;
      // Simple heuristic: if unit is "hour" or "hours", it's labor
      if (item.unit.toLowerCase().includes('hour')) {
        additionalLaborCost += totalCost;
      } else {
        additionalMaterialCost += totalCost;
      }
      return { ...item, totalCost };
    });

    const totalAdditionalCost = additionalMaterialCost + additionalLaborCost;

    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId,
        changeOrderNumber,
        title: validated.title,
        description: validated.description,
        reason: validated.reason,
        additionalMaterialCost,
        additionalLaborCost,
        totalAdditionalCost,
        lineItems: {
          create: lineItemsWithTotals,
        },
      },
      include: {
        lineItems: true,
      },
    });

    res.status(201).json({
      success: true,
      data: changeOrder,
    });
  })
);

// List change orders
router.get(
  '/:projectId/change-orders',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      include: {
        lineItems: true,
      },
      orderBy: { changeOrderNumber: 'asc' },
    });

    res.json({
      success: true,
      data: changeOrders,
    });
  })
);

// Get single change order
router.get(
  '/:projectId/change-orders/:changeOrderId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { changeOrderId } = req.params;

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: {
        lineItems: true,
        project: {
          select: { companyId: true, name: true },
        },
      },
    });

    if (!changeOrder || changeOrder.project.companyId !== req.companyId!) {
      throw createError('Change order not found', 404);
    }

    res.json({
      success: true,
      data: changeOrder,
    });
  })
);

// Update change order
router.put(
  '/:projectId/change-orders/:changeOrderId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { changeOrderId } = req.params;
    const validated = createChangeOrderSchema.partial().parse(req.body);

    const existing = await prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: {
        project: { select: { companyId: true } },
      },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Change order not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw createError('Only draft change orders can be edited', 400);
    }

    if (validated.lineItems) {
      let additionalMaterialCost = 0;
      let additionalLaborCost = 0;

      const lineItemsWithTotals = validated.lineItems.map((item) => {
        const totalCost = item.quantity * item.unitCost;
        if (item.unit.toLowerCase().includes('hour')) {
          additionalLaborCost += totalCost;
        } else {
          additionalMaterialCost += totalCost;
        }
        return { ...item, totalCost };
      });

      const totalAdditionalCost = additionalMaterialCost + additionalLaborCost;

      await prisma.changeOrderLineItem.deleteMany({
        where: { changeOrderId },
      });

      const changeOrder = await prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          title: validated.title,
          description: validated.description,
          reason: validated.reason,
          additionalMaterialCost,
          additionalLaborCost,
          totalAdditionalCost,
          lineItems: {
            create: lineItemsWithTotals,
          },
        },
        include: {
          lineItems: true,
        },
      });

      res.json({
        success: true,
        data: changeOrder,
      });
    } else {
      const changeOrder = await prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          title: validated.title,
          description: validated.description,
          reason: validated.reason,
        },
        include: {
          lineItems: true,
        },
      });

      res.json({
        success: true,
        data: changeOrder,
      });
    }
  })
);

// Send change order for approval
router.post(
  '/:projectId/change-orders/:changeOrderId/send',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { changeOrderId } = req.params;

    const existing = await prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: {
        project: { select: { companyId: true } },
      },
    });

    if (!existing || existing.project.companyId !== req.companyId!) {
      throw createError('Change order not found', 404);
    }

    const changeOrder = await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: { status: ChangeOrderStatus.PENDING_APPROVAL },
    });

    // TODO: Send notification to client

    res.json({
      success: true,
      data: changeOrder,
      message: 'Change order sent for approval',
    });
  })
);

// AI detect scope changes
router.post(
  '/:projectId/change-orders/detect',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement AI scope change detection
    res.status(501).json({
      success: false,
      error: 'AI scope change detection coming soon',
    });
  })
);

export default router;
