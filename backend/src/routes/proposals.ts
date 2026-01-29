import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { ProposalStatus } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { createError } from '../middleware/errorHandler.js';
import { proposalService } from '../services/proposalService.js';

const router = Router();

// Validation schemas
const tierSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  items: z.array(z.object({
    description: z.string(),
    included: z.boolean(),
  })).optional(),
});

const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  introduction: z.string().optional(),
  scopeOfWork: z.string().optional(),
  exclusions: z.string().optional(),
  termsAndConditions: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'premium', 'value']).default('professional'),
  goodTierName: z.string().default('Standard'),
  goodTierDescription: z.string().optional(),
  goodTierPrice: z.number().nonnegative(),
  goodTierItems: z.array(z.any()).optional(),
  betterTierName: z.string().default('Enhanced'),
  betterTierDescription: z.string().optional(),
  betterTierPrice: z.number().nonnegative(),
  betterTierItems: z.array(z.any()).optional(),
  bestTierName: z.string().default('Premium'),
  bestTierDescription: z.string().optional(),
  bestTierPrice: z.number().nonnegative(),
  bestTierItems: z.array(z.any()).optional(),
  estimatedDuration: z.string().optional(),
  proposedStartDate: z.string().datetime().optional(),
  depositPercent: z.number().min(0).max(100).default(50),
  paymentSchedule: z.array(z.object({
    milestone: z.string(),
    percent: z.number(),
  })).optional(),
});

const signProposalSchema = z.object({
  selectedTier: z.enum(['good', 'better', 'best']),
  signerName: z.string().min(1, 'Signer name is required'),
  signerEmail: z.string().email('Valid email is required'),
  signatureData: z.string().min(1, 'Signature is required'),
});

// Protected routes (require auth)
router.use('/:projectId/proposals', authMiddleware);

// Create proposal
router.post(
  '/:projectId/proposals',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = createProposalSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Generate unique public URL
    const publicUrl = nanoid(12);

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        companyId: req.companyId!,
        createdById: req.userId!,
        title: validated.title,
        introduction: validated.introduction,
        scopeOfWork: validated.scopeOfWork,
        exclusions: validated.exclusions,
        termsAndConditions: validated.termsAndConditions,
        tone: validated.tone,
        goodTierName: validated.goodTierName,
        goodTierDescription: validated.goodTierDescription,
        goodTierPrice: validated.goodTierPrice,
        goodTierItems: validated.goodTierItems,
        betterTierName: validated.betterTierName,
        betterTierDescription: validated.betterTierDescription,
        betterTierPrice: validated.betterTierPrice,
        betterTierItems: validated.betterTierItems,
        bestTierName: validated.bestTierName,
        bestTierDescription: validated.bestTierDescription,
        bestTierPrice: validated.bestTierPrice,
        bestTierItems: validated.bestTierItems,
        estimatedDuration: validated.estimatedDuration,
        proposedStartDate: validated.proposedStartDate ? new Date(validated.proposedStartDate) : undefined,
        depositPercent: validated.depositPercent,
        paymentSchedule: validated.paymentSchedule,
        publicUrl,
      },
      include: {
        project: {
          select: {
            name: true,
            clientFirstName: true,
            clientLastName: true,
            clientEmail: true,
          },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: proposal,
    });
  })
);

// AI Generate proposal from estimate
const aiGenerateSchema = z.object({
  estimateId: z.string().min(1, 'Estimate ID is required'),
  tone: z.enum(['professional', 'friendly', 'premium', 'value']).default('professional'),
  targetMargin: z.number().min(0).max(100).default(20),
  customInstructions: z.string().optional(),
});

router.post(
  '/:projectId/proposals/ai-generate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;
    const validated = aiGenerateSchema.parse(req.body);

    // Verify project belongs to company
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    // Verify estimate exists and belongs to project
    const estimate = await prisma.estimate.findUnique({
      where: { id: validated.estimateId },
    });

    if (!estimate || estimate.projectId !== projectId) {
      throw createError('Estimate not found', 404);
    }

    // Generate AI proposal
    const aiOutput = await proposalService.generateProposal({
      estimateId: validated.estimateId,
      projectId,
      companyId: req.companyId!,
      tone: validated.tone,
      targetMargin: validated.targetMargin,
      customInstructions: validated.customInstructions,
    });

    // Save the proposal
    const proposalId = await proposalService.saveProposal(
      projectId,
      req.companyId!,
      req.userId!,
      validated.estimateId,
      aiOutput,
      validated.tone
    );

    // Fetch the complete proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        project: {
          select: {
            name: true,
            clientFirstName: true,
            clientLastName: true,
            clientEmail: true,
          },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: proposal,
      aiOutput: {
        suggestedUpsells: aiOutput.suggestedUpsells,
        followUpSequence: aiOutput.followUpSequence,
      },
    });
  })
);

// List project proposals
router.get(
  '/:projectId/proposals',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.companyId !== req.companyId!) {
      throw createError('Project not found', 404);
    }

    const proposals = await prisma.proposal.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: proposals,
    });
  })
);

