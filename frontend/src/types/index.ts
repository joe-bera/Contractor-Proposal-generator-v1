// Re-export shared types
export * from "@contractor-proposal/shared/types";

// Frontend-specific types

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  companyId: string;
}

export interface Lead {
  id: string;
  status: string;
  source: string;
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
  appointmentDate?: string;
  appointmentNotes?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  photos?: { id: string; url: string; filename: string }[];
  notes?: { id: string; content: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectNumber?: string;
  status: string;
  name: string;
  description?: string;
  projectType: string;
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
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotalCost: number;
  estimatedProfit: number;
  estimatedMargin: number;
  actualMaterialCost: number;
  actualLaborCost: number;
  actualTotalCost: number;
  actualProfit: number;
  actualMargin: number;
  contractValue: number;
  depositAmount: number;
  depositPaid: boolean;
  assignedTo?: {
    id: string;
    name: string;
  };
  estimates?: Estimate[];
  proposals?: Proposal[];
  photos?: { id: string; url: string; category?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Estimate {
  id: string;
  version: number;
  status: string;
  name?: string;
  description?: string;
  materialCost: number;
  laborHours: number;
  laborCost: number;
  equipmentCost: number;
  overhead: number;
  profit: number;
  totalCost: number;
  lineItems: EstimateLineItem[];
  createdAt: string;
}

export interface EstimateLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  laborHours?: number;
  laborRate?: number;
  sortOrder: number;
}

export interface Proposal {
  id: string;
  version: number;
  status: string;
  title: string;
  introduction?: string;
  scopeOfWork?: string;
  exclusions?: string;
  termsAndConditions?: string;
  tone: string;
  goodTierName: string;
  goodTierDescription?: string;
  goodTierPrice: number;
  goodTierItems?: unknown[];
  betterTierName: string;
  betterTierDescription?: string;
  betterTierPrice: number;
  betterTierItems?: unknown[];
  bestTierName: string;
  bestTierDescription?: string;
  bestTierPrice: number;
  bestTierItems?: unknown[];
  selectedTier?: string;
  estimatedDuration?: string;
  proposedStartDate?: string;
  depositPercent: number;
  viewCount: number;
  totalViewTime: number;
  lastViewedAt?: string;
  signedAt?: string;
  signerName?: string;
  signerEmail?: string;
  depositPaidAt?: string;
  publicUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  changeOrderNumber: number;
  status: string;
  title: string;
  description: string;
  reason?: string;
  additionalMaterialCost: number;
  additionalLaborCost: number;
  totalAdditionalCost: number;
  lineItems: { id: string; description: string; quantity: number; unit: string; unitCost: number; totalCost: number }[];
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description?: string;
  hourlyRate: number;
  totalCost: number;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface MaterialPurchase {
  id: string;
  date: string;
  supplier: string;
  description: string;
  amount: number;
  receiptUrl?: string;
  createdAt: string;
}
