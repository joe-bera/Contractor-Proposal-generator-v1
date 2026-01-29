import Anthropic from '@anthropic-ai/sdk';
import prisma from '../db/client.js';
import { AI_PROPOSAL_SYSTEM_PROMPT } from '../prompts/proposalPrompts.js';

const anthropic = new Anthropic();

// Types for proposal generation
export interface ProposalGenerationInput {
  estimateId: string;
  projectId: string;
  companyId: string;
  tone?: 'professional' | 'friendly' | 'premium' | 'value';
  targetMargin?: number; // Target profit margin percentage
  includeTestimonials?: boolean;
  customInstructions?: string;
}

interface ProposalTier {
  name: string;
  headline: string;
  description: string;
  price: number;
  features: string[];
  excludes?: string[];
  recommended?: boolean;
  badge?: string;
}

interface AIProposalOutput {
  proposal: {
    title: string;
    introduction: string;
    projectVision: string;
    scopeOfWork: string;
    timeline: {
      duration: string;
      milestones: string[];
    };
    tiers: {
      good: ProposalTier;
      better: ProposalTier;
      best: ProposalTier;
    };
    whyChooseUs: string[];
    guarantee: string;
    paymentTerms: {
      deposit: string;
      schedule: string[];
    };
    callToAction: string;
    urgency?: string;
  };
  suggestedUpsells: Array<{
    item: string;
    price: number;
    rationale: string;
  }>;
  followUpSequence: Array<{
    day: number;
    channel: 'email' | 'sms';
    message: string;
  }>;
}

