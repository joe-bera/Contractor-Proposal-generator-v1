export const LEARNING_LOOP_PROMPT = `Analyze the variance between estimated and actual costs for this completed project to improve future estimates.

## INPUT DATA
- Original estimate line items with costs
- Actual costs (labor hours, material purchases)
- Project type and characteristics
- Any change orders (exclude from variance analysis)

## ANALYSIS TASKS

1. **Calculate Variances**
   - Material cost variance (%)
   - Labor hour variance (%)
   - Total cost variance (%)

2. **Identify Patterns**
   - Which categories were overestimated?
   - Which were underestimated?
   - Were there consistent issues?

3. **Root Cause Analysis**
   - Why did variances occur?
   - Was scope accurate?
   - Were unknowns properly flagged?

4. **Recommendations**
   - Specific adjustments for similar future projects
   - New items to include in estimates
   - Labor hour adjustments by task type

## OUTPUT FORMAT

{
  "projectSummary": {
    "type": "",
    "estimatedTotal": 0,
    "actualTotal": 0,
    "variancePercent": 0,
    "overallAssessment": "accurate|slightly_over|slightly_under|significantly_over|significantly_under"
  },
  "categoryAnalysis": [
    {
      "category": "",
      "estimated": 0,
      "actual": 0,
      "variancePercent": 0,
      "analysis": "Explanation"
    }
  ],
  "laborAnalysis": {
    "estimatedHours": 0,
    "actualHours": 0,
    "variancePercent": 0,
    "taskBreakdown": [
      {
        "task": "",
        "estimatedHours": 0,
        "actualHours": 0,
        "reason": ""
      }
    ]
  },
  "learnings": [
    {
      "finding": "What was learned",
      "recommendation": "How to adjust future estimates",
      "applicability": "all_projects|project_type_specific|one_off"
    }
  ],
  "adjustmentFactors": {
    "laborMultiplier": 1.0,
    "materialMultiplier": 1.0,
    "categoryAdjustments": {}
  }
}`;
