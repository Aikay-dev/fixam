/**
 * Fixam's trade taxonomy.
 *
 * Built by merging the breadth of the UK marketplaces (MyBuilder,
 * Checkatrade) with the trades Nigerians actually hire — POP ceilings,
 * generator repair, vulcanizers, DSTV installers, aluminium fabricators,
 * septic evacuation, solar/inverter. Those last ones are exactly where
 * wrkman and LaborHack are thin, and each one becomes its own SEO page.
 *
 * `synonyms` matter as much as names: nobody searches "refrigeration
 * technician", they search "fridge engineer" or "AC guy".
 */

export type SeedCategory = {
  name: string;
  slug: string;
  synonyms?: string[];
  description?: string;
};

export type SeedCategoryGroup = {
  name: string;
  slug: string;
  icon: string;
  children: SeedCategory[];
};

export const CATEGORY_GROUPS: SeedCategoryGroup[] = [
  {
    name: "Plumbing & Water",
    slug: "plumbing-water",
    icon: "Droplets",
    children: [
      {
        name: "Plumber",
        slug: "plumber",
        synonyms: ["plumbing", "pipe work", "leaking tap", "toilet repair", "water leak"],
        description: "Leaks, pipes, taps, toilets, showers and general plumbing.",
      },
      {
        name: "Borehole Drilling",
        slug: "borehole-drilling",
        synonyms: ["borehole", "water drilling", "well drilling", "water borehole"],
        description: "Borehole sinking, drilling and rehabilitation.",
      },
      {
        name: "Water Pump & Tank Installation",
        slug: "water-pump-tank-installation",
        synonyms: ["water pump", "surface pump", "GeePee tank", "overhead tank", "pumping machine"],
        description: "Pumping machines, overhead and ground tanks, plumbing to the mains.",
      },
      {
        name: "Water Heater Installation",
        slug: "water-heater-installation",
        synonyms: ["heater", "geyser", "instant water heater", "hot water"],
      },
      {
        name: "Water Treatment & Filtration",
        slug: "water-treatment",
        synonyms: ["water filter", "water purifier", "treatment plant"],
      },
    ],
  },

  {
    name: "Electrical & Power",
    slug: "electrical-power",
    icon: "Zap",
    children: [
      {
        name: "Electrician",
        slug: "electrician",
        synonyms: ["wiring", "electrical fault", "socket", "light fitting", "electrical repair"],
        description: "Wiring, sockets, lighting, distribution boards and fault finding.",
      },
      {
        name: "Solar & Inverter Installation",
        slug: "solar-inverter-installation",
        synonyms: ["solar panel", "inverter", "battery backup", "solar installer", "off grid"],
        description: "Solar panels, inverters, batteries and hybrid power systems.",
      },
      {
        name: "Generator Repair & Servicing",
        slug: "generator-repair",
        synonyms: ["gen repair", "generator mechanic", "I better pass my neighbour", "gen servicing"],
        description: "Generator servicing, repair, rewinding and installation.",
      },
      {
        name: "Stabiliser & UPS Repair",
        slug: "stabiliser-ups-repair",
        synonyms: ["stabilizer", "AVR", "UPS", "voltage regulator"],
      },
      {
        name: "Electrical Rewiring",
        slug: "electrical-rewiring",
        synonyms: ["house rewiring", "rewire", "new wiring"],
      },
    ],
  },

  {
    name: "Cooling & Appliances",
    slug: "cooling-appliances",
    icon: "Wind",
    children: [
      {
        name: "AC Installation & Repair",
        slug: "ac-installation-repair",
        synonyms: ["air conditioner", "AC guy", "split unit", "aircon", "AC servicing", "AC gas"],
        description: "Air conditioner installation, servicing, gassing and repair.",
      },
      {
        name: "Refrigerator & Freezer Repair",
        slug: "refrigerator-freezer-repair",
        synonyms: ["fridge engineer", "fridge repair", "deep freezer", "cold room"],
      },
      {
        name: "Washing Machine Repair",
        slug: "washing-machine-repair",
        synonyms: ["washer repair", "laundry machine"],
      },
      {
        name: "Cooker & Oven Repair",
        slug: "cooker-oven-repair",
        synonyms: ["gas cooker", "microwave repair", "oven technician"],
      },
      {
        name: "Cold Room Installation",
        slug: "cold-room-installation",
        synonyms: ["cold room", "chiller", "walk-in freezer"],
      },
    ],
  },

  {
    name: "Building & Construction",
    slug: "building-construction",
    icon: "HardHat",
    children: [
      {
        name: "Bricklayer / Mason",
        slug: "bricklayer-mason",
        synonyms: ["block laying", "mason", "brick work", "blockwork"],
      },
      {
        name: "Building Contractor",
        slug: "building-contractor",
        synonyms: ["builder", "construction company", "project manager"],
      },
      {
        name: "Concrete & Groundwork",
        slug: "concrete-groundwork",
        synonyms: ["foundation", "casting", "decking", "concrete mixer"],
      },
      {
        name: "Iron Bender / Steel Fixer",
        slug: "iron-bender",
        synonyms: ["rod bender", "steel fixing", "reinforcement", "iron work"],
      },
      {
        name: "Scaffolding",
        slug: "scaffolding",
        synonyms: ["scaffold hire", "staging"],
      },
      {
        name: "Demolition",
        slug: "demolition",
        synonyms: ["pulling down", "site clearing"],
      },
    ],
  },

  {
    name: "Finishing & Interiors",
    slug: "finishing-interiors",
    icon: "PaintRoller",
    children: [
      {
        name: "POP & Ceiling Installation",
        slug: "pop-ceiling",
        synonyms: ["POP", "plaster of paris", "POP man", "screeding ceiling", "gypsum ceiling"],
        description: "POP ceilings, cornices, gypsum boards and decorative ceiling work.",
      },
      {
        name: "Painter",
        slug: "painter",
        synonyms: ["painting", "house painting", "texture coat", "emulsion"],
      },
      {
        name: "Tiler",
        slug: "tiler",
        synonyms: ["tiling", "floor tiles", "wall tiles", "tile fixer"],
      },
      {
        name: "Screeding & Plastering",
        slug: "screeding-plastering",
        synonyms: ["screeding", "plastering", "wall screed", "rendering"],
      },
      {
        name: "Wallpaper & 3D Panel Installation",
        slug: "wallpaper-3d-panel",
        synonyms: ["wallpaper", "3D panel", "wall panel", "wall covering"],
      },
      {
        name: "Interior Decorator",
        slug: "interior-decorator",
        synonyms: ["interior design", "home decor", "space styling"],
      },
    ],
  },

  {
    name: "Carpentry & Furniture",
    slug: "carpentry-furniture",
    icon: "Hammer",
    children: [
      {
        name: "Carpenter",
        slug: "carpenter",
        synonyms: ["woodwork", "carpentry", "roofing carpenter", "wood"],
      },
      {
        name: "Furniture Maker",
        slug: "furniture-maker",
        synonyms: ["furniture", "sofa maker", "bed frame", "custom furniture"],
      },
      {
        name: "Wardrobe & Cabinet Fitter",
        slug: "wardrobe-cabinet-fitter",
        synonyms: ["wardrobe", "closet", "cabinet", "fitted wardrobe"],
      },
      {
        name: "Kitchen Fitter",
        slug: "kitchen-fitter",
        synonyms: ["kitchen cabinet", "kitchen installation", "worktop"],
      },
      {
        name: "Door & Window Fitter",
        slug: "door-window-fitter",
        synonyms: ["door installation", "door fixing", "window fitting"],
      },
      {
        name: "Upholsterer",
        slug: "upholsterer",
        synonyms: ["sofa repair", "chair covering", "cushion", "re-upholstery"],
      },
    ],
  },

  {
    name: "Metal & Aluminium",
    slug: "metal-aluminium",
    icon: "Wrench",
    children: [
      {
        name: "Aluminium Fabricator",
        slug: "aluminium-fabricator",
        synonyms: ["aluminium window", "aluminium door", "sliding window", "casement"],
        description: "Aluminium windows, doors, partitions, sliding and casement work.",
      },
      {
        name: "Welder / Metal Fabricator",
        slug: "welder-fabricator",
        synonyms: ["welding", "welder", "metal work", "fabrication"],
      },
      {
        name: "Burglary Proof & Security Doors",
        slug: "burglary-proof",
        synonyms: ["burglary", "protector", "security door", "iron gate"],
      },
      {
        name: "Gate Installation & Automation",
        slug: "gate-installation",
        synonyms: ["automatic gate", "gate motor", "sliding gate", "gate repair"],
      },
      {
        name: "Locksmith",
        slug: "locksmith",
        synonyms: ["lock repair", "key cutting", "door lock", "locked out"],
      },
    ],
  },

  {
    name: "Roofing & Waterproofing",
    slug: "roofing-waterproofing",
    icon: "Home",
    children: [
      {
        name: "Roofer",
        slug: "roofer",
        synonyms: ["roofing", "stone coated", "aluminium roofing", "roof installation"],
      },
      {
        name: "Roof Repair & Leak Fixing",
        slug: "roof-repair",
        synonyms: ["roof leak", "leaking roof", "roof patching"],
      },
      {
        name: "Gutter Installation & Cleaning",
        slug: "gutter-installation",
        synonyms: ["gutter", "drainage gutter", "rain gutter"],
      },
      {
        name: "Waterproofing",
        slug: "waterproofing",
        synonyms: ["damp proofing", "leak sealing", "roof waterproof"],
      },
    ],
  },

  {
    name: "Cleaning & Property Care",
    slug: "cleaning-property-care",
    icon: "Sparkles",
    children: [
      {
        name: "House Cleaning",
        slug: "house-cleaning",
        synonyms: ["cleaner", "domestic cleaning", "deep cleaning", "housekeeping"],
      },
      {
        name: "Post-Construction Cleaning",
        slug: "post-construction-cleaning",
        synonyms: ["after build cleaning", "new house cleaning", "site cleaning"],
      },
      {
        name: "Fumigation & Pest Control",
        slug: "fumigation-pest-control",
        synonyms: ["fumigation", "pest control", "rat", "cockroach", "termite", "bed bugs"],
        description: "Fumigation, termite treatment and general pest control.",
      },
      {
        name: "Sofa & Carpet Cleaning",
        slug: "sofa-carpet-cleaning",
        synonyms: ["upholstery cleaning", "rug cleaning", "chair washing"],
      },
      {
        name: "Septic Tank Evacuation",
        slug: "septic-tank-evacuation",
        synonyms: ["soakaway", "sewage evacuation", "toilet evacuation", "septic tank"],
        description: "Septic tank and soakaway evacuation, sewage removal.",
      },
      {
        name: "Drainage & Soakaway Construction",
        slug: "drainage-soakaway",
        synonyms: ["soakaway construction", "drainage", "manhole"],
      },
    ],
  },

  {
    name: "Tech & Electronics",
    slug: "tech-electronics",
    icon: "Cpu",
    children: [
      {
        name: "DSTV / GOtv / Satellite Installation",
        slug: "dstv-satellite-installation",
        synonyms: ["DSTV", "GOtv", "startimes", "dish installation", "decoder", "satellite"],
        description: "Satellite dish alignment, decoder setup and TV signal issues.",
      },
      {
        name: "CCTV & Security Systems",
        slug: "cctv-security-systems",
        synonyms: ["CCTV", "security camera", "surveillance", "alarm system"],
      },
      {
        name: "Intercom & Access Control",
        slug: "intercom-access-control",
        synonyms: ["intercom", "access control", "door phone", "card reader"],
      },
      {
        name: "Phone Repair",
        slug: "phone-repair",
        synonyms: ["screen replacement", "phone technician", "iphone repair", "android repair"],
      },
      {
        name: "Laptop & Computer Repair",
        slug: "laptop-computer-repair",
        synonyms: ["computer engineer", "laptop repair", "PC repair"],
      },
      {
        name: "TV Repair",
        slug: "tv-repair",
        synonyms: ["television repair", "LED TV", "plasma repair"],
      },
      {
        name: "WiFi & Network Installation",
        slug: "wifi-network-installation",
        synonyms: ["networking", "router setup", "internet installation", "LAN"],
      },
    ],
  },

  {
    name: "Automotive",
    slug: "automotive",
    icon: "Car",
    children: [
      {
        name: "Auto Mechanic",
        slug: "auto-mechanic",
        synonyms: ["mechanic", "car repair", "engine repair", "motor mechanic"],
      },
      {
        name: "Auto Electrician",
        slug: "auto-electrician",
        synonyms: ["car electrician", "car wiring", "auto electrical"],
      },
      {
        name: "Vulcanizer",
        slug: "vulcanizer",
        synonyms: ["tyre repair", "vulcanizer", "flat tyre", "wheel balancing"],
        description: "Tyre repair, replacement, balancing and roadside help.",
      },
      {
        name: "Panel Beater & Auto Painting",
        slug: "panel-beater",
        synonyms: ["panel beating", "body work", "car spray", "dent repair"],
      },
      {
        name: "Car AC Repair",
        slug: "car-ac-repair",
        synonyms: ["car aircon", "vehicle AC", "car cooling"],
      },
      {
        name: "Towing Service",
        slug: "towing-service",
        synonyms: ["tow truck", "vehicle recovery", "breakdown"],
      },
    ],
  },

  {
    name: "Garden & Outdoors",
    slug: "garden-outdoors",
    icon: "Trees",
    children: [
      {
        name: "Gardener / Landscaper",
        slug: "gardener-landscaper",
        synonyms: ["landscaping", "lawn care", "garden", "grass cutting"],
      },
      {
        name: "Tree Cutting & Removal",
        slug: "tree-cutting",
        synonyms: ["tree felling", "tree surgeon", "branch cutting"],
      },
      {
        name: "Swimming Pool Construction & Maintenance",
        slug: "swimming-pool",
        synonyms: ["pool construction", "pool cleaning", "pool pump"],
      },
      {
        name: "Interlocking & Paving",
        slug: "interlocking-paving",
        synonyms: ["interlock", "paving stone", "driveway"],
      },
      {
        name: "Curtains & Blinds Installation",
        slug: "curtains-blinds",
        synonyms: ["curtain", "blinds", "window treatment", "drapes"],
      },
    ],
  },

  {
    name: "Personal & Events",
    slug: "personal-events",
    icon: "Scissors",
    children: [
      {
        name: "Tailor / Fashion Designer",
        slug: "tailor-fashion-designer",
        synonyms: ["tailor", "seamstress", "fashion designer", "sewing", "native wear"],
      },
      {
        name: "Barber",
        slug: "barber",
        synonyms: ["haircut", "barbing salon", "home service barber"],
      },
      {
        name: "Hairstylist",
        slug: "hairstylist",
        synonyms: ["hairdresser", "braiding", "weaving", "salon"],
      },
      {
        name: "Makeup Artist",
        slug: "makeup-artist",
        synonyms: ["MUA", "bridal makeup", "gele"],
      },
      {
        name: "Caterer",
        slug: "caterer",
        synonyms: ["catering", "small chops", "event food", "cook"],
      },
      {
        name: "Event Decorator",
        slug: "event-decorator",
        synonyms: ["event planner", "decoration", "wedding decor", "canopy"],
      },
      {
        name: "DJ & Sound Rental",
        slug: "dj-sound-rental",
        synonyms: ["DJ", "sound system", "PA hire", "MC"],
      },
      {
        name: "Photographer & Videographer",
        slug: "photographer-videographer",
        synonyms: ["photography", "videographer", "event coverage", "photoshoot"],
      },
    ],
  },

  {
    name: "Moving & Logistics",
    slug: "moving-logistics",
    icon: "Truck",
    children: [
      {
        name: "Movers & Haulage",
        slug: "movers-haulage",
        synonyms: ["moving company", "relocation", "haulage", "truck hire", "packers"],
      },
      {
        name: "Dispatch Rider",
        slug: "dispatch-rider",
        synonyms: ["dispatch", "delivery rider", "courier", "okada delivery"],
      },
      {
        name: "Waste Disposal",
        slug: "waste-disposal",
        synonyms: ["refuse", "waste removal", "debris removal", "PSP"],
      },
    ],
  },

  {
    name: "Professional Services",
    slug: "professional-services",
    icon: "Ruler",
    children: [
      {
        name: "Architect",
        slug: "architect",
        synonyms: ["architectural design", "building plan", "house design"],
      },
      {
        name: "Quantity Surveyor",
        slug: "quantity-surveyor",
        synonyms: ["QS", "bill of quantities", "cost estimate"],
      },
      {
        name: "Land Surveyor",
        slug: "land-surveyor",
        synonyms: ["survey plan", "land survey", "beacon"],
      },
      {
        name: "Structural Engineer",
        slug: "structural-engineer",
        synonyms: ["structural design", "structural drawing", "integrity test"],
      },
      {
        name: "Estate & Property Manager",
        slug: "estate-property-manager",
        synonyms: ["estate agent", "property management", "facility manager"],
      },
    ],
  },
];

/** Flattened leaf categories, for seeding and validation. */
export const ALL_LEAF_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.children);

export const TOTAL_CATEGORY_COUNT =
  CATEGORY_GROUPS.length + ALL_LEAF_CATEGORIES.length;
