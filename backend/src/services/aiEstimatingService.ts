import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AI_ESTIMATING_SYSTEM_PROMPT } from '../prompts/systemPrompt.js';
import { getProjectTypePrompt } from '../prompts/estimatingPrompts.js';
import prisma from '../db/client.js';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIEstimateInput {
  projectId: string;
  companyId: string;
  photos?: string[]; // S3 URLs
  measurements?: Record<string, number>;
  scopeDescription: string;
  projectType: string;
  qualityTier?: 'standard' | 'mid-range' | 'premium';
}

export interface AIEstimateLineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export interface AILaborBreakdown {
  task: string;
  hours: number;
  rate: number;
  totalCost: number;
  skillLevel: 'skilled' | 'helper';
  notes?: string;
}

export interface AIEstimateOutput {
  projectSummary: {
    scopeDescription: string;
    estimatedDuration: string;
    complexityRating: 'low' | 'medium' | 'high';
    confidenceScore: number;
    notes: string[];
  };
  lineItems: AIEstimateLineItem[];
  laborBreakdown: AILaborBreakdown[];
  totals: {
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    subcontractorCost: number;
    subtotal: number;
    overhead: number;
    profit: number;
    totalCost: number;
  };
  suggestedGoodBetterBest: {
    good: {
      description: string;
      adjustments: string[];
      priceMultiplier: number;
    };
    better: {
      description: string;
      adjustments: string[];
      priceMultiplier: number;
    };
    best: {
      description: string;
      adjustments: string[];
      priceMultiplier: number;
    };
  };
  warnings: {
    severity: 'high' | 'medium' | 'low';
    message: string;
    recommendation: string;
  }[];
  questionsForContractor: string[];
}

class AIEstimatingService {
  /**
   * Analyze photos using OpenAI Vision API to extract relevant details
   */
  async analyzePhotos(photoUrls: string[]): Promise<string> {
    if (!photoUrls || photoUrls.length === 0) {
      return '';
    }

    const imageContents = photoUrls.slice(0, 5).map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'high' as const },
    }));

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a construction estimator analyzing project photos. Describe what you see in detail, including:

1. **Current Condition**: What is the current state? Any damage, wear, or issues?
2. **Scope of Work**: What work appears to be needed based on the images?
3. **Materials Visible**: What existing materials can you identify (flooring type, cabinet style, fixtures, etc.)?
4. **Measurements**: Estimate any dimensions you can reasonably infer (room size, countertop length, etc.)
5. **Potential Issues**: Any hidden problems that might be revealed (water damage signs, structural concerns, etc.)
6. **Quality Level**: What quality tier does the existing space suggest the client might want?

Be specific and detailed. This analysis will be used to generate an accurate estimate.`,
              },
              ...imageContents,
            ],
          },
        ],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error analyzing photos:', error);
      return 'Unable to analyze photos. Please provide detailed scope description.';
    }
  }

  /**
   * Get company pricing configuration
   */
  async getCompanyPricing(companyId: string): Promise<Record<string, unknown>> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { pricingConfig: true },
    });

    return (company?.pricingConfig as Record<string, unknown>) || {
      defaultLaborRate: 65,
      helperLaborRate: 40,
      materialMarkup: 20,
      overheadPercent: 12,
      profitMarginPercent: 20,
    };
  }

  /**
   * Generate an AI estimate using Claude
   */
  async generateEstimate(input: AIEstimateInput): Promise<AIEstimateOutput> {
    // Analyze photos if provided
    let photoAnalysis = '';
    if (input.photos && input.photos.length > 0) {
      photoAnalysis = await this.analyzePhotos(input.photos);
    }

    // Get company pricing config
    const pricingConfig = await this.getCompanyPricing(input.companyId);

    // Get project-type specific prompt additions
    const projectTypePrompt = getProjectTypePrompt(input.projectType);

    // Build the user prompt
    const userPrompt = this.buildUserPrompt({
      scopeDescription: input.scopeDescription,
      photoAnalysis,
      measurements: input.measurements,
      projectType: input.projectType,
      qualityTier: input.qualityTier || 'mid-range',
      pricingConfig,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8000,
      system: AI_ESTIMATING_SYSTEM_PROMPT + '\n\n' + projectTypePrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const estimateData = JSON.parse(jsonMatch[0]) as AIEstimateOutput;

    // Validate and sanitize the response
    return this.validateAndSanitize(estimateData);
  }

  /**
   * Build the user prompt with all context
   */
  private buildUserPrompt(context: {
    scopeDescription: string;
    photoAnalysis: string;
    measurements?: Record<string, number>;
    projectType: string;
    qualityTier: string;
    pricingConfig: Record<string, unknown>;
  }): string {
    let prompt = `## PROJECT DETAILS

**Project Type:** ${context.projectType}
**Quality Tier Requested:** ${context.qualityTier}

**Scope Description:**
${context.scopeDescription}
`;

    if (context.photoAnalysis) {
      prompt += `
**Photo Analysis:**
${context.photoAnalysis}
`;
    }

    if (context.measurements && Object.keys(context.measurements).length > 0) {
      prompt += `
**Measurements Provided:**
${Object.entries(context.measurements)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}
`;
    }

    prompt += `
**Pricing Configuration:**
- Skilled Labor Rate: $${context.pricingConfig.defaultLaborRate || 65}/hour
- Helper Labor Rate: $${context.pricingConfig.helperLaborRate || 40}/hour
- Material Markup: ${context.pricingConfig.materialMarkup || 20}%
- Overhead: ${context.pricingConfig.overheadPercent || 12}%
- Target Profit Margin: ${context.pricingConfig.profitMarginPercent || 20}%

