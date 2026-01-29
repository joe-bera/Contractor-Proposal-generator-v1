// ============ ENUMS ============

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CONTRACTOR = 'CONTRACTOR',
  ESTIMATOR = 'ESTIMATOR',
  OFFICE_MANAGER = 'OFFICE_MANAGER',
  FIELD_WORKER = 'FIELD_WORKER',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  ESTIMATE_SENT = 'ESTIMATE_SENT',
  FOLLOW_UP = 'FOLLOW_UP',
  WON = 'WON',
  LOST = 'LOST',
  UNQUALIFIED = 'UNQUALIFIED',
}

export enum LeadSource {
  PHONE = 'PHONE',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  YELP = 'YELP',
  HOMEADVISOR = 'HOMEADVISOR',
  ANGIES_LIST = 'ANGIES_LIST',
  NEXTDOOR = 'NEXTDOOR',
  OTHER = 'OTHER',
}

export enum ProjectStatus {
  ESTIMATE = 'ESTIMATE',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  PROPOSAL_VIEWED = 'PROPOSAL_VIEWED',
  NEGOTIATING = 'NEGOTIATING',
  ACCEPTED = 'ACCEPTED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum ProjectType {
  // Residential
  KITCHEN_REMODEL = 'KITCHEN_REMODEL',
  BATHROOM_REMODEL = 'BATHROOM_REMODEL',
  WHOLE_HOME_REMODEL = 'WHOLE_HOME_REMODEL',
  ADDITION = 'ADDITION',
  DECK_PATIO = 'DECK_PATIO',
  ROOFING = 'ROOFING',
  SIDING = 'SIDING',
  WINDOWS_DOORS = 'WINDOWS_DOORS',
  FLOORING = 'FLOORING',
  PAINTING_INTERIOR = 'PAINTING_INTERIOR',
  PAINTING_EXTERIOR = 'PAINTING_EXTERIOR',
  LANDSCAPING = 'LANDSCAPING',
  HARDSCAPING = 'HARDSCAPING',
  FENCE = 'FENCE',
  GARAGE = 'GARAGE',
  BASEMENT_FINISH = 'BASEMENT_FINISH',
  // Commercial
  COMMERCIAL_TENANT_IMPROVEMENT = 'COMMERCIAL_TENANT_IMPROVEMENT',
  COMMERCIAL_BUILDOUT = 'COMMERCIAL_BUILDOUT',
  COMMERCIAL_RENOVATION = 'COMMERCIAL_RENOVATION',
  COMMERCIAL_REPAIR = 'COMMERCIAL_REPAIR',
  // Trade Specific
  HVAC_INSTALL = 'HVAC_INSTALL',
  HVAC_REPAIR = 'HVAC_REPAIR',
  PLUMBING_NEW = 'PLUMBING_NEW',
  PLUMBING_REPAIR = 'PLUMBING_REPAIR',
  ELECTRICAL_NEW = 'ELECTRICAL_NEW',
  ELECTRICAL_REPAIR = 'ELECTRICAL_REPAIR',
  // Other
  HANDYMAN = 'HANDYMAN',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER',
}

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL',
  CONVERTED_TO_PROPOSAL = 'CONVERTED_TO_PROPOSAL',
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  EXPIRED = 'EXPIRED',
  DECLINED = 'DECLINED',
}

export enum ProposalOutcome {
  WON = 'WON',
  LOST_TO_COMPETITOR = 'LOST_TO_COMPETITOR',
  LOST_TO_PRICE = 'LOST_TO_PRICE',
  LOST_NO_DECISION = 'LOST_NO_DECISION',
  LOST_TIMING = 'LOST_TIMING',
  LOST_OTHER = 'LOST_OTHER',
}

export enum ChangeOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  INVOICED = 'INVOICED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum TemplateType {
  PROPOSAL = 'PROPOSAL',
  ESTIMATE = 'ESTIMATE',
  SCOPE_OF_WORK = 'SCOPE_OF_WORK',
  TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// ============ API TYPES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ LEAD TYPES ============

export interface CreateLeadInput {
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
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: LeadStatus;
  appointmentDate?: string;
  appointmentNotes?: string;
  assignedToId?: string;
}

// ============ PROJECT TYPES ============

export interface CreateProjectInput {
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
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  assignedToId: string;
  leadId?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  status?: ProjectStatus;
}

// ============ ESTIMATE TYPES ============

export interface EstimateLineItemInput {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  laborHours?: number;
  laborRate?: number;
  materialId?: string;
  supplierName?: string;
  subcontractorName?: string;
  sortOrder?: number;
}

export interface CreateEstimateInput {
  name?: string;
  description?: string;
  lineItems: EstimateLineItemInput[];
  materialMarkup?: number;
  laborRate?: number;
  overheadPercent?: number;
  profitMarginPercent?: number;
}

export interface AIEstimateInput {
  photos?: string[]; // S3 URLs
  measurements?: Record<string, number>;
  scopeDescription: string;
  projectType: ProjectType;
  qualityTier?: 'standard' | 'mid-range' | 'premium';
}

