import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Get company details
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId! },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            leads: true,
            projects: true,
            proposals: true,
            templates: true,
          },
        },
      },
    });

    if (!company) {
      throw createError('Company not found', 404);
    }

    res.json({
      success: true,
      data: company,
    });
  })
);

// Update company settings
router.put(
  '/',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional().or(z.literal('')),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      licenseNumber: z.string().optional(),
      insuranceInfo: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      proposalHeaderHtml: z.string().optional(),
      proposalFooterHtml: z.string().optional(),
      emailSignature: z.string().optional(),
      settings: z.record(z.unknown()).optional(),
    });

    const validated = updateSchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: req.companyId! },
      data: validated,
    });

    res.json({
      success: true,
      data: company,
    });
  })
);

// Upload company logo
router.post(
  '/logo',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    // TODO: Implement file upload to S3
    res.status(501).json({
      success: false,
      error: 'Logo upload coming soon',
    });
  })
);

// Get pricing configuration
router.get(
  '/pricing',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId! },
      select: { pricingConfig: true },
    });

    res.json({
      success: true,
      data: company?.pricingConfig || {},
    });
  })
);

// Update pricing configuration
router.put(
  '/pricing',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const pricingSchema = z.object({
      defaultLaborRate: z.number().nonnegative().optional(),
      helperLaborRate: z.number().nonnegative().optional(),
      materialMarkup: z.number().nonnegative().optional(),
      overheadPercent: z.number().nonnegative().optional(),
      profitMarginPercent: z.number().nonnegative().optional(),
      // Trade-specific rates
      rates: z.record(z.number()).optional(),
    });

    const validated = pricingSchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: req.companyId! },
      data: { pricingConfig: validated },
    });

    res.json({
      success: true,
      data: company.pricingConfig,
    });
  })
);

// List templates
router.get(
  '/templates',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { type } = req.query;

    const templates = await prisma.template.findMany({
      where: {
        companyId: req.companyId!,
        ...(type && { type: type as any }),
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: templates,
    });
  })
);

// Create template
router.post(
  '/templates',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const templateSchema = z.object({
      type: z.enum(['PROPOSAL', 'ESTIMATE', 'SCOPE_OF_WORK', 'TERMS_AND_CONDITIONS', 'EMAIL', 'SMS']),
      name: z.string().min(1),
      description: z.string().optional(),
      content: z.record(z.unknown()),
      isDefault: z.boolean().default(false),
    });

    const validated = templateSchema.parse(req.body);

    // If setting as default, unset other defaults of same type
    if (validated.isDefault) {
      await prisma.template.updateMany({
        where: {
          companyId: req.companyId!,
          type: validated.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.template.create({
      data: {
        ...validated,
        companyId: req.companyId!,
      },
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  })
);

// Update template
router.put(
  '/templates/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const templateSchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      content: z.record(z.unknown()).optional(),
      isDefault: z.boolean().optional(),
    });

    const validated = templateSchema.parse(req.body);

    const existing = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.companyId !== req.companyId!) {
      throw createError('Template not found', 404);
    }

    // If setting as default, unset other defaults of same type
    if (validated.isDefault) {
      await prisma.template.updateMany({
        where: {
          companyId: req.companyId!,
          type: existing.type,
          isDefault: true,
          id: { not: req.params.id },
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: validated,
    });

    res.json({
      success: true,
      data: template,
    });
  })
);

// Delete template
router.delete(
  '/templates/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const existing = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!existing || existing.companyId !== req.companyId!) {
      throw createError('Template not found', 404);
    }

    await prisma.template.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  })
);

// Integration settings
router.put(
  '/integrations',
  requireRole('OWNER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const integrationsSchema = z.object({
      goHighLevelApiKey: z.string().optional(),
      goHighLevelLocationId: z.string().optional(),
      stripeAccountId: z.string().optional(),
      retellAgentId: z.string().optional(),
    });

    const validated = integrationsSchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: req.companyId! },
      data: validated,
    });

    // Don't return API keys in response
    res.json({
      success: true,
      data: {
        hasGoHighLevel: !!company.goHighLevelApiKey,
        hasStripe: !!company.stripeAccountId,
        hasRetell: !!company.retellAgentId,
      },
    });
  })
);

export default router;
