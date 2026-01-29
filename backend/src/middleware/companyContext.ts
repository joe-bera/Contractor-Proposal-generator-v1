import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import prisma from '../db/client.js';

// Ensures all queries are scoped to the authenticated user's company
export function companyContextMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.companyId) {
    res.status(400).json({
      success: false,
      error: 'Company context not available',
    });
    return;
  }
  next();
}

// Helper to add company filter to Prisma queries
export function withCompanyFilter(companyId: string) {
  return { companyId };
}

// Helper to validate entity belongs to company
export async function validateCompanyAccess(
  entityType: 'lead' | 'project' | 'proposal' | 'estimate' | 'changeOrder',
  entityId: string,
  companyId: string
): Promise<boolean> {
  const modelMap: Record<string, keyof typeof prisma> = {
    lead: 'lead',
    project: 'project',
    proposal: 'proposal',
    estimate: 'estimate',
    changeOrder: 'changeOrder',
  };

  const model = modelMap[entityType] as 'lead' | 'project' | 'proposal';

  if (entityType === 'estimate' || entityType === 'changeOrder') {
    // These are nested under project, need different validation
    const entity = await (prisma[entityType] as any).findUnique({
      where: { id: entityId },
      include: { project: { select: { companyId: true } } },
    });
    return entity?.project?.companyId === companyId;
  }

  const entity = await (prisma[model] as any).findUnique({
    where: { id: entityId },
    select: { companyId: true },
  });

  return entity?.companyId === companyId;
}
