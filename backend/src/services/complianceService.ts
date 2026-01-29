import { ComplianceStatus, ComplianceType, PropertyClassification } from '@prisma/client';
import prisma from '../db/client.js';
import { getStateRules } from './compliance/stateRules.js';

/**
 * Service for managing contractor compliance requirements including
 * preliminary notices, mechanics liens, and other state-specific deadlines.
 */
class ComplianceService {
  /**
   * Initialize compliance tracking when project work begins.
   * Creates deadline records based on state-specific rules.
   */
  async initializeProjectCompliance(
    projectId: string,
    firstWorkDate: Date
  ): Promise<any[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { company: true },
    });

    if (!project) throw new Error('Project not found');

    const rules = getStateRules(project.state);
    if (!rules) {
      console.log(`No compliance rules for state: ${project.state}`);
      return [];
    }

    const records = [];
    const propertyType = this.classifyProperty(project);

    // Create preliminary notice deadline if required
    if (rules.preliminaryNotice.required) {
      const deadline = this.addDays(firstWorkDate, rules.preliminaryNotice.deadlineDays);
      const warning = this.subDays(deadline, 7);

      const prelimRecord = await prisma.complianceRecord.create({
        data: {
          projectId,
          type: ComplianceType.PRELIMINARY_NOTICE,
          status: ComplianceStatus.PENDING,
          state: project.state,
          propertyType,
          deadlineDate: deadline,
          warningDate: warning,
          notes: rules.preliminaryNotice.description,
        },
      });
      records.push(prelimRecord);
    }

    return records;
  }

  /**
   * Calculate and create lien deadline when project completes.
   */
  async markProjectComplete(
    projectId: string,
    completionDate: Date
  ): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error('Project not found');

    const rules = getStateRules(project.state);
    if (!rules) return null;

    const propertyType = this.classifyProperty(project);

    // Use residential owner-occupied deadline if applicable
    let lienDays = rules.mechanicsLien.deadlineDays;
    if (
      propertyType === PropertyClassification.RESIDENTIAL_OWNER_OCCUPIED &&
      rules.mechanicsLien.residentialOwnerOccupied
    ) {
      lienDays = rules.mechanicsLien.residentialOwnerOccupied;
    }

    const deadline = this.addDays(completionDate, lienDays);
    const warning = this.subDays(deadline, 14); // 2 week warning for liens

    return await prisma.complianceRecord.create({
      data: {
        projectId,
        type: ComplianceType.MECHANICS_LIEN,
        status: ComplianceStatus.PENDING,
        state: project.state,
        propertyType,
        deadlineDate: deadline,
        warningDate: warning,
        notes: rules.mechanicsLien.description,
      },
    });
  }

  /**
   * Get compliance dashboard data for a company.
   * Returns categorized compliance items: overdue, urgent, upcoming, completed.
   */
  async getComplianceDashboard(companyId: string) {
    const now = new Date();
    const sevenDaysFromNow = this.addDays(now, 7);
    const thirtyDaysFromNow = this.addDays(now, 30);
    const thirtyDaysAgo = this.subDays(now, 30);

    const [overdue, urgent, upcoming, recentlyCompleted] = await Promise.all([
      // Overdue items
      prisma.complianceRecord.findMany({
        where: {
          project: { companyId },
          status: { in: [ComplianceStatus.PENDING, ComplianceStatus.WARNING] },
          deadlineDate: { lt: now },
        },
        include: {
          project: {
            select: {
              name: true,
              clientFirstName: true,
              clientLastName: true,
              address: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { deadlineDate: 'asc' },
      }),

      // Urgent (next 7 days)
      prisma.complianceRecord.findMany({
        where: {
          project: { companyId },
          status: { in: [ComplianceStatus.PENDING, ComplianceStatus.WARNING] },
          deadlineDate: { gte: now, lte: sevenDaysFromNow },
        },
        include: {
          project: {
            select: {
              name: true,
              clientFirstName: true,
              clientLastName: true,
              address: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { deadlineDate: 'asc' },
      }),

      // Upcoming (7-30 days)
      prisma.complianceRecord.findMany({
        where: {
          project: { companyId },
          status: { in: [ComplianceStatus.PENDING, ComplianceStatus.WARNING] },
          deadlineDate: { gt: sevenDaysFromNow, lte: thirtyDaysFromNow },
        },
        include: {
          project: {
            select: {
              name: true,
              clientFirstName: true,
              clientLastName: true,
              address: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: { deadlineDate: 'asc' },
      }),

      // Recently completed (last 30 days)
      prisma.complianceRecord.findMany({
        where: {
          project: { companyId },
          status: { in: [ComplianceStatus.SENT, ComplianceStatus.DELIVERED, ComplianceStatus.FILED] },
          completedDate: { gte: thirtyDaysAgo },
        },
        include: {
          project: {
            select: { name: true },
          },
        },
        orderBy: { completedDate: 'desc' },
        take: 10,
      }),
    ]);

    return {
      summary: {
        overdueCount: overdue.length,
        urgentCount: urgent.length,
        upcomingCount: upcoming.length,
        completedThisMonth: recentlyCompleted.length,
      },
      overdue,
      urgent,
      upcoming,
      recentlyCompleted,
    };
  }

  /**
   * Get compliance records for a specific project.
   */
  async getProjectCompliance(projectId: string) {
    return await prisma.complianceRecord.findMany({
      where: { projectId },
      orderBy: { deadlineDate: 'asc' },
    });
  }

  /**
   * Generate preliminary notice document content.
   */
  async generatePreliminaryNotice(recordId: string): Promise<any> {
    const record = await prisma.complianceRecord.findUnique({
      where: { id: recordId },
      include: {
        project: {
          include: { company: true },
        },
      },
    });

    if (!record) throw new Error('Compliance record not found');

    const documentContent = {
      state: record.state,
      type: 'PRELIMINARY_NOTICE',
      generatedAt: new Date().toISOString(),

      // Claimant (contractor) info
      claimant: {
        name: record.project.company.name,
        address: record.project.company.address,
        city: record.project.company.city,
        state: record.project.company.state,
        zip: record.project.company.zip,
        license: record.project.company.licenseNumber,
        phone: record.project.company.phone,
        email: record.project.company.email,
      },

      // Property info
      property: {
        address: record.project.address,
        city: record.project.city,
        state: record.project.state,
        zip: record.project.zip,
        owner: `${record.project.clientFirstName} ${record.project.clientLastName}`,
        ownerPhone: record.project.clientPhone,
        ownerEmail: record.project.clientEmail,
      },

      // Work description
      projectName: record.project.name,
      description: record.project.description || record.project.name,
      projectType: record.project.projectType,
      estimatedAmount: record.project.contractValue || record.project.estimatedTotalCost,

      // Dates
      deadlineDate: record.deadlineDate.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };

    // Update record with generated content
    await prisma.complianceRecord.update({
      where: { id: recordId },
      data: { documentContent },
    });

    return documentContent;
  }

  /**
   * Mark compliance item as sent.
   */
  async markAsSent(
    recordId: string,
    sentVia: string,
    trackingNumber?: string
  ): Promise<any> {
    return await prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        status: ComplianceStatus.SENT,
        sentVia,
        sentDate: new Date(),
        trackingNumber,
      },
    });
  }

  /**
   * Mark compliance item as delivered/confirmed.
   */
  async markAsDelivered(recordId: string): Promise<any> {
    return await prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        status: ComplianceStatus.DELIVERED,
        deliveryConfirmed: true,
        deliveryDate: new Date(),
        completedDate: new Date(),
      },
    });
  }

  /**
   * Mark compliance item as filed (for liens).
   */
  async markAsFiled(recordId: string, documentUrl?: string): Promise<any> {
    return await prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        status: ComplianceStatus.FILED,
        completedDate: new Date(),
        documentUrl,
      },
    });
  }

  /**
   * Mark compliance item as waived (lien waiver signed).
   */
  async markAsWaived(recordId: string, notes?: string): Promise<any> {
    return await prisma.complianceRecord.update({
      where: { id: recordId },
      data: {
        status: ComplianceStatus.WAIVED,
        completedDate: new Date(),
        notes,
      },
    });
  }

  /**
   * Update compliance record notes.
   */
  async updateNotes(recordId: string, notes: string): Promise<any> {
    return await prisma.complianceRecord.update({
      where: { id: recordId },
      data: { notes },
    });
  }

  /**
   * Daily job to check warnings and update statuses.
   * Should be called by a scheduled task.
   */
  async checkComplianceWarnings(companyId: string): Promise<{
    warnings: number;
    expired: number;
  }> {
    const now = new Date();

    // Find items that hit warning date but aren't marked
    const needsWarning = await prisma.complianceRecord.findMany({
      where: {
        project: { companyId },
        status: ComplianceStatus.PENDING,
        warningDate: { lte: now },
        deadlineDate: { gt: now },
      },
      include: { project: true },
    });

    // Update to WARNING status
    for (const record of needsWarning) {
      await prisma.complianceRecord.update({
        where: { id: record.id },
        data: { status: ComplianceStatus.WARNING },
      });
    }

    // Find items past deadline
    const expired = await prisma.complianceRecord.findMany({
      where: {
        project: { companyId },
        status: { in: [ComplianceStatus.PENDING, ComplianceStatus.WARNING] },
        deadlineDate: { lt: now },
      },
    });

    for (const record of expired) {
      await prisma.complianceRecord.update({
        where: { id: record.id },
        data: { status: ComplianceStatus.EXPIRED },
      });
    }

    return { warnings: needsWarning.length, expired: expired.length };
  }

  /**
   * Get state rules summary for a project's state.
   */
  async getStateRulesForProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error('Project not found');

    const rules = getStateRules(project.state);
    if (!rules) {
      return {
        state: project.state,
        hasRules: false,
        message: `No compliance rules available for ${project.state}`,
      };
    }

    return {
      state: project.state,
      hasRules: true,
      rules: {
        preliminaryNotice: {
          required: rules.preliminaryNotice.required,
          deadlineDays: rules.preliminaryNotice.deadlineDays,
          description: rules.preliminaryNotice.description,
        },
        mechanicsLien: {
          deadlineDays: rules.mechanicsLien.deadlineDays,
          fromEvent: rules.mechanicsLien.fromEvent,
          residentialOwnerOccupied: rules.mechanicsLien.residentialOwnerOccupied,
          description: rules.mechanicsLien.description,
        },
        noticeOfCompletion: rules.noticeOfCompletion,
      },
    };
  }

  /**
   * Classify property type based on project data.
   */
  private classifyProperty(project: any): PropertyClassification {
    const projectType = project.projectType?.toUpperCase() || '';

    // Commercial project types
    if (
      projectType.includes('COMMERCIAL') ||
      projectType.includes('TENANT_IMPROVEMENT') ||
      projectType.includes('BUILDOUT')
    ) {
      return PropertyClassification.COMMERCIAL;
    }

    // Default to residential owner-occupied for most residential projects
    // In production, this would use more sophisticated logic or user input
    return PropertyClassification.RESIDENTIAL_OWNER_OCCUPIED;
  }

  /**
   * Helper: Add days to a date.
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Helper: Subtract days from a date.
   */
  private subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }
}

export const complianceService = new ComplianceService();
