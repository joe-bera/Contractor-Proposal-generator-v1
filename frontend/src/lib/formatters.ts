import { format, formatDistanceToNow, parseISO } from "date-fns";

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyWithCents(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Percentage formatting
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Date formatting
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Phone formatting
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Name formatting
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Address formatting
export function formatAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): string {
  return `${address}, ${city}, ${state} ${zip}`;
}

// Status formatting
export const leadStatusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPOINTMENT_SCHEDULED: "Appointment Scheduled",
  ESTIMATE_SENT: "Estimate Sent",
  FOLLOW_UP: "Follow Up",
  WON: "Won",
  LOST: "Lost",
  UNQUALIFIED: "Unqualified",
};

export const projectStatusLabels: Record<string, string> = {
  ESTIMATE: "Estimate",
  PROPOSAL_SENT: "Proposal Sent",
  PROPOSAL_VIEWED: "Proposal Viewed",
  NEGOTIATING: "Negotiating",
  ACCEPTED: "Accepted",
  DEPOSIT_RECEIVED: "Deposit Received",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const projectTypeLabels: Record<string, string> = {
  KITCHEN_REMODEL: "Kitchen Remodel",
  BATHROOM_REMODEL: "Bathroom Remodel",
  WHOLE_HOME_REMODEL: "Whole Home Remodel",
  ADDITION: "Addition",
  DECK_PATIO: "Deck/Patio",
  ROOFING: "Roofing",
  SIDING: "Siding",
  WINDOWS_DOORS: "Windows & Doors",
  FLOORING: "Flooring",
  PAINTING_INTERIOR: "Interior Painting",
  PAINTING_EXTERIOR: "Exterior Painting",
  LANDSCAPING: "Landscaping",
  HARDSCAPING: "Hardscaping",
  FENCE: "Fence",
  GARAGE: "Garage",
  BASEMENT_FINISH: "Basement Finish",
  COMMERCIAL_TENANT_IMPROVEMENT: "Commercial TI",
  COMMERCIAL_BUILDOUT: "Commercial Buildout",
  COMMERCIAL_RENOVATION: "Commercial Renovation",
  COMMERCIAL_REPAIR: "Commercial Repair",
  HVAC_INSTALL: "HVAC Installation",
  HVAC_REPAIR: "HVAC Repair",
  PLUMBING_NEW: "New Plumbing",
  PLUMBING_REPAIR: "Plumbing Repair",
  ELECTRICAL_NEW: "New Electrical",
  ELECTRICAL_REPAIR: "Electrical Repair",
  HANDYMAN: "Handyman",
  CUSTOM: "Custom",
  OTHER: "Other",
};
