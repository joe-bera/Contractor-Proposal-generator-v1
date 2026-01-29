/**
 * State-specific compliance rules for preliminary notices and mechanics liens.
 * These rules protect contractors' lien rights by tracking deadlines.
 */

export interface StateComplianceRules {
  preliminaryNotice: {
    required: boolean;
    deadlineDays: number;
    fromEvent: 'first_work' | 'first_materials' | 'contract_date';
    exceptions?: string[];
    description?: string;
  };
  mechanicsLien: {
    deadlineDays: number;
    fromEvent: 'completion' | 'last_work' | 'notice_of_completion';
    residentialOwnerOccupied?: number; // Different deadline if applicable
    description?: string;
  };
  noticeOfCompletion: {
    available: boolean;
    deadlineDays?: number;
    reducesLienDeadlineTo?: number;
    description?: string;
  };
}

export const STATE_COMPLIANCE_RULES: Record<string, StateComplianceRules> = {
  // California - One of the strictest states for lien rights
  CA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      exceptions: ['Direct contractor with direct contract'],
      description: '20-Day Preliminary Notice required for subcontractors and material suppliers',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      residentialOwnerOccupied: 60,
      description: '90 days from completion (60 days for owner-occupied residential)',
    },
    noticeOfCompletion: {
      available: true,
      deadlineDays: 15,
      reducesLienDeadlineTo: 30,
      description: 'If filed, reduces subcontractor lien deadline to 30 days',
    },
  },

  // Texas - Monthly notice system
  TX: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 15, // 15th day of second month after first furnishing
      fromEvent: 'first_work',
      description: 'Monthly notices required by 15th of second month after work begins',
    },
    mechanicsLien: {
      deadlineDays: 60, // Varies: 15th of 3rd/4th month depending on project type
      fromEvent: 'last_work',
      description: '15th of 3rd month (residential) or 4th month (commercial) after last work',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Florida - Notice to Owner required
  FL: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 45,
      fromEvent: 'first_work',
      description: 'Notice to Owner required within 45 days of first furnishing labor/materials',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing of labor or materials',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Arizona - Strict 20-day preliminary notice
  AZ: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      description: '20-Day Preliminary Notice required',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'completion',
      description: '120 days from completion of work',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 60,
      description: 'If filed, reduces lien deadline to 60 days',
    },
  },

  // Nevada
  NV: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 31, // Before or within 31 days of first work
      fromEvent: 'first_work',
      description: 'Notice of Right to Lien required within 31 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      residentialOwnerOccupied: 40,
      description: '90 days from completion (40 days for residential with NOC)',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 40,
    },
  },

  // Colorado
  CO: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 10, // Before or within 10 business days of first work
      fromEvent: 'first_work',
      description: 'Notice of Intent required within 10 business days',
    },
    mechanicsLien: {
      deadlineDays: 60, // 4 months from completion for subcontractors
      fromEvent: 'completion',
      description: '4 months from completion for subcontractors',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Washington
  WA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 60,
      fromEvent: 'first_work',
      description: 'Notice to Owner required within 60 days of first furnishing',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      description: '90 days from completion or cessation of work',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Oregon
  OR: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 8, // Within 8 days of first delivery
      fromEvent: 'first_materials',
      description: 'Notice of Right to Lien within 8 days of first delivery',
    },
    mechanicsLien: {
      deadlineDays: 75,
      fromEvent: 'completion',
      description: '75 days from completion',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 15,
    },
  },

  // Georgia
  GA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 30, // Before filing lien or within 30 days of first work
      fromEvent: 'first_work',
      description: 'Notice of Commencement must be filed at start of work',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from completion of work',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // New York
  NY: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required (but recommended)',
    },
    mechanicsLien: {
      deadlineDays: 120, // 8 months for improvements
      fromEvent: 'last_work',
      description: '8 months from last work (4 months for single-family residential)',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Illinois
  IL: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 120, // 4 months
      fromEvent: 'completion',
      description: '4 months from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Pennsylvania
  PA: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180, // 6 months
      fromEvent: 'completion',
      description: '6 months from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Ohio
  OH: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 21,
      fromEvent: 'first_work',
      description: 'Notice of Furnishing required within 21 days',
    },
    mechanicsLien: {
      deadlineDays: 75,
      fromEvent: 'last_work',
      description: '75 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Michigan
  MI: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      description: 'Notice of Furnishing required within 20 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // North Carolina
  NC: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 0, // At or before first furnishing
      fromEvent: 'first_work',
      description: 'Notice to Lien Agent required before first furnishing',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Virginia
  VA: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last day of month in which work was done',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // New Jersey
  NJ: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      description: '90 days from completion of entire project',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Massachusetts
  MA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 60,
      fromEvent: 'first_work',
      description: 'Notice of Contract required within 60 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Tennessee
  TN: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 90,
      fromEvent: 'first_work',
      description: 'Notice of Nonpayment required within 90 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      description: '90 days from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Indiana
  IN: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last labor/materials',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Missouri
  MO: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180, // 6 months
      fromEvent: 'last_work',
      description: '6 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Minnesota
  MN: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 45,
      fromEvent: 'first_work',
      description: 'Pre-Lien Notice required within 45 days',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Wisconsin
  WI: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180, // 6 months
      fromEvent: 'last_work',
      description: '6 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Utah
  UT: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      description: 'Preliminary Notice required within 20 days',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'completion',
      description: '180 days from completion (earlier with NOC)',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 90,
    },
  },

  // Maryland
  MD: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 120,
      fromEvent: 'first_work',
      description: 'Notice of Intent required within 120 days',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'last_work',
      description: '180 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // South Carolina
  SC: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 90,
      fromEvent: 'first_work',
      description: 'Notice of Project required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Alabama
  AL: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 30,
      fromEvent: 'first_work',
      description: 'Statement of Lien required within 30 days',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'last_work',
      description: '6 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Kentucky
  KY: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'last_work',
      description: '6 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Louisiana
  LA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 0, // Must be filed before work begins
      fromEvent: 'contract_date',
      description: 'Notice of Contract must be filed before work begins',
    },
    mechanicsLien: {
      deadlineDays: 60,
      fromEvent: 'completion',
      description: '60 days from completion',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 30,
    },
  },

  // Oklahoma
  OK: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 75,
      fromEvent: 'first_work',
      description: 'Pre-lien Notice required within 75 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Connecticut
  CT: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Iowa
  IA: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 30,
      fromEvent: 'first_work',
      description: 'Preliminary Notice required within 30 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Mississippi
  MS: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 365,
      fromEvent: 'last_work',
      description: '1 year from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Arkansas
  AR: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Kansas
  KS: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90, // 5 months for materials
      fromEvent: 'last_work',
      description: '3-5 months from last furnishing (varies)',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Nevada already defined above

  // New Mexico
  NM: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 60,
      fromEvent: 'first_work',
      description: 'Notice of Lien required within 60 days',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // West Virginia
  WV: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 100,
      fromEvent: 'completion',
      description: '100 days from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Nebraska
  NE: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '4 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Idaho
  ID: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      description: '20-day Preliminary Notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      description: '90 days from completion',
    },
    noticeOfCompletion: {
      available: true,
      reducesLienDeadlineTo: 60,
    },
  },

  // Hawaii
  HI: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 15, // At or before completion of performance
      fromEvent: 'first_work',
      description: 'Notice of Furnishing required',
    },
    mechanicsLien: {
      deadlineDays: 45,
      fromEvent: 'completion',
      description: '45 days from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Maine
  ME: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // New Hampshire
  NH: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Rhode Island
  RI: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'last_work',
      description: '120 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Montana
  MT: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 20,
      fromEvent: 'first_work',
      description: 'Notice of Right to Claim Lien required within 20 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'completion',
      description: '90 days from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Delaware
  DE: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'last_work',
      description: '6 months from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // South Dakota
  SD: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // North Dakota
  ND: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Alaska
  AK: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 15,
      fromEvent: 'first_work',
      description: 'Notice of Right to Lien required within 15 days',
    },
    mechanicsLien: {
      deadlineDays: 120,
      fromEvent: 'completion',
      description: '120 days from completion',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Vermont
  VT: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 180,
      fromEvent: 'last_work',
      description: '180 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Wyoming
  WY: {
    preliminaryNotice: {
      required: false,
      deadlineDays: 0,
      fromEvent: 'first_work',
      description: 'No preliminary notice required',
    },
    mechanicsLien: {
      deadlineDays: 150,
      fromEvent: 'last_work',
      description: '150 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },

  // Washington DC
  DC: {
    preliminaryNotice: {
      required: true,
      deadlineDays: 90,
      fromEvent: 'first_work',
      description: 'Notice of Intent required within 90 days',
    },
    mechanicsLien: {
      deadlineDays: 90,
      fromEvent: 'last_work',
      description: '90 days from last furnishing',
    },
    noticeOfCompletion: {
      available: false,
    },
  },
};

/**
 * Get compliance rules for a specific state
 */
export function getStateRules(state: string): StateComplianceRules | null {
  return STATE_COMPLIANCE_RULES[state.toUpperCase()] || null;
}

/**
 * Get list of all states with compliance rules
 */
export function getAllStatesWithRules(): string[] {
  return Object.keys(STATE_COMPLIANCE_RULES);
}

/**
 * Check if state requires preliminary notice
 */
export function requiresPreliminaryNotice(state: string): boolean {
  const rules = getStateRules(state);
  return rules?.preliminaryNotice.required ?? false;
}

/**
 * Get a summary of rules for a state (useful for UI display)
 */
export function getStateRulesSummary(state: string): {
  preliminaryNotice: string;
  mechanicsLien: string;
  noticeOfCompletion: string;
} | null {
  const rules = getStateRules(state);
  if (!rules) return null;

  return {
    preliminaryNotice: rules.preliminaryNotice.required
      ? `Required within ${rules.preliminaryNotice.deadlineDays} days`
      : 'Not required',
    mechanicsLien: `${rules.mechanicsLien.deadlineDays} days from ${rules.mechanicsLien.fromEvent.replace('_', ' ')}`,
    noticeOfCompletion: rules.noticeOfCompletion.available
      ? `Available - reduces deadline to ${rules.noticeOfCompletion.reducesLienDeadlineTo} days`
      : 'Not available',
  };
}