// Get single proposal
router.get(
  '/:projectId/proposals/:proposalId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { proposalId } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        project: true,
        company: {
          select: {
            name: true,
            logoUrl: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            licenseNumber: true,
          },
        },
        createdBy: {
          select: { name: true, email: true, phone: true },
        },
        followUps: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!proposal || proposal.companyId !== req.companyId!) {
      throw createError('Proposal not found', 404);
    }

    res.json({
      success: true,
      data: proposal,
    });
  })
);

// Update proposal
router.put(
  '/:projectId/proposals/:proposalId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { proposalId } = req.params;
    const validated = createProposalSchema.partial().parse(req.body);

    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!existing || existing.companyId !== req.companyId!) {
      throw createError('Proposal not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw createError('Only draft proposals can be edited', 400);
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        ...validated,
        proposedStartDate: validated.proposedStartDate ? new Date(validated.proposedStartDate) : undefined,
        version: { increment: 1 },
      },
    });

    res.json({
      success: true,
      data: proposal,
    });
  })
);

// Send proposal
router.post(
  '/:projectId/proposals/:proposalId/send',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { proposalId } = req.params;

    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        project: true,
      },
    });

    if (!existing || existing.companyId !== req.companyId!) {
      throw createError('Proposal not found', 404);
    }

    // Update status to SENT
    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.SENT },
    });

    // Update project status
    await prisma.project.update({
      where: { id: existing.projectId },
      data: { status: 'PROPOSAL_SENT' },
    });

    // TODO: Send email/SMS to client

    const proposalUrl = `${process.env.FRONTEND_URL}/proposal/${existing.publicUrl}`;

    res.json({
      success: true,
      data: proposal,
      message: 'Proposal sent successfully',
      proposalUrl,
    });
  })
);

// ====== PUBLIC ROUTES (no auth required) ======

// Public proposal view
router.get(
  '/:publicUrl',
  optionalAuthMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { publicUrl } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { publicUrl },
      include: {
        project: {
          select: {
            name: true,
            address: true,
            city: true,
            state: true,
            clientFirstName: true,
            clientLastName: true,
          },
        },
        company: {
          select: {
            name: true,
            logoUrl: true,
            phone: true,
            email: true,
            website: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            licenseNumber: true,
            insuranceInfo: true,
            primaryColor: true,
            secondaryColor: true,
            proposalHeaderHtml: true,
            proposalFooterHtml: true,
          },
        },
      },
    });

    if (!proposal) {
      throw createError('Proposal not found', 404);
    }

    // Track view (only if not the proposal creator)
    if (!req.userId || req.userId !== proposal.createdById) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
          status: proposal.status === 'SENT' ? 'VIEWED' : proposal.status,
        },
      });

      // Update project status if first view
      if (proposal.status === 'SENT') {
        await prisma.project.update({
          where: { id: proposal.projectId },
          data: { status: 'PROPOSAL_VIEWED' },
        });
      }
    }

    res.json({
      success: true,
      data: proposal,
    });
  })
);

// Sign proposal
router.post(
  '/:publicUrl/sign',
  asyncHandler(async (req, res) => {
    const { publicUrl } = req.params;
    const validated = signProposalSchema.parse(req.body);

    const proposal = await prisma.proposal.findUnique({
      where: { publicUrl },
    });

    if (!proposal) {
      throw createError('Proposal not found', 404);
    }

    if (proposal.signedAt) {
      throw createError('Proposal has already been signed', 400);
    }

    // Get price for selected tier
    let selectedPrice = 0;
    switch (validated.selectedTier) {
      case 'good':
        selectedPrice = proposal.goodTierPrice;
        break;
      case 'better':
        selectedPrice = proposal.betterTierPrice;
        break;
      case 'best':
        selectedPrice = proposal.bestTierPrice;
        break;
    }

    const depositAmount = selectedPrice * (proposal.depositPercent / 100);

    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.SIGNED,
        selectedTier: validated.selectedTier,
        signerName: validated.signerName,
        signerEmail: validated.signerEmail,
        signatureData: validated.signatureData,
        signerIp: req.ip,
        signedAt: new Date(),
      },
    });

    // Update project
    await prisma.project.update({
      where: { id: proposal.projectId },
      data: {
        status: 'ACCEPTED',
        contractValue: selectedPrice,
        depositAmount,
      },
    });

    res.json({
      success: true,
      data: updated,
      depositAmount,
      message: 'Proposal signed successfully',
    });
  })
);

// Pay deposit
router.post(
  '/:publicUrl/pay-deposit',
  asyncHandler(async (req, res) => {
    const { publicUrl } = req.params;

    const proposal = await prisma.proposal.findUnique({
      where: { publicUrl },
    });

    if (!proposal) {
      throw createError('Proposal not found', 404);
    }

    if (!proposal.signedAt) {
      throw createError('Please sign the proposal before paying the deposit', 400);
    }

    // TODO: Implement Stripe payment
    res.status(501).json({
      success: false,
      error: 'Payment processing coming soon',
    });
  })
);

export default router;
