// Shared domain constants for Propcheq (frontend + backend)

export const REPORT_TYPES = [
  { value: "routine", label: "Routine Inspection" },
  { value: "entry", label: "Entry Condition" },
  { value: "exit", label: "Exit Condition" },
] as const;
export type ReportType = (typeof REPORT_TYPES)[number]["value"];

export interface AreaTemplate {
  name: string;
  items: string[];
}

// Modeled on the actual inspection reports (Inspection Express / agency layout)
export const STANDARD_AREAS: AreaTemplate[] = [
  {
    name: "Front of Property",
    items: ["Driveway", "Fence", "Gate", "Letterbox", "Lawns", "Garden", "Path", "Walls", "Eaves", "Roof", "Alarm"],
  },
  {
    name: "Entry",
    items: ["Screen/Door", "Walls", "Floor", "Ceiling", "Lights/Switches/Points"],
  },
  {
    name: "Lounge",
    items: ["Door", "Floor", "Walls", "Ceiling", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Kitchen",
    items: ["Floor", "Walls", "Ceiling", "Bench", "Sink", "Oven", "Stovetop", "Rangehood", "Dishwasher", "Cupboards/Drawers", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Bedroom 1",
    items: ["Door", "Floor", "Walls", "Ceiling", "Windows/Coverings", "Lights/Switches/Points", "Wardrobe"],
  },
  {
    name: "Bedroom 2",
    items: ["Door", "Floor", "Walls", "Ceiling", "Windows/Coverings", "Lights/Switches/Points", "Wardrobe"],
  },
  {
    name: "Bedroom 3",
    items: ["Door", "Floor", "Walls", "Ceiling", "Windows/Coverings", "Lights/Switches/Points", "Wardrobe"],
  },
  {
    name: "Ensuite",
    items: ["Door", "Floor", "Walls", "Ceiling", "Shower/Bath/Taps", "Mirror/Cabinet/Vanity", "Toilet", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Bathroom",
    items: ["Door", "Floor", "Walls", "Ceiling", "Shower/Bath/Taps", "Mirror/Cabinet/Vanity", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Laundry",
    items: ["Door", "Floor", "Walls", "Ceiling", "Trough", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Toilet",
    items: ["Door", "Floor", "Walls", "Ceiling", "Toilet", "Windows/Coverings", "Lights/Switches/Points"],
  },
  {
    name: "Passage/Hallway",
    items: ["Floor", "Walls", "Ceiling", "Doors/Frames", "Linen Press", "Lights/Switches/Points"],
  },
  {
    name: "Garage",
    items: ["Floor", "Walls", "Ceiling", "Garage Door", "Shoppers Door", "Lights/Switches/Points"],
  },
  {
    name: "Courtyard",
    items: ["Patio", "Walls", "Ceiling", "Pavers", "Garden Beds"],
  },
];

export const LEGISLATIVE_AREA: AreaTemplate = {
  name: "Legislative Requirements",
  items: ["Smoke Alarms", "RCD/Safety Switch", "Window & Door Locks", "Porch Light", "Window Coverings Compliance"],
};

export function areasForType(type: ReportType): AreaTemplate[] {
  return type === "routine" ? [...STANDARD_AREAS, LEGISLATIVE_AREA] : STANDARD_AREAS;
}

// Frequently-used phrases harvested from real reports — one tap inserts them
export const ITEM_SNIPPETS = [
  "Clean with no visible damage.",
  "In good working order.",
  "Minor cobwebs present.",
  "Minor staining present.",
  "Minor marks to walls.",
  "Fair wear and tear noted.",
  "Recently cleaned, no damage noted.",
  "Appears undamaged.",
  "Present and working.",
  "Tenant to address.",
  "Maintenance required — see summary.",
  "Chipping and bubbling present.",
  "Minor weeds present.",
  "Healthy condition, hedged and trimmed.",
];

export const SUMMARY_SNIPPETS = [
  "The property is presenting to a high standard. The tenants are taking great care of the property.",
  "The property is presenting in a clean and tidy condition.",
  "All maintenance items have now been addressed.",
  "The property requires attention in several areas — see maintenance items.",
  "The tenants are keeping the property in a satisfactory condition overall.",
];

export const MAINTENANCE_SNIPPETS = [
  "None at present.",
  "Tenant to increase reticulation watering to lawn areas.",
  "Cobwebs to be removed from eaves.",
  "Oven requires a thorough clean.",
  "Tenant to remove staining to driveway.",
];

export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Very poor",
  3: "Bad",
  4: "Below average",
  5: "Average",
  6: "Fair",
  7: "Good",
  8: "Very good",
  9: "Excellent",
  10: "Outstanding",
};

export function computeScore(cleanliness: number | null, condition: number | null): number | null {
  if (!cleanliness && !condition) return null;
  const c = cleanliness ?? 0;
  const k = condition ?? 0;
  const n = (cleanliness ? 1 : 0) + (condition ? 1 : 0);
  return Math.round(((c + k) / n) * 10);
}
