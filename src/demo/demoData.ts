// Sample data for the public demo (/demo, /demo/report).
// Shapes mirror the tRPC responses used by the real dashboard and report pages.

export type Tri = boolean | null;

export interface DemoItem {
  id: number;
  name: string;
  clean: Tri;
  undamaged: Tri;
  working: Tri;
  rating: number | null;
  comment: string | null;
}
export interface DemoArea {
  id: number;
  name: string;
  items: DemoItem[];
}
export interface DemoMedia {
  id: number;
  areaId: number | null;
  kind: "image" | "video";
  url: string;
  caption: string | null;
}
export interface DemoAction {
  id: number;
  text: string;
  status: "pending" | "approved" | "more_info" | "declined";
  response: string | null;
  respondedAt: Date | null;
}
export interface DemoReportSummary {
  id: number;
  title: string;
  type: string;
  status: string;
  inspectionDate: string;
  score: number | null;
  pendingActions: number;
}
export interface DemoProperty {
  id: number;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  tenantName: string | null;
  weeklyRent: string | null;
  leaseExpiry: string | null;
  ownerCode?: string;
  reports: DemoReportSummary[];
}

/* ------------------------------ dashboard ------------------------------ */

export const demoInspectorProperties: DemoProperty[] = [
  {
    id: 1,
    address: "2/10 Hillcrest Road",
    suburb: "Kewdale",
    state: "WA",
    postcode: "6105",
    tenantName: "Sarah & Tom Miller",
    weeklyRent: "$810 per week",
    leaseExpiry: "13/03/2027",
    ownerCode: "HILL10",
    reports: [
      {
        id: 101,
        title: "Routine Inspection — August 2026",
        type: "routine",
        status: "published",
        inspectionDate: "Thursday, 07/08/2026",
        score: 85,
        pendingActions: 1,
      },
      {
        id: 102,
        title: "Entry Condition Report",
        type: "entry",
        status: "draft",
        inspectionDate: "Monday, 02/03/2026",
        score: null,
        pendingActions: 0,
      },
    ],
  },
  {
    id: 2,
    address: "48 Sandalwood Avenue",
    suburb: "Belmont",
    state: "WA",
    postcode: "6104",
    tenantName: null,
    weeklyRent: null,
    leaseExpiry: null,
    ownerCode: "SAND48",
    reports: [],
  },
];

export const demoOwnerProperties: DemoProperty[] = [
  {
    id: 3,
    address: "7/22 Raleigh Street",
    suburb: "Carlisle",
    state: "WA",
    postcode: "6101",
    tenantName: "J. Nguyen",
    weeklyRent: "$695 per week",
    leaseExpiry: "21/11/2026",
    reports: [
      {
        id: 103,
        title: "Routine Inspection — July 2026",
        type: "routine",
        status: "published",
        inspectionDate: "Friday, 17/07/2026",
        score: 92,
        pendingActions: 0,
      },
    ],
  },
];

/* ------------------------------ report view ---------------------------- */

export const demoReport = {
  id: 101,
  title: "Routine Inspection — August 2026",
  type: "routine",
  status: "published",
  inspectionDate: "Thursday, 07/08/2026",
  inspectorName: "Alex Harper",
  tenantName: "Sarah & Tom Miller",
  score: 85,
  cleanliness: 9,
  condition: 8,
  summary:
    "The property is presenting in a clean and tidy condition. The tenants are taking great care of the property overall.",
  maintenanceRequired:
    "Oven requires a thorough clean. Cobwebs to be removed from eaves at the front of the property.",
  suggestedImprovements:
    "Tenant to increase reticulation watering to lawn areas through summer.",
};

export const demoAreas: DemoArea[] = [
  {
    id: 1,
    name: "Front of Property",
    items: [
      { id: 1, name: "Gardens & lawns", clean: true, undamaged: true, working: null, rating: 7, comment: "Healthy condition, hedged and trimmed. Minor weeds present to front beds." },
      { id: 2, name: "Eaves & gutters", clean: false, undamaged: true, working: null, rating: 7, comment: "Minor cobwebs present — removal requested." },
      { id: 3, name: "Driveway & paths", clean: true, undamaged: true, working: null, rating: 9, comment: null },
    ],
  },
  {
    id: 2,
    name: "Kitchen",
    items: [
      { id: 4, name: "Oven & cooktop", clean: false, undamaged: true, working: true, rating: 6, comment: "Oven requires a thorough clean — see maintenance items." },
      { id: 5, name: "Benchtops & cabinets", clean: true, undamaged: true, working: true, rating: 9, comment: "Clean with no visible damage." },
      { id: 6, name: "Sink & taps", clean: true, undamaged: true, working: true, rating: 9, comment: "In good working order." },
      { id: 7, name: "Flooring", clean: true, undamaged: true, working: null, rating: 8, comment: null },
    ],
  },
  {
    id: 3,
    name: "Living Room",
    items: [
      { id: 8, name: "Walls & ceilings", clean: true, undamaged: true, working: null, rating: 8, comment: "Minor marks to walls near doorway." },
      { id: 9, name: "Carpet", clean: true, undamaged: true, working: null, rating: 8, comment: "Fair wear and tear noted." },
      { id: 10, name: "Windows & blinds", clean: true, undamaged: true, working: true, rating: 9, comment: null },
      { id: 11, name: "Air conditioning", clean: true, undamaged: true, working: true, rating: 10, comment: "Present and working." },
    ],
  },
  {
    id: 4,
    name: "Main Bathroom",
    items: [
      { id: 12, name: "Shower & screen", clean: true, undamaged: true, working: true, rating: 8, comment: null },
      { id: 13, name: "Vanity & mirror", clean: true, undamaged: true, working: true, rating: 9, comment: "Recently cleaned, no damage noted." },
      { id: 14, name: "Exhaust fan", clean: true, undamaged: true, working: true, rating: 9, comment: null },
    ],
  },
  {
    id: 5,
    name: "Bedroom 1",
    items: [
      { id: 15, name: "Walls & doors", clean: true, undamaged: true, working: true, rating: 9, comment: null },
      { id: 16, name: "Built-in robe", clean: true, undamaged: true, working: true, rating: 9, comment: "Appears undamaged." },
      { id: 17, name: "Carpet", clean: true, undamaged: true, working: null, rating: 8, comment: null },
    ],
  },
];

export const demoMedia: DemoMedia[] = [
  {
    id: 1,
    areaId: 1,
    kind: "image",
    url: "/brand/demo-exterior.jpg",
    caption: "Front elevation presenting well — minor weeds to garden beds.",
  },
  {
    id: 2,
    areaId: 2,
    kind: "image",
    url: "/brand/demo-kitchen.jpg",
    caption: "Kitchen overall in good order. Oven clean requested as maintenance.",
  },
];

export const demoActions: DemoAction[] = [
  {
    id: 1,
    text: "Oven requires a thorough clean — approve a professional oven clean?",
    status: "pending",
    response: null,
    respondedAt: null,
  },
  {
    id: 2,
    text: "Tenant to increase reticulation watering to lawn areas.",
    status: "approved",
    response: "Approved — tenant has been advised.",
    respondedAt: new Date("2026-08-07T06:30:00"),
  },
];