Please generate a detailed estimate following the output format specified. Include all necessary line items, labor breakdown, and Good-Better-Best tier suggestions.`;

    return prompt;
  }

  /**
   * Validate and sanitize the AI response
   */
  private validateAndSanitize(data: AIEstimateOutput): AIEstimateOutput {
    // Ensure all required fields exist with defaults
    return {
      projectSummary: {
        scopeDescription: data.projectSummary?.scopeDescription || 'Estimate generated',
        estimatedDuration: data.projectSummary?.estimatedDuration || 'TBD',
        complexityRating: data.projectSummary?.complexityRating || 'medium',
        confidenceScore: Math.min(1, Math.max(0, data.projectSummary?.confidenceScore || 0.7)),
        notes: Array.isArray(data.projectSummary?.notes) ? data.projectSummary.notes : [],
      },
      lineItems: (data.lineItems || []).map((item) => ({
        category: item.category || 'Materials',
        description: item.description || 'Line item',
        quantity: Math.max(0, item.quantity || 1),
        unit: item.unit || 'each',
        unitCost: Math.max(0, item.unitCost || 0),
        totalCost: Math.max(0, item.totalCost || item.quantity * item.unitCost || 0),
        notes: item.notes,
      })),
      laborBreakdown: (data.laborBreakdown || []).map((item) => ({
        task: item.task || 'Labor',
        hours: Math.max(0, item.hours || 0),
        rate: Math.max(0, item.rate || 65),
        totalCost: Math.max(0, item.totalCost || item.hours * item.rate || 0),
        skillLevel: item.skillLevel || 'skilled',
        notes: item.notes,
      })),
      totals: {
        materialCost: Math.max(0, data.totals?.materialCost || 0),
        laborCost: Math.max(0, data.totals?.laborCost || 0),
        equipmentCost: Math.max(0, data.totals?.equipmentCost || 0),
        subcontractorCost: Math.max(0, data.totals?.subcontractorCost || 0),
        subtotal: Math.max(0, data.totals?.subtotal || 0),
        overhead: Math.max(0, data.totals?.overhead || 0),
        profit: Math.max(0, data.totals?.profit || 0),
        totalCost: Math.max(0, data.totals?.totalCost || 0),
      },
      suggestedGoodBetterBest: {
        good: {
          description: data.suggestedGoodBetterBest?.good?.description || 'Standard option',
          adjustments: data.suggestedGoodBetterBest?.good?.adjustments || [],
          priceMultiplier: data.suggestedGoodBetterBest?.good?.priceMultiplier || 0.85,
        },
        better: {
          description: data.suggestedGoodBetterBest?.better?.description || 'Enhanced option',
          adjustments: data.suggestedGoodBetterBest?.better?.adjustments || [],
          priceMultiplier: data.suggestedGoodBetterBest?.better?.priceMultiplier || 1.0,
        },
        best: {
          description: data.suggestedGoodBetterBest?.best?.description || 'Premium option',
          adjustments: data.suggestedGoodBetterBest?.best?.adjustments || [],
          priceMultiplier: data.suggestedGoodBetterBest?.best?.priceMultiplier || 1.25,
        },
      },
      warnings: (data.warnings || []).map((w) => ({
        severity: w.severity || 'medium',
        message: w.message || 'Warning',
        recommendation: w.recommendation || 'Please verify',
      })),
      questionsForContractor: Array.isArray(data.questionsForContractor)
        ? data.questionsForContractor
        : [],
    };
  }

  /**
   * Save AI estimate to database
   */
  async saveEstimate(
    projectId: string,
    aiOutput: AIEstimateOutput,
    input: AIEstimateInput
  ): Promise<string> {
    // Create the estimate with line items
    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        name: `AI Estimate - ${new Date().toLocaleDateString()}`,
        description: aiOutput.projectSummary.scopeDescription,
        aiAnalysisInput: {
          photos: input.photos,
          measurements: input.measurements,
          scopeDescription: input.scopeDescription,
          projectType: input.projectType,
          qualityTier: input.qualityTier,
        },
        aiAnalysisOutput: aiOutput as unknown as Record<string, unknown>,
        aiConfidenceScore: aiOutput.projectSummary.confidenceScore,
        materialCost: aiOutput.totals.materialCost,
        laborHours: aiOutput.laborBreakdown.reduce((sum, item) => sum + item.hours, 0),
        laborCost: aiOutput.totals.laborCost,
        equipmentCost: aiOutput.totals.equipmentCost,
        overhead: aiOutput.totals.overhead,
        profit: aiOutput.totals.profit,
        totalCost: aiOutput.totals.totalCost,
        lineItems: {
          create: [
            // Material line items
            ...aiOutput.lineItems.map((item, index) => ({
              category: item.category,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              sortOrder: index,
            })),
            // Labor line items
            ...aiOutput.laborBreakdown.map((item, index) => ({
              category: 'Labor',
              description: item.task,
              quantity: item.hours,
              unit: 'hours',
              unitCost: item.rate,
              totalCost: item.totalCost,
              laborHours: item.hours,
              laborRate: item.rate,
              sortOrder: aiOutput.lineItems.length + index,
            })),
          ],
        },
      },
    });

    // Update project estimated costs
    await prisma.project.update({
      where: { id: projectId },
      data: {
        estimatedMaterialCost: aiOutput.totals.materialCost,
        estimatedLaborCost: aiOutput.totals.laborCost,
        estimatedTotalCost: aiOutput.totals.totalCost,
        estimatedProfit: aiOutput.totals.profit,
        estimatedMargin:
          aiOutput.totals.totalCost > 0
            ? (aiOutput.totals.profit / aiOutput.totals.totalCost) * 100
            : 0,
      },
    });

    return estimate.id;
  }
}

export const aiEstimatingService = new AIEstimatingService();
