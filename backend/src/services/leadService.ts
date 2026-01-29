import prisma from '../db/client.js';
import { LeadStatus, LeadSource, Prisma } from '@prisma/client';
import { createError } from '../middleware/errorHandler.js';

export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  projectType?: string;
  projectDescription?: string;
  estimatedBudget?: number;
  desiredTimeline?: string;
  urgency?: string;
  source?: LeadSource;
  companyId: string;
  assignedToId?: string;
  // Voice AI data
  voiceCallId?: string;
  voiceTranscript?: string;
  voiceCallDuration?: number;
  voiceQualificationData?: Record<string, unknown>;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  status?: LeadStatus;
  appointmentDate?: Date;
  appointmentNotes?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
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

class LeadService {
  async create(data: CreateLeadData) {
    return prisma.lead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        projectType: data.projectType,
        projectDescription: data.projectDescription,
        estimatedBudget: data.estimatedBudget,
        desiredTimeline: data.desiredTimeline,
        urgency: data.urgency || 'normal',
        source: data.source || LeadSource.OTHER,
        companyId: data.companyId,
        assignedToId: data.assignedToId,
        voiceCallId: data.voiceCallId,
        voiceTranscript: data.voiceTranscript,
        voiceCallDuration: data.voiceCallDuration,
        voiceQualificationData: data.voiceQualificationData as Prisma.InputJsonValue,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        photos: true,
        notes: true,
      },
    });
  }

  async findById(id: string, companyId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        photos: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        convertedToProject: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!lead || lead.companyId !== companyId) {
      throw createError('Lead not found', 404);
    }

    return lead;
  }

  async findMany(
    companyId: string,
    filters: LeadFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ) {
    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.source && { source: filters.source }),
      ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { projectDescription: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true },
          },
          photos: {
            take: 1,
          },
          _count: {
            select: { notes: true },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async update(id: string, companyId: string, data: UpdateLeadData) {
    // Verify lead belongs to company
    await this.findById(id, companyId);

    return prisma.lead.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.projectType !== undefined && { projectType: data.projectType }),
        ...(data.projectDescription !== undefined && { projectDescription: data.projectDescription }),
        ...(data.estimatedBudget !== undefined && { estimatedBudget: data.estimatedBudget }),
        ...(data.desiredTimeline !== undefined && { desiredTimeline: data.desiredTimeline }),
        ...(data.urgency !== undefined && { urgency: data.urgency }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.appointmentDate !== undefined && { appointmentDate: data.appointmentDate }),
        ...(data.appointmentNotes !== undefined && { appointmentNotes: data.appointmentNotes }),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        photos: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async delete(id: string, companyId: string) {
    // Verify lead belongs to company
    await this.findById(id, companyId);

    return prisma.lead.delete({
      where: { id },
    });
  }

  async addNote(leadId: string, companyId: string, content: string) {
    // Verify lead belongs to company
    await this.findById(leadId, companyId);

    return prisma.leadNote.create({
      data: {
        leadId,
        content,
      },
    });
  }

  async addPhoto(leadId: string, companyId: string, data: { url: string; filename: string; description?: string }) {
    // Verify lead belongs to company
    await this.findById(leadId, companyId);

    return prisma.leadPhoto.create({
      data: {
        leadId,
        url: data.url,
        filename: data.filename,
        description: data.description,
      },
    });
  }

  async convertToProject(leadId: string, companyId: string, projectData: {
    name: string;
    projectType: string;
    assignedToId: string;
  }) {
    const lead = await this.findById(leadId, companyId);

    if (lead.convertedToProject) {
      throw createError('Lead has already been converted to a project', 400);
    }

    // Create project from lead data
    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        projectType: projectData.projectType as any,
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        zip: lead.zip || '',
        clientFirstName: lead.firstName,
        clientLastName: lead.lastName,
        clientEmail: lead.email,
        clientPhone: lead.phone,
        description: lead.projectDescription,
        companyId,
        assignedToId: projectData.assignedToId,
        leadId: lead.id,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.WON },
    });

    return project;
  }
}

export const leadService = new LeadService();