export interface AIEstimateOutput {
  projectSummary: {
    scopeDescription: string;
    estimatedDuration: string;
    complexityRating: 'low' | 'medium' | 'high';
    confidenceScore: number;
    notes: string[];
  };
  lineItems: {
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    notes?: string;
  }[];
  laborBreakdown: {
    task: string;
    hours: number;
    rate: number;
    totalCost: number;
    skillLevel: 'skilled' | 'helper';
    notes?: string;
  }[];
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

// ============ PROPOSAL TYPES ============

export interface ProposalTier {
  name: string;
  description: string;
  price: number;
  items: {
    description: string;
    included: boolean;
  }[];
}

export interface CreateProposalInput {
  title: string;
  introduction?: string;
  scopeOfWork?: string;
  exclusions?: string;
  termsAndConditions?: string;
  tone?: 'professional' | 'friendly' | 'premium' | 'value';
  goodTier: ProposalTier;
  betterTier: ProposalTier;
  bestTier: ProposalTier;
  estimatedDuration?: string;
  proposedStartDate?: string;
  depositPercent?: number;
  paymentSchedule?: { milestone: string; percent: number }[];
}

export interface AIProposalInput {
  estimateId: string;
  tone: 'professional' | 'friendly' | 'premium' | 'value';
  companyInfo: {
    name: string;
    tagline?: string;
    differentiators?: string[];
    guarantees?: string[];
  };
  clientInfo: {
    firstName: string;
    lastName: string;
    projectVision?: string;
  };
}

export interface SignProposalInput {
  selectedTier: 'good' | 'better' | 'best';
  signerName: string;
  signerEmail: string;
  signatureData: string; // Base64 encoded signature image
}

// ============ CHANGE ORDER TYPES ============

export interface ChangeOrderLineItemInput {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface CreateChangeOrderInput {
  title: string;
  description: string;
  reason?: string;
  lineItems: ChangeOrderLineItemInput[];
}

export interface DetectedScopeChange {
  type: 'additional_work' | 'material_upgrade' | 'design_change' | 'unforeseen_condition' | 'client_request';
  description: string;
  originalScope: string;
  newScope: string;
  estimatedAdditionalCost: {
    materials: number;
    labor: number;
    total: number;
  };
  justification: string;
  sourceText: string;
}

// ============ JOB COSTING TYPES ============

export interface CreateTimeEntryInput {
  date: string;
  hours: number;
  description?: string;
  userId: string;
  hourlyRate?: number;
}

export interface CreateMaterialPurchaseInput {
  date: string;
  supplier: string;
  description: string;
  amount: number;
  receiptUrl?: string;
}

export interface JobCostReport {
  projectId: string;
  estimatedMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  materialVariancePercent: number;
  estimatedLaborCost: number;
  actualLaborCost: number;
  laborVariance: number;
  laborVariancePercent: number;
  estimatedTotalCost: number;
  actualTotalCost: number;
  totalVariance: number;
  totalVariancePercent: number;
  estimatedProfit: number;
  actualProfit: number;
  profitVariance: number;
}

// ============ VOICE AI TYPES ============

export interface VoiceCallData {
  callId: string;
  transcript: string;
  duration: number;
  contact: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address?: string;
  };
  project: {
    type?: string;
    description?: string;
    urgency: 'emergency' | 'urgent' | 'standard';
    estimatedSize?: string;
    budgetIndicated?: string;
  };
  qualification: {
    propertyOwner: boolean;
    competitorQuotes: boolean;
    readinessToBuy: 'high' | 'medium' | 'low';
    notes?: string;
  };
  appointment?: {
    scheduled: boolean;
    dateTime?: string;
    notes?: string;
  };
  callSummary: string;
}

// ============ ANALYTICS TYPES ============

export interface ProposalAnalytics {
  totalProposals: number;
  sentProposals: number;
  viewedProposals: number;
  signedProposals: number;
  depositPaidProposals: number;
  viewRate: number;
  signRate: number;
  averageTimeToSign: number; // days
  averageProposalValue: number;
  tierBreakdown: {
    good: number;
    better: number;
    best: number;
  };
  winLossReasons: {
    reason: string;
    count: number;
  }[];
}

export interface ProfitabilityAnalytics {
  totalProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  projectsByType: {
    type: ProjectType;
    count: number;
    averageProfit: number;
    averageMargin: number;
  }[];
}

export interface EstimationAccuracyAnalytics {
  totalCompletedProjects: number;
  averageVariancePercent: number;
  materialAccuracy: number;
  laborAccuracy: number;
  overEstimatedCount: number;
  underEstimatedCount: number;
  accurateCount: number; // within 10%
}

export interface LeadConversionAnalytics {
  totalLeads: number;
  leadsByStatus: {
    status: LeadStatus;
    count: number;
  }[];
  leadsBySource: {
    source: LeadSource;
    count: number;
    conversionRate: number;
  }[];
  overallConversionRate: number;
  averageTimeToConvert: number; // days
}
