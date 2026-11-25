export interface DummyCivicStory {
  id: string;
  ticketNumber: string;
  title: string;
  category: string;
  categoryLabel: string;
  status: "submitted" | "under_review" | "assigned" | "in_progress" | "resolution_submitted" | "resolved" | "closed";
  description: string;
  resolutionNotes: string | null;
  departmentName: string;
  location: {
    address: string;
    city: string;
  };
  createdAt: string;
  resolvedAt: string | null;
  artworkSrc: string;
  artworkAlt: string;
  artworkStyle: "cutout" | "squircle" | "scene";
  timeline: Array<{
    id: string;
    action: string;
    newStatus: string;
    actorRole: string;
    notes: string;
    createdAt: string;
  }>;
}

export const DUMMY_CIVIC_STORIES: DummyCivicStory[] = [
  {
    id: "old-station-road-resurfacing",
    ticketNumber: "CT-2026-0142",
    title: "Resurfacing sunken asphalt stretch near Old Station Crossing",
    category: "roads_potholes",
    categoryLabel: "Roads & Potholes",
    status: "resolved",
    description:
      "Residents documented a 12-metre stretch of fractured asphalt along Old Station Crossing where monsoon water had eroded the sub-base, creating wheel hazards for school buses and two-wheelers during morning hours.",
    resolutionNotes:
      "Milled damaged carriageway, compacted fresh aggregate base layer, laid hot-mix asphalt patch, and restored reflective kerb markings after roller compaction.",
    departmentName: "Public Works & Roads",
    location: {
      address: "Old Station Crossing, Ward 14",
      city: "Central Municipal District",
    },
    createdAt: "2026-10-14T08:40:00.000Z",
    resolvedAt: "2026-10-17T16:20:00.000Z",
    artworkSrc: "/assets/icons/Watercolor Road Repair Crew.png",
    artworkAlt: "Illustrated municipal road repair crew laying and compacting fresh asphalt",
    artworkStyle: "cutout",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Reported with two street-level photographs and pinned location.",
        createdAt: "2026-10-14T08:40:00.000Z",
      },
      {
        id: "t-2",
        action: "triaged_verified",
        newStatus: "under_review",
        actorRole: "admin",
        notes: "Classified high priority due to bus corridor congestion.",
        createdAt: "2026-10-14T11:15:00.000Z",
      },
      {
        id: "t-3",
        action: "worker_dispatched",
        newStatus: "assigned",
        actorRole: "admin",
        notes: "Assigned to Ward 14 Asphalt & Maintenance Crew.",
        createdAt: "2026-10-15T07:30:00.000Z",
      },
      {
        id: "t-4",
        action: "work_started",
        newStatus: "in_progress",
        actorRole: "worker",
        notes: "Barricaded work zone and milled damaged surface.",
        createdAt: "2026-10-16T09:05:00.000Z",
      },
      {
        id: "t-5",
        action: "resolution_approved",
        newStatus: "resolved",
        actorRole: "admin",
        notes: "Completion proof verified by supervisory engineer.",
        createdAt: "2026-10-17T16:20:00.000Z",
      },
    ],
  },
  {
    id: "ashok-grove-streetlamp-restoration",
    ticketNumber: "CT-2026-0158",
    title: "Restoring heritage streetlamp circuit along Ashok Grove footpath",
    category: "streetlights",
    categoryLabel: "Streetlights",
    status: "resolved",
    description:
      "Evening walkers reported four consecutive cast-iron lamp posts unlit along the north garden promenade of Ashok Grove, leaving pedestrian steps dark after 6:30 PM.",
    resolutionNotes:
      "Replaced moisture-damaged underground feeder splice, installed warm-spectrum LED lamp modules, and tested automated dusk-to-dawn relay across all four poles.",
    departmentName: "Streetlighting & Electrical",
    location: {
      address: "Ashok Grove Promenade, Ward 07",
      city: "North Civic Zone",
    },
    createdAt: "2026-10-19T18:55:00.000Z",
    resolvedAt: "2026-10-21T19:10:00.000Z",
    artworkSrc: "/assets/icons/Vintage Streetlamp Among Greenery.png",
    artworkAlt: "Illustrated heritage green streetlamp glowing beside park greenery",
    artworkStyle: "squircle",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Logged evening outage across Poles #12 to #15.",
        createdAt: "2026-10-19T18:55:00.000Z",
      },
      {
        id: "t-2",
        action: "worker_dispatched",
        newStatus: "assigned",
        actorRole: "admin",
        notes: "Routed to North Zone Electrical Maintenance unit.",
        createdAt: "2026-10-20T09:00:00.000Z",
      },
      {
        id: "t-3",
        action: "resolution_approved",
        newStatus: "resolved",
        actorRole: "admin",
        notes: "Verified dusk illumination test photos.",
        createdAt: "2026-10-21T19:10:00.000Z",
      },
    ],
  },
  {
    id: "banyan-lane-water-standpost-seal",
    ticketNumber: "CT-2026-0164",
    title: "Repairing leaking brass standpost valve at Banyan Market Corner",
    category: "water_leakage",
    categoryLabel: "Water Supply",
    status: "resolved",
    description:
      "A worn spindle gasket on the neighbourhood stone standpost caused continuous clean water runoff onto the market steps throughout morning supply hours.",
    resolutionNotes:
      "Isolated branch valve, fitted new brass spindle assembly with reinforced packing seal, and cleared basin overflow outlet.",
    departmentName: "Water Supply & Pipelines",
    location: {
      address: "Banyan Market Corner, Ward 03",
      city: "East Heritage Ward",
    },
    createdAt: "2026-10-22T07:15:00.000Z",
    resolvedAt: "2026-10-22T15:40:00.000Z",
    artworkSrc: "/assets/icons/Water Tap with Basin and Greenery.png",
    artworkAlt: "Illustrated stone water standpost with brass tap and circular basin",
    artworkStyle: "squircle",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Continuous valve drip documented during morning supply.",
        createdAt: "2026-10-22T07:15:00.000Z",
      },
      {
        id: "t-2",
        action: "work_started",
        newStatus: "in_progress",
        actorRole: "worker",
        notes: "Plumbing technician dispatched with replacement brass valve.",
        createdAt: "2026-10-22T11:20:00.000Z",
      },
      {
        id: "t-3",
        action: "resolution_approved",
        newStatus: "resolved",
        actorRole: "admin",
        notes: "Zero-leakage test confirmed after valve pressurization.",
        createdAt: "2026-10-22T15:40:00.000Z",
      },
    ],
  },
  {
    id: "canal-view-storm-drain-grate",
    ticketNumber: "CT-2026-0171",
    title: "Desilting stormwater culvert and straightening grate on Canal Road",
    category: "drainage",
    categoryLabel: "Drainage",
    status: "in_progress",
    description:
      "Dry leaves and construction silt clogged the roadside stormwater grate at Canal Road bend, slowing runoff during heavy evening showers.",
    resolutionNotes:
      "Culvert chamber desilted and inflow restored; final concrete apron curing before administrative inspection.",
    departmentName: "Stormwater & Drainage",
    location: {
      address: "Canal Road Bend, Ward 11",
      city: "South Basin District",
    },
    createdAt: "2026-10-25T10:10:00.000Z",
    resolvedAt: null,
    artworkSrc: "/assets/icons/Watercolor Storm Drain with Lush Greenery.png",
    artworkAlt: "Illustrated stone stormwater drain culvert with flowing water and greenery",
    artworkStyle: "cutout",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Photo of blocked roadside culvert uploaded.",
        createdAt: "2026-10-25T10:10:00.000Z",
      },
      {
        id: "t-2",
        action: "worker_dispatched",
        newStatus: "assigned",
        actorRole: "admin",
        notes: "Assigned to South Basin Desilting Crew.",
        createdAt: "2026-10-25T14:00:00.000Z",
      },
      {
        id: "t-3",
        action: "work_started",
        newStatus: "in_progress",
        actorRole: "worker",
        notes: "Debris cleared from culvert throat; resetting iron grate.",
        createdAt: "2026-10-26T09:15:00.000Z",
      },
    ],
  },
  {
    id: "town-square-dual-bin-replacement",
    ticketNumber: "CT-2026-0179",
    title: "Installing covered wet & dry waste station at Town Hall Gardens",
    category: "sanitation",
    categoryLabel: "Sanitation",
    status: "resolved",
    description:
      "Garden visitors noted that rusted open bins near the southern bench cluster overflowed by afternoon, attracting stray birds and litter.",
    resolutionNotes:
      "Replaced rusted frames with a dual covered wet-and-dry segregation bin canopy bolted to stone pavers and added daily 7:00 AM collection routing.",
    departmentName: "Sanitation & Solid Waste",
    location: {
      address: "Town Hall Gardens, South Gate",
      city: "Civic Heritage Core",
    },
    createdAt: "2026-10-27T09:30:00.000Z",
    resolvedAt: "2026-10-29T13:00:00.000Z",
    artworkSrc: "/assets/icons/Watercolor Dual Waste Bins.png",
    artworkAlt: "Illustrated sheltered dual wet waste and dry waste segregation bins",
    artworkStyle: "squircle",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Requested covered segregated waste receptacles near south benches.",
        createdAt: "2026-10-27T09:30:00.000Z",
      },
      {
        id: "t-2",
        action: "resolution_approved",
        newStatus: "resolved",
        actorRole: "admin",
        notes: "Installed dual-bin shelter and updated route schedule.",
        createdAt: "2026-10-29T13:00:00.000Z",
      },
    ],
  },
  {
    id: "heritage-civic-promenade-paving",
    ticketNumber: "CT-2026-0183",
    title: "Re-levelling sandstone promenade slabs outside Civic Rotunda Park",
    category: "public_infrastructure",
    categoryLabel: "Public Infrastructure",
    status: "assigned",
    description:
      "Tree roots had lifted six sandstone flagstones along the eastern approach path to Civic Rotunda Park, creating an uneven edge for elderly visitors.",
    resolutionNotes:
      "Masonry team scheduled to lift slabs, trim surface roots cleanly, and re-bed stonework on levelled sand mortar.",
    departmentName: "Parks & Civic Maintenance",
    location: {
      address: "Civic Rotunda Park, East Approach",
      city: "Civic Heritage Core",
    },
    createdAt: "2026-11-01T11:45:00.000Z",
    resolvedAt: null,
    artworkSrc: "/assets/images/Neoclassical Civic Park at Sunrise.png",
    artworkAlt: "Illustrated civic park stone pathway, bench, streetlamp, and domed landmark",
    artworkStyle: "scene",
    timeline: [
      {
        id: "t-1",
        action: "complaint_submitted",
        newStatus: "submitted",
        actorRole: "citizen",
        notes: "Submitted measurements and photos of lifted path stones.",
        createdAt: "2026-11-01T11:45:00.000Z",
      },
      {
        id: "t-2",
        action: "worker_dispatched",
        newStatus: "assigned",
        actorRole: "admin",
        notes: "Assigned to Heritage Masonry & Parks unit.",
        createdAt: "2026-11-02T10:00:00.000Z",
      },
    ],
  },
];

export function getDummyStoryById(id: string): DummyCivicStory | undefined {
  return DUMMY_CIVIC_STORIES.find((s) => s.id === id || s.ticketNumber === id);
}