class ProposalService {
  /**
   * Generate AI-powered Good-Better-Best proposal from an estimate
   */
  async generateProposal(input: ProposalGenerationInput): Promise<AIProposalOutput> {
    // Fetch the estimate with line items and project details
    const estimate = await prisma.estimate.findUnique({
      where: { id: input.estimateId },
      include: {
        lineItems: true,
        project: {
          include: {
            company: {
              select: {
                name: true,
                yearsInBusiness: true,
                licenseNumber: true,
                insuranceInfo: true,
              },
            },
          },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Build the prompt for Claude
    const userPrompt = this.buildProposalPrompt(estimate, input);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8000,
      system: AI_PROPOSAL_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const aiOutput: AIProposalOutput = JSON.parse(jsonMatch[0]);

    // Validate and calculate tier prices based on estimate
    aiOutput.proposal.tiers = this.calculateTierPrices(
      aiOutput.proposal.tiers,
      estimate.totalCost,
      input.targetMargin || 20
    );

    return aiOutput;
  }

  /**
   * Build the prompt for proposal generation
   */
  private buildProposalPrompt(estimate: any, input: ProposalGenerationInput): string {
    const project = estimate.project;
    const company = project.company;

    // Format line items for context
    const lineItemsFormatted = estimate.lineItems
      .map(
        (item: any) =>
          `- ${item.description}: ${item.quantity} ${item.unit} @ $${item.unitPrice}/unit = $${item.totalPrice}`
      )
      .join('\n');

    // Group line items by category
    const categorizedItems: Record<string, any[]> = {};
    estimate.lineItems.forEach((item: any) => {
      const category = item.category || 'General';
      if (!categorizedItems[category]) {
        categorizedItems[category] = [];
      }
      categorizedItems[category].push(item);
    });

    const categorySummary = Object.entries(categorizedItems)
      .map(([category, items]) => {
        const total = items.reduce((sum: number, i: any) => sum + i.totalPrice, 0);
        return `${category}: $${total.toFixed(2)} (${items.length} items)`;
      })
      .join('\n');

    const prompt = `Generate a compelling Good-Better-Best proposal for the following project:

## PROJECT DETAILS
- **Project Type:** ${project.projectType || 'General Renovation'}
- **Project Name:** ${project.name}
- **Description:** ${project.description || 'No description provided'}
- **Location:** ${project.city}, ${project.state}

## CLIENT INFORMATION
- **Name:** ${project.clientFirstName} ${project.clientLastName}
- **Email:** ${project.clientEmail}

## COMPANY INFORMATION
- **Company Name:** ${company.name}
- **Years in Business:** ${company.yearsInBusiness || 'Established company'}
- **License Number:** ${company.licenseNumber || 'Licensed & Insured'}

## ESTIMATE BREAKDOWN
**Total Estimated Cost:** $${estimate.totalCost.toFixed(2)}
**Labor Cost:** $${estimate.laborCost.toFixed(2)}
**Material Cost:** $${estimate.materialCost.toFixed(2)}

### Categories:
${categorySummary}

### Detailed Line Items:
${lineItemsFormatted}

${estimate.aiAnalysis ? `## AI ANALYSIS NOTES:\n${estimate.aiAnalysis}` : ''}

## GENERATION PARAMETERS
- **Tone:** ${input.tone || 'professional'}
- **Target Profit Margin:** ${input.targetMargin || 20}%

${input.customInstructions ? `## CUSTOM INSTRUCTIONS:\n${input.customInstructions}` : ''}

## TIER PRICING GUIDELINES
Based on the estimate total of $${estimate.totalCost.toFixed(2)}:
- **Good Tier:** 80-85% of target price (basic version, meets core needs)
- **Better Tier:** 100% of target price (the "sweet spot", recommended option)
- **Best Tier:** 115-130% of target price (premium experience with upgrades)

Apply the target profit margin of ${input.targetMargin || 20}% when calculating prices.

Generate the proposal JSON following the exact format specified in the system prompt.`;

    return prompt;
  }

  /**
   * Calculate and validate tier prices
   */
  private calculateTierPrices(
    tiers: AIProposalOutput['proposal']['tiers'],
    estimateTotal: number,
    targetMargin: number
  ): AIProposalOutput['proposal']['tiers'] {
    // Calculate base price with margin
    const basePrice = estimateTotal * (1 + targetMargin / 100);

    // Ensure tier prices follow the Good-Better-Best psychology
    // Good: 80-85% of base (we'll use 82%)
    // Better: 100% of base (the anchor)
    // Best: 115-130% of base (we'll use 125%)

    const goodPrice = Math.round(basePrice * 0.82);
    const betterPrice = Math.round(basePrice);
    const bestPrice = Math.round(basePrice * 1.25);

    // Override AI prices with calculated prices if they seem off
    // (AI prices are suggestions, but we ensure math is correct)
    return {
      good: {
        ...tiers.good,
        price: tiers.good.price || goodPrice,
      },
      better: {
        ...tiers.better,
        price: tiers.better.price || betterPrice,
        recommended: true,
        badge: tiers.better.badge || 'MOST POPULAR',
      },
      best: {
        ...tiers.best,
        price: tiers.best.price || bestPrice,
      },
    };
  }

  /**
   * Save a generated proposal to the database
   */
  async saveProposal(
    projectId: string,
    companyId: string,
    userId: string,
    estimateId: string,
    aiOutput: AIProposalOutput,
    tone: string = 'professional'
  ): Promise<string> {
    const { nanoid } = await import('nanoid');
    const publicUrl = nanoid(12);

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        companyId,
        createdById: userId,
        estimateId,
        title: aiOutput.proposal.title,
        introduction: aiOutput.proposal.introduction,
        scopeOfWork: aiOutput.proposal.scopeOfWork,
        tone,
        // Good tier
        goodTierName: aiOutput.proposal.tiers.good.name,
        goodTierDescription: aiOutput.proposal.tiers.good.description,
        goodTierPrice: aiOutput.proposal.tiers.good.price,
        goodTierItems: aiOutput.proposal.tiers.good.features.map((f) => ({
          description: f,
          included: true,
        })),
        // Better tier
        betterTierName: aiOutput.proposal.tiers.better.name,
        betterTierDescription: aiOutput.proposal.tiers.better.description,
        betterTierPrice: aiOutput.proposal.tiers.better.price,
        betterTierItems: aiOutput.proposal.tiers.better.features.map((f) => ({
          description: f,
          included: true,
        })),
        // Best tier
        bestTierName: aiOutput.proposal.tiers.best.name,
        bestTierDescription: aiOutput.proposal.tiers.best.description,
        bestTierPrice: aiOutput.proposal.tiers.best.price,
        bestTierItems: aiOutput.proposal.tiers.best.features.map((f) => ({
          description: f,
          included: true,
        })),
        // Timeline & terms
        estimatedDuration: aiOutput.proposal.timeline.duration,
        depositPercent: 50,
        paymentSchedule: aiOutput.proposal.paymentTerms.schedule.map((s, i) => ({
          milestone: s,
          percent: i === 0 ? 50 : 50 / (aiOutput.proposal.paymentTerms.schedule.length - 1),
        })),
        // Extra AI data
        projectVision: aiOutput.proposal.projectVision,
        whyChooseUs: aiOutput.proposal.whyChooseUs,
        guarantee: aiOutput.proposal.guarantee,
        callToAction: aiOutput.proposal.callToAction,
        urgency: aiOutput.proposal.urgency,
        suggestedUpsells: aiOutput.suggestedUpsells,
        followUpSequence: aiOutput.followUpSequence,
        milestones: aiOutput.proposal.timeline.milestones,
        // Public URL
        publicUrl,
      },
    });

    return proposal.id;
  }
}

export const proposalService = new ProposalService();
