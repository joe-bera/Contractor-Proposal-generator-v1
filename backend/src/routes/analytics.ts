import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../db/client.js';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

// Proposal analytics
router.get(
  '/proposals',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const proposals = await prisma.proposal.findMany({
      where: { companyId: req.companyId! },
      select: {
        status: true,
        selectedTier: true,
        outcome: true,
        lostReason: true,
        goodTierPrice: true,
        betterTierPrice: true,
        bestTierPrice: true,
        createdAt: true,
        signedAt: true,
      },
    });

    const total = proposals.length;
    const sent = proposals.filter(p => p.status !== 'DRAFT').length;
    const viewed = proposals.filter(p => ['VIEWED', 'SIGNED', 'DEPOSIT_PAID'].includes(p.status)).length;
    const signed = proposals.filter(p => ['SIGNED', 'DEPOSIT_PAID'].includes(p.status)).length;
    const depositPaid = proposals.filter(p => p.status === 'DEPOSIT_PAID').length;

    // Tier breakdown
    const tierBreakdown = {
      good: proposals.filter(p => p.selectedTier === 'good').length,
      better: proposals.filter(p => p.selectedTier === 'better').length,
      best: proposals.filter(p => p.selectedTier === 'best').length,
    };

    // Average value by tier
    const signedProposals = proposals.filter(p => p.signedAt);
    const averageValue = signedProposals.length > 0
      ? signedProposals.reduce((sum, p) => {
          switch (p.selectedTier) {
            case 'good': return sum + p.goodTierPrice;
            case 'better': return sum + p.betterTierPrice;
            case 'best': return sum + p.bestTierPrice;
            default: return sum;
          }
        }, 0) / signedProposals.length
      : 0;

    // Average time to sign
    const signedWithDates = signedProposals.filter(p => p.signedAt && p.createdAt);
    const avgTimeToSign = signedWithDates.length > 0
      ? signedWithDates.reduce((sum, p) => {
          const days = (p.signedAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / signedWithDates.length
      : 0;

    // Win/loss reasons
    const lostProposals = proposals.filter(p => p.outcome && p.outcome.startsWith('LOST'));
    const winLossReasons = Object.entries(
      lostProposals.reduce<Record<string, number>>((acc, p) => {
        const reason = p.outcome || 'UNKNOWN';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {})
    ).map(([reason, count]) => ({ reason, count }));

    res.json({
      success: true,
      data: {
        totalProposals: total,
        sentProposals: sent,
        viewedProposals: viewed,
        signedProposals: signed,
        depositPaidProposals: depositPaid,
        viewRate: sent > 0 ? (viewed / sent) * 100 : 0,
        signRate: viewed > 0 ? (signed / viewed) * 100 : 0,
        averageTimeToSign: avgTimeToSign,
        averageProposalValue: averageValue,
        tierBreakdown,
        winLossReasons,
      },
    });
  })
);

// Profitability analytics
router.get(
  '/profitability',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projects = await prisma.project.findMany({
      where: {
        companyId: req.companyId!,
        status: { in: ['COMPLETED', 'INVOICED', 'PAID'] },
      },
      select: {
        projectType: true,
        contractValue: true,
        actualTotalCost: true,
        actualProfit: true,
        actualMargin: true,
      },
    });

    const total = projects.length;
    const totalRevenue = projects.reduce((sum, p) => sum + p.contractValue, 0);
    const totalCost = projects.reduce((sum, p) => sum + p.actualTotalCost, 0);
    const totalProfit = projects.reduce((sum, p) => sum + p.actualProfit, 0);
    const averageMargin = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.actualMargin, 0) / projects.length
      : 0;

    // By project type
    const byType = Object.entries(
      projects.reduce<Record<string, { count: number; profit: number; margin: number }>>((acc, p) => {
        if (!acc[p.projectType]) {
          acc[p.projectType] = { count: 0, profit: 0, margin: 0 };
        }
        acc[p.projectType].count++;
        acc[p.projectType].profit += p.actualProfit;
        acc[p.projectType].margin += p.actualMargin;
        return acc;
      }, {})
    ).map(([type, data]) => ({
      type,
      count: data.count,
      averageProfit: data.profit / data.count,
      averageMargin: data.margin / data.count,
    }));

    res.json({
      success: true,
      data: {
        totalProjects: total,
        completedProjects: total,
        totalRevenue,
        totalCost,
        totalProfit,
        averageMargin,
        projectsByType: byType,
      },
    });
  })
);

