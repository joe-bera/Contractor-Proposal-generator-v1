import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { ProjectStatus, ProjectType } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { projectService } from '../services/projectService.js';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  projectType: z.nativeEnum(ProjectType),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(5, 'Valid ZIP code is required'),
  clientFirstName: z.string().min(1, 'Client first name is required'),
  clientLastName: z.string().min(1, 'Client last name is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().min(10, 'Valid phone number is required'),
  estimatedStartDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
  assignedToId: z.string().min(1, 'Assigned user is required'),
  leadId: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
  contractValue: z.number().nonnegative().optional(),
  depositAmount: z.number().nonnegative().optional(),
  depositPaid: z.boolean().optional(),
  actualStartDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'status', 'updatedAt', 'contractValue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(ProjectStatus).optional(),
  projectType: z.nativeEnum(ProjectType).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// Apply auth middleware
router.use(authMiddleware);

// Create project
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validated = createProjectSchema.parse(req.body);

    const project = await projectService.create({
      ...validated,
      companyId: req.companyId!,
      clientEmail: validated.clientEmail || undefined,
      estimatedStartDate: validated.estimatedStartDate ? new Date(validated.estimatedStartDate) : undefined,
      estimatedEndDate: validated.estimatedEndDate ? new Date(validated.estimatedEndDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

// List projects
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const params = paginationSchema.parse(req.query);

    const result = await projectService.findMany(
      req.companyId!,
      {
        status: params.status,
        projectType: params.projectType,
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

// Get single project
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const project = await projectService.findById(req.params.id, req.companyId!);

    res.json({
      success: true,
      data: project,
    });
  })
);

// Update project
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validated = updateProjectSchema.parse(req.body);

    const project = await projectService.update(req.params.id, req.companyId!, {
      ...validated,
      estimatedStartDate: validated.estimatedStartDate ? new Date(validated.estimatedStartDate) : undefined,
      estimatedEndDate: validated.estimatedEndDate ? new Date(validated.estimatedEndDate) : undefined,
      actualStartDate: validated.actualStartDate ? new Date(validated.actualStartDate) : undefined,
      actualEndDate: validated.actualEndDate ? new Date(validated.actualEndDate) : undefined,
    });

    res.json({
      success: true,
      data: project,
    });
  })
);

// Delete project (soft delete)
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await projectService.delete(req.params.id, req.companyId!);

    res.json({
      success: true,
      message: 'Project cancelled successfully',
    });
  })
);

// Get project financial summary
router.get(
  '/:id/summary',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const summary = await projectService.getFinancialSummary(req.params.id, req.companyId!);

    res.json({
      success: true,
      data: summary,
    });
  })
);

export default router;
