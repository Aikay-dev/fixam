/**
 * Nigerian names for demo seeding.
 *
 * Deliberately spread across Yoruba, Igbo, Hausa/Fulani and Edo/Delta rather
 * than defaulting to one group — Lagos artisans come from everywhere, and a
 * directory of a hundred Yoruba names would look wrong to anyone from there.
 */

export const FIRST_NAMES_MALE = [
  "Emeka", "Tunde", "Chukwudi", "Ibrahim", "Segun", "Obinna", "Musa", "Kunle",
  "Ifeanyi", "Yusuf", "Bolaji", "Nnamdi", "Sadiq", "Femi", "Chidi", "Aliyu",
  "Gbenga", "Uche", "Bashir", "Wale", "Ikechukwu", "Salisu", "Dare", "Chinedu",
  "Abdul", "Seyi", "Ekene", "Haruna", "Rotimi", "Ugochukwu", "Danjuma", "Tobi",
  "Kelechi", "Suleiman", "Yemi", "Chibuzor", "Nasir", "Damilare", "Osaze",
  "Efe", "Kayode", "Somto", "Idris", "Lekan", "Chima", "Garba", "Bode",
  "Okechukwu", "Auwal", "Sesan",
];

export const FIRST_NAMES_FEMALE = [
  "Amaka", "Folake", "Ngozi", "Aisha", "Bukola", "Chioma", "Halima", "Yetunde",
  "Adaeze", "Zainab", "Temitope", "Nkechi", "Fatima", "Simisola", "Ifeoma",
  "Maryam", "Bisola", "Uchenna", "Hauwa", "Omolara", "Chinwe", "Rukayat",
  "Titilayo", "Obiageli", "Amina",
];

export const SURNAMES = [
  "Okafor", "Adeyemi", "Eze", "Bello", "Balogun", "Nwachukwu", "Abubakar",
  "Ogunleye", "Okonkwo", "Sani", "Adebayo", "Chukwu", "Mohammed", "Oyelaran",
  "Ibe", "Lawal", "Adeleke", "Nwosu", "Usman", "Ogundipe", "Anyanwu", "Yakubu",
  "Fadipe", "Obi", "Aliyu", "Oshodi", "Madu", "Danladi", "Akinyele", "Ude",
  "Suleiman", "Ajayi", "Onyeka", "Gambo", "Adesanya", "Ekwueme", "Musa",
  "Olaniyan", "Iheanacho", "Shehu", "Afolabi", "Nnaji", "Bala", "Ogbonna",
  "Okoro", "Idowu", "Umeh", "Zubairu", "Alabi", "Emeka",
];

/**
 * Trade slug -> the work-photo group it draws portfolio images from, plus
 * bio fragments written in that trade's own vocabulary.
 */
export const TRADE_PROFILES: Record<
  string,
  { group: string; does: string[]; noun: string }
> = {
  plumber: {
    group: "plumbing",
    noun: "plumbing",
    does: ["leaks and burst pipes", "shower and water heater installs", "full bathroom re-plumbs", "kitchen sinks and taps", "water pump and tank fitting"],
  },
  electrician: {
    group: "electrical",
    noun: "electrical work",
    does: ["house rewiring", "distribution boards", "socket and lighting installs", "fault finding", "surge and earthing checks"],
  },
  carpenter: {
    group: "carpentry",
    noun: "carpentry",
    does: ["fitted wardrobes", "kitchen cabinets", "doors and frames", "roofing timber", "custom shelving"],
  },
  "furniture-maker": {
    group: "carpentry",
    noun: "furniture making",
    does: ["sofas and armchairs", "dining sets", "bed frames", "office desks"],
  },
  "ac-installation-repair": {
    group: "cooling",
    noun: "AC work",
    does: ["split unit installs", "servicing and gassing", "fault diagnosis", "cold room maintenance"],
  },
  "refrigerator-freezer-repair": {
    group: "cooling",
    noun: "fridge repair",
    does: ["fridge and freezer faults", "compressor replacement", "deep freezer servicing"],
  },
  tiler: {
    group: "finishing",
    noun: "tiling",
    does: ["floor and wall tiling", "bathroom tiling", "porcelain and ceramic", "skirting and trims"],
  },
  painter: {
    group: "finishing",
    noun: "painting",
    does: ["interior and exterior painting", "texture coat", "screeding and filling", "wallpaper hanging"],
  },
  "pop-ceiling": {
    group: "finishing",
    noun: "POP work",
    does: ["POP ceilings and cornices", "gypsum boards", "decorative ceiling designs", "3D wall panels"],
  },
  "aluminium-fabricator": {
    group: "metal",
    noun: "aluminium work",
    does: ["sliding and casement windows", "aluminium doors", "office partitions", "shopfronts"],
  },
  "welder-fabricator": {
    group: "metal",
    noun: "welding and fabrication",
    does: ["gates and railings", "burglary proof", "steel frames", "water tank stands"],
  },
  "gate-installation": {
    group: "metal",
    noun: "gate work",
    does: ["automatic gate motors", "sliding gates", "gate repair and alignment"],
  },
  "generator-repair": {
    group: "electrical",
    noun: "generator work",
    does: ["generator servicing", "engine repair", "rewinding", "automatic changeover installs"],
  },
  "solar-inverter-installation": {
    group: "electrical",
    noun: "solar and inverter work",
    does: ["solar panel installs", "inverter and battery banks", "hybrid systems", "load assessments"],
  },
  "auto-mechanic": {
    group: "auto",
    noun: "mechanic work",
    does: ["engine diagnostics and repair", "servicing", "suspension and brakes", "home and roadside callout"],
  },
  "auto-electrician": {
    group: "auto",
    noun: "auto electrical work",
    does: ["car wiring faults", "alternator and starter", "central lock and alarm", "battery and charging"],
  },
  "house-cleaning": {
    group: "cleaning",
    noun: "cleaning",
    does: ["deep cleaning", "move-in and move-out cleans", "regular housekeeping", "post-party cleanup"],
  },
  "fumigation-pest-control": {
    group: "cleaning",
    noun: "fumigation",
    does: ["termite treatment", "cockroach and rodent control", "bed bug treatment", "pre-occupancy fumigation"],
  },
  "post-construction-cleaning": {
    group: "cleaning",
    noun: "post-construction cleaning",
    does: ["after-build cleaning", "window and facade cleaning", "debris clearing"],
  },
  "bricklayer-mason": {
    group: "building",
    noun: "block work",
    does: ["block laying", "plastering and rendering", "foundations", "boundary walls"],
  },
  roofer: {
    group: "building",
    noun: "roofing",
    does: ["stone-coated roofing", "aluminium roofing sheets", "leak repairs", "gutter installation"],
  },
  "building-contractor": {
    group: "building",
    noun: "building work",
    does: ["full builds", "extensions and renovations", "project supervision", "finishing works"],
  },
  locksmith: {
    group: "metal",
    noun: "locksmith work",
    does: ["door lock replacement", "emergency lockouts", "key cutting", "security upgrades"],
  },
  "dstv-satellite-installation": {
    group: "electrical",
    noun: "satellite installation",
    does: ["DSTV and GOtv installs", "dish alignment", "signal fault fixing", "multi-room setups"],
  },
  "cctv-security-systems": {
    group: "electrical",
    noun: "CCTV work",
    does: ["CCTV installation", "IP camera setups", "DVR configuration", "remote viewing setup"],
  },
};
