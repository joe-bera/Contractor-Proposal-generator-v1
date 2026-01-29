import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { LeadStatus, LeadSource } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { leadService } from '../services/leadService.js';

const router = Router();

// Validation schemas
const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  projectType: z.string().optional(),
  projectDescription: z.string().optional(),
  estimatedBudget: z.number().positive().optional(),
  desiredTimeline: z.string().optional(),
  urgency: z.enum(['low', 'normal', 'urgent', 'emergency']).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedToId: z.string().optional(),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.nativeEnum(LeadStatus).optional(),
  appointmentDate: z.string().datetime().optional(),
  appointmentNotes: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'status', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create lead
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validated = createLeadSchema.parse(req.body);

    const lead = await leadService.create({
      ...validated,
      companyId: req.companyId!,
      email: validated.email || undefined,
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  })
);

// List leads with filters and pagination
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = paginationSchema.parse(req.query);

    const result = await leadService.findMany(
      req.companyId!,
      {
        status: params.status,
        source: params.source,
        assignedToId: params.assignedToId,
        search: params.search,
        fromDate: params.fromDate ? new Date(params.fromDate) : undefined,
        toDate: params.toDate ? new Date(params.toDate) : undefined,
      },
      {
        page: params.page,
        pageSize: params.pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

// Get single lead
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const lead = await leadService.findById(req.params.id, req.companyId!);

    res.json({
      success: true,
      data: lead,
    });
  })
);

// Update lead
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validated = updateLeadSchema.parse(req.body);

    const lead = await leadService.update(req.params.id, req.companyId!, {
      ...validated,
      appointmentDate: validated.appointmentDate ? new Date(validated.appointmentDate) : undefined,
    });

    res.json({
      success: true,
      data: lead,
    });
  })
);

// Delete lead
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await leadService.delete(req.params.id, req.companyId!);

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  })
);

// Add note to lead
router.post(
  '/:id/notes',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

    const note = await leadService.addNote(req.params.id, req.companyId!, content);

    res.status(201).json({
      success: true,
      data: note,
    });
  })
);

// Convert lead to project
router.post(
  '/:id/convert',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validated = z.object({
      name: z.string().min(1, 'Project name is required'),
      projectType: z.string().min(1, 'Project type is required'),
      assignedToId: z.string().min(1, 'Assigned user is required'),
    }).parse(req.body);

    const project = await leadService.convertToProject(
      req.params.id,
      req.companyId!,
      validated
    );

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

export default router;
