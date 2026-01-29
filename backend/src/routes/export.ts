import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Export proposal to PDF
router.get(
  '/proposals/:id/pdf',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        company: true,
        createdBy: true,
      },
    });

    if (!proposal || proposal.companyId !== req.companyId!) {
      throw createError('Proposal not found', 404);
    }

    // TODO: Implement PDF generation with Puppeteer
    res.status(501).json({
      success: false,
      error: 'PDF export coming soon',
    });
  })
);

// Export estimate to PDF
router.get(
  '/estimates/:id/pdf',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const estimate = await prisma.estimate.findUnique({
      where: { id: req.params.id },
      include: {
        lineItems: true,
        project: {
          include: { company: true },
        },
      },
    });

    if (!estimate || estimate.project.companyId !== req.companyId!) {
      throw createError('Estimate not found', 404);
    }

    // TODO: Implement PDF generation
    res.status(501).json({
      success: false,
      error: 'PDF export coming soon',
    });
  })
);

// Export change order to PDF
router.get(
  '/change-orders/:id/pdf',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: req.params.id },
      include: {
        lineItems: true,
        project: {
          include: { company: true },
        },
      },
    });

    if (!changeOrder || changeOrder.project.companyId !== req.companyId!) {
      throw createError('Change order not found', 404);
    }

    // TODO: Implement PDF generation
    res.status(501).json({
      success: false,
      error: 'PDF export coming soon',
    });
  })
);

export default router;
