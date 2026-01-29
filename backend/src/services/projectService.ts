import prisma from '../db/client.js';
import { ProjectStatus, ProjectType, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler.js';

export interface CreateProjectData {
  name: string;
  description?: string;
  projectType: ProjectType;
  address: string;
  city: string;
  state: string;
  zip: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail?: string;
  clientPhone: string;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  companyId: string;
  assignedToId: string;
  leadId?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
  contractValue?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  actualStartDate?: Date;
  actualEndDate?: Date;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  projectType?: ProjectType;
  assignedToId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProjectService {
  async create(data: CreateProjectData) {
    // Generate project number
    const projectCount = await prisma.project.count({
      where: { companyId: data.companyId },
    });
    const projectNumber = `P-${(projectCount + 1).toString().padStart(5, '0')}`;

    return prisma.project.create({
      data: {
        projectNumber,
        name: data.name,
        description: data.description,
        projectType: data.projectType,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        clientFirstName: data.clientFirstName,
        clientLastName: data.clientLastName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        estimatedStartDate: data.estimatedStartDate,
        estimatedEndDate: data.estimatedEndDate,
        companyId: data.companyId,
        assignedToId: data.assignedToId,
        leadId: data.leadId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findById(id: string, companyId: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, source: true },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        changeOrders: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            timeEntries: true,
            materialPurchases: true,
            invoices: true,
          },
        },
      },
    });

    if (!project || project.companyId !== companyId) {
      throw createError('Project not found', 404);
    }

    return project;
  }

  async findMany(
    companyId: string,
    filters: ProjectFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ) {
    const where: Prisma.ProjectWhereInput = {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.projectType && { projectType: filters.projectType }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { projectNumber: { contains: filters.search, mode: 'insensitive' } },
          { clientFirstName: { contains: filters.search, mode: 'insensitive' } },
          { clientLastName: { contains: filters.search, mode: 'insensitive' } },
          { address: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              estimates: true,
              proposals: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async update(id: string, companyId: string, data: UpdateProjectData) {
    // Verify project belongs to company
    await this.findById(id, companyId);

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.projectType !== undefined && { projectType: data.projectType }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.clientFirstName !== undefined && { clientFirstName: data.clientFirstName }),
        ...(data.clientLastName !== undefined && { clientLastName: data.clientLastName }),
        ...(data.clientEmail !== undefined && { clientEmail: data.clientEmail }),
        ...(data.clientPhone !== undefined && { clientPhone: data.clientPhone }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.estimatedStartDate !== undefined && { estimatedStartDate: data.estimatedStartDate }),
        ...(data.estimatedEndDate !== undefined && { estimatedEndDate: data.estimatedEndDate }),
        ...(data.actualStartDate !== undefined && { actualStartDate: data.actualStartDate }),
        ...(data.actualEndDate !== undefined && { actualEndDate: data.actualEndDate }),
        ...(data.contractValue !== undefined && { contractValue: data.contractValue }),
        ...(data.depositAmount !== undefined && { depositAmount: data.depositAmount }),
        ...(data.depositPaid !== undefined && { depositPaid: data.depositPaid }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string, companyId: string) {
    // Verify project belongs to company
    await this.findById(id, companyId);

    // Soft delete by setting status to CANCELLED
    return prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.CANCELLED },
    });
  }

  async addPhoto(
    projectId: string,
    companyId: string,
    data: { url: string; filename: string; category?: string; description?: string }
  ) {
    await this.findById(projectId, companyId);

    return prisma.projectPhoto.create({
      data: {
        projectId,
        url: data.url,
        filename: data.filename,
        category: data.category,
        description: data.description,
      },
    });
  }

  async getFinancialSummary(id: string, companyId: string) {
    const project = await this.findById(id, companyId);

    // Get all time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
    });

    // Get all material purchases
    const materialPurchases = await prisma.materialPurchase.findMany({
      where: { projectId: id },
    });

    // Calculate actuals
    const actualLaborCost = timeEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const actualMaterialCost = materialPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
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

    return {
      projectId: id,
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
      deposit: {
        amount: project.depositAmount,
        paid: project.depositPaid,
      },
    };
  }
}

export const projectService = new ProjectService();