// Estimation accuracy analytics
router.get(
  '/estimation-accuracy',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projects = await prisma.project.findMany({
      where: {
        companyId: req.companyId!,
        status: { in: ['COMPLETED', 'INVOICED', 'PAID'] },
        estimatedTotalCost: { gt: 0 },
      },
      select: {
        estimatedMaterialCost: true,
        estimatedLaborCost: true,
        estimatedTotalCost: true,
        actualMaterialCost: true,
        actualLaborCost: true,
        actualTotalCost: true,
      },
    });

    const total = projects.length;
    if (total === 0) {
      res.json({
        success: true,
        data: {
          totalCompletedProjects: 0,
          averageVariancePercent: 0,
          materialAccuracy: 0,
          laborAccuracy: 0,
          overEstimatedCount: 0,
          underEstimatedCount: 0,
          accurateCount: 0,
        },
      });
      return;
    }

    let overEstimated = 0;
    let underEstimated = 0;
    let accurate = 0;
    let totalVariance = 0;
    let materialVariance = 0;
    let laborVariance = 0;

    projects.forEach(p => {
      const variance = ((p.actualTotalCost - p.estimatedTotalCost) / p.estimatedTotalCost) * 100;
      totalVariance += Math.abs(variance);

      if (variance > 10) underEstimated++;
      else if (variance < -10) overEstimated++;
      else accurate++;

      if (p.estimatedMaterialCost > 0) {
        materialVariance += Math.abs((p.actualMaterialCost - p.estimatedMaterialCost) / p.estimatedMaterialCost) * 100;
      }
      if (p.estimatedLaborCost > 0) {
        laborVariance += Math.abs((p.actualLaborCost - p.estimatedLaborCost) / p.estimatedLaborCost) * 100;
      }
    });

    res.json({
      success: true,
      data: {
        totalCompletedProjects: total,
        averageVariancePercent: totalVariance / total,
        materialAccuracy: 100 - (materialVariance / total),
        laborAccuracy: 100 - (laborVariance / total),
        overEstimatedCount: overEstimated,
        underEstimatedCount: underEstimated,
        accurateCount: accurate,
      },
    });
  })
);

// Lead conversion analytics
router.get(
  '/lead-conversion',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const leads = await prisma.lead.findMany({
      where: { companyId: req.companyId! },
      select: {
        status: true,
        source: true,
        createdAt: true,
        convertedToProject: {
          select: { createdAt: true },
        },
      },
    });

    const total = leads.length;
    const won = leads.filter(l => l.status === 'WON').length;
    const conversionRate = total > 0 ? (won / total) * 100 : 0;

    // By status
    const byStatus = Object.entries(
      leads.reduce<Record<string, number>>((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    // By source with conversion rate
    const sourceStats = leads.reduce<Record<string, { total: number; won: number }>>((acc, l) => {
      if (!acc[l.source]) {
        acc[l.source] = { total: 0, won: 0 };
      }
      acc[l.source].total++;
      if (l.status === 'WON') acc[l.source].won++;
      return acc;
    }, {});

    const bySource = Object.entries(sourceStats).map(([source, data]) => ({
      source,
      count: data.total,
      conversionRate: data.total > 0 ? (data.won / data.total) * 100 : 0,
    }));

    // Average time to convert
    const convertedLeads = leads.filter(l => l.convertedToProject);
    const avgTimeToConvert = convertedLeads.length > 0
      ? convertedLeads.reduce((sum, l) => {
          const days = (l.convertedToProject!.createdAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / convertedLeads.length
      : 0;

    res.json({
      success: true,
      data: {
        totalLeads: total,
        leadsByStatus: byStatus,
        leadsBySource: bySource,
        overallConversionRate: conversionRate,
        averageTimeToConvert: avgTimeToConvert,
      },
    });
  })
);

// Dashboard summary
router.get(
  '/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      leadsToday,
      leadsTotalActive,
      proposalsPending,
      projectsInProgress,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          companyId: req.companyId!,
          createdAt: { gte: today },
        },
      }),
      prisma.lead.count({
        where: {
          companyId: req.companyId!,
          status: { notIn: ['WON', 'LOST', 'UNQUALIFIED'] },
        },
      }),
      prisma.proposal.count({
        where: {
          companyId: req.companyId!,
          status: { in: ['SENT', 'VIEWED'] },
        },
      }),
      prisma.project.count({
        where: {
          companyId: req.companyId!,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.project.aggregate({
        where: {
          companyId: req.companyId!,
          status: { in: ['COMPLETED', 'INVOICED', 'PAID'] },
          actualEndDate: { gte: thisMonth },
        },
        _sum: { contractValue: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        leadsToday,
        leadsTotalActive,
        proposalsPending,
        projectsInProgress,
        monthlyRevenue: monthlyRevenue._sum.contractValue || 0,
      },
    });
  })
);

export default router;
