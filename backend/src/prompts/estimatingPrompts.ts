// Re-export the main estimating prompt
export { AI_ESTIMATING_SYSTEM_PROMPT } from './systemPrompt.js';

// Project type specific prompts
export const PROJECT_TYPE_PROMPTS: Record<string, string> = {
  KITCHEN_REMODEL: `
## KITCHEN REMODEL SPECIFICS

### Common Line Items
- Demo (cabinets, countertops, flooring, backsplash)
- Cabinets (base, wall, pantry, island)
- Countertops (granite, quartz, butcher block, laminate)
- Appliances (if included)
- Plumbing (rough-in, fixtures, disposal)
- Electrical (circuits, outlets, lighting, under-cabinet)
- Flooring (prep, material, install)
- Backsplash (prep, material, install)
- Paint (walls, ceiling, trim)
- Hardware (pulls, knobs, hinges)
- Permits and inspections

### Labor Hours Guidelines
- Cabinet demo: 4-8 hours
- Cabinet install: 8-24 hours depending on complexity
- Countertop template + install: 4-8 hours
- Tile backsplash: 8-16 hours
- Flooring (200 sqft): 4-8 hours

### Common Upgrades (Good → Better → Best)
- Cabinets: Stock → Semi-custom → Custom
- Countertops: Laminate → Granite → Quartz
- Hardware: Basic → Mid-range → Designer
- Lighting: Basic → Layered → Smart`,

  BATHROOM_REMODEL: `
## BATHROOM REMODEL SPECIFICS

### Common Line Items
- Demo (tile, vanity, toilet, tub/shower)
- Plumbing (rough-in, fixtures, drain)
- Electrical (GFCI outlets, fan, lighting)
- Waterproofing (Kerdi or similar)
- Tile (floor, walls, shower)
- Vanity (cabinet, top, sink, faucet)
- Toilet
- Shower/tub (conversion, glass door)
- Mirror and accessories
- Paint
- Permits

### Labor Hours Guidelines
- Full demo: 8-16 hours
- Tile floor (40 sqft): 4-8 hours
- Shower tile: 16-32 hours
- Vanity install: 2-4 hours
- Plumbing rough-in: 4-8 hours

### Common Upgrades
- Toilet: Standard → Comfort height → Smart
- Shower: Tub → Walk-in → Frameless glass
- Tile: Ceramic → Porcelain → Natural stone
- Vanity: 30" stock → 48" semi-custom → Double custom`,

  ROOFING: `
## ROOFING SPECIFICS

### Common Line Items
- Tear-off (squares)
- Dump fees
- Decking repair
- Ice and water shield
- Underlayment
- Shingles/metal/tile
- Flashing
- Ridge vent
- Pipe boots
- Gutters (if included)
- Permits

### Labor Hours Guidelines
- Tear-off: 0.5-1 hour per square
- Install: 1-2 hours per square
- Ridge vent: 2-4 hours
- Flashing: 2-4 hours

### Material Tiers
- 3-tab shingles (25 yr)
- Architectural shingles (30-50 yr)
- Premium/Designer (50+ yr)
- Metal (50+ yr)`,

  PAINTING_INTERIOR: `
## INTERIOR PAINTING SPECIFICS

### Common Line Items
- Prep (fill holes, sand, caulk, tape)
- Prime (if needed)
- Paint (walls, ceilings, trim)
- Clean up

### Calculations
- Wall sqft = perimeter × height
- Ceiling sqft = length × width
- 1 gallon covers ~350 sqft
- Add 10% for cuts/waste

### Labor Hours Guidelines
- Prep per room: 1-3 hours
- Paint walls per room: 2-4 hours
- Trim per room: 1-2 hours
- Ceiling per room: 1-2 hours

### Material Tiers
- Builder grade: $20-30/gallon
- Mid-range: $40-50/gallon
- Premium: $60-80/gallon`,

  FLOORING: `
## FLOORING SPECIFICS

### Common Line Items
- Demo existing flooring
- Subfloor prep/repair
- Underlayment
- Flooring material
- Transitions and moldings
- Installation labor

### Calculations
- Add 10% waste factor for cuts
- Stairs = 2-3 sqft per step

### Labor Hours Guidelines
- LVP/Laminate: 15-25 sqft/hour
- Hardwood: 10-15 sqft/hour
- Tile: 8-12 sqft/hour
- Carpet: 20-30 sqft/hour

### Material Tiers
- Laminate: $2-4/sqft
- LVP: $3-7/sqft
- Engineered hardwood: $6-12/sqft
- Solid hardwood: $8-15/sqft
- Tile: $5-20/sqft`,
};

// Get the appropriate prompt additions for a project type
export function getProjectTypePrompt(projectType: string): string {
  return PROJECT_TYPE_PROMPTS[projectType] || '';
}
