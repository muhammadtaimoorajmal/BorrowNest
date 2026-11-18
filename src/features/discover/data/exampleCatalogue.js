/**
 * Curated, read-only demonstration catalogue for BorrowNest (Module 06 & 07).
 *
 * Provides new visitors with a realistic, browseable sample inventory
 * showcasing tools, gardening gear, household equipment, outdoor goods,
 * and electronics without inserting mock records into local IndexedDB.
 *
 * Content integrity safeguards:
 * - Zero fabricated neighbourhood names or street addresses.
 * - Explicitly labeled as illustrative demonstration equipment.
 * - Condition notes explicitly identified as sample records.
 * - Photographs are genuine real-world product photographs stored locally.
 */

import { CATEGORIES, CONDITION_TIERS } from '../../listings/validation/itemValidation';

/**
 * Resolves public asset paths with Vite base URL support for local dev and GitHub Pages.
 *
 * @param {string} relativePath - Asset path relative to public/
 * @returns {string} Fully qualified base-aware URL
 */
export function getDemoImageUrl(relativePath) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
}

export const EXAMPLE_CATALOGUE = Object.freeze([
  {
    id: 'demo-cordless-drill',
    title: '20V MAX Cordless Compact Drill/Driver',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Versatile 2-speed compact drill with ergonomic grip, 1/2-inch keyless ratcheting chuck, and LED worklight. Includes two lithium-ion batteries and rapid charger.',
    specifications: [
      'Voltage: 20V MAX platform',
      'Chuck: 1/2-inch keyless metal ratcheting',
      'Speeds: Dual-range 0–450 / 0–1,500 RPM',
      'Included: 2x 2.0Ah lithium-ion battery packs, rapid charger, contractor bag',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Minor cosmetic scuffs on chuck collar from light workshop use. Motor runs smoothly, chuck clamps concentric and tight, and batteries hold full charge.',
    suggestedUseCase: 'Hanging curtain rods, assembling flat-pack furniture, light carpentry, and home maintenance.',
    imagePath: 'demo/items/cordless-drill.jpg',
    imageAlt: 'Cordless power drill sitting on a workbench next to a lithium-ion battery pack and drill bits',
    isDemo: true,
  },
  {
    id: 'demo-electric-screwdriver',
    title: 'Rechargeable Precision Electric Screwdriver & 48-Bit Kit',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Precision electric screwdriver with aluminum alloy body, dual-torque selector, USB-C charging, and magnetic storage case with 48 S2 steel bits.',
    specifications: [
      'Torque: 0.3 Nm electric / 3.0 Nm manual',
      'Bits: 48 magnetic precision bits (Torx, Phillips, Hex, Pentalobe)',
      'Battery: 350mAh rechargeable via USB-C',
      'Lighting: 3 circular shadowless LED worklights',
    ],
    conditionGrade: 5,
    conditionLabel: CONDITION_TIERS[5].label,
    conditionDescription: 'Sample observation: Pristine condition. All 48 precision bits organized in labeled magnetic slots. USB-C charging cord included.',
    suggestedUseCase: 'Disassembling laptops, repairing smartphones, fixing eyeglasses, and delicate electronics work.',
    imagePath: 'demo/items/electric-screwdriver.jpg',
    imageAlt: 'Hand holding a precision screwdriver driving a screw into a compact electronic assembly',
    isDemo: true,
  },
  {
    id: 'demo-complete-toolkit',
    title: '148-Piece Household Hand Tool & Socket Set',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Comprehensive general-purpose homeowner toolkit housed in a durable blow-molded case. Contains all standard hand tools needed for basic repairs.',
    specifications: [
      'Includes: 16oz claw hammer, 8-inch adjustable wrench, slip-joint pliers',
      'Sockets: 1/4-inch drive ratchet with metric & SAE sockets',
      'Accessories: Magnetic bit driver, 30 bits, tape measure, torpedo level, utility knife',
      'Case: Rugged blow-molded carry case with locking latches',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: All tools accounted for, cleaned, and lightly oiled. Sturdy carry case with secure latches.',
    suggestedUseCase: 'Plumbing washer replacements, tightening bicycle components, hanging picture frames, and weekend DIY tasks.',
    imagePath: 'demo/items/complete-toolkit.jpg',
    imageAlt: 'Organized tool box showing an assortment of wrenches, pliers, sockets, and screwdrivers',
    isDemo: true,
  },
  {
    id: 'demo-pruning-shears',
    title: 'Bypass Pruning Shears & Folding Hand Saw Set',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'High-leverage hardened steel bypass pruner paired with a 7-inch triple-ground folding branch saw. Ideal for garden grooming and limb clearing.',
    specifications: [
      'Pruner Capacity: 5/8-inch cut diameter',
      'Saw Blade: 7-inch carbon steel with triple-ground teeth',
      'Grips: Ergonomic soft-grip handles with thumb safety lock',
      'Weight: 0.9 lbs combined',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Blades sharpened and lubricated. Pivot tension freshly calibrated. Handles clean without cracks.',
    suggestedUseCase: 'Pruning perennial shrubs, deadheading rose bushes, and cutting back small overgrown branches.',
    imagePath: 'demo/items/pruning-shears.jpg',
    imageAlt: 'Gardening pruning shears and gloves resting on fresh garden foliage',
    isDemo: true,
  },
  {
    id: 'demo-hedge-trimmer',
    title: '18V Cordless Garden Hedge Trimmer (22-Inch Blade)',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'Quiet, lightweight 22-inch cordless hedge trimmer featuring dual-action shearing blades and a five-cushion motor mount to reduce operator vibration.',
    specifications: [
      'Blade Length: 22 inches dual-action double-sided steel',
      'Stroke Rate: 2,700 SPM cutting speed',
      'Battery: 18V lithium-ion rechargeable (charger included)',
      'Safety: Two-handed safety switch and transparent hand guard',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Dual-action blades clean and oiled with no bent teeth. Protective blade sheath and battery charger included.',
    suggestedUseCase: 'Shaping boxwood hedges, trimming privet shrubs, and tidying garden boundary foliage.',
    imagePath: 'demo/items/hedge-trimmer.jpg',
    imageAlt: 'Garden hedge trimmer being used to trim green bushes with clean, level lines',
    isDemo: true,
  },
  {
    id: 'demo-sewing-machine',
    title: 'Computerized Household Sewing & Mending Machine',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Feature-rich computerized sewing machine with 70 built-in stitches, automatic needle threader, wide extension table, and jam-resistant drop-in bobbin.',
    specifications: [
      'Stitches: 70 utility, decorative, and heirloom stitch patterns',
      'Display: Backlit LCD screen with push-button stitch selection',
      'Accessories: 10 sewing feet, foot controller, hardcover case',
      'Speed: Up to 850 stitches per minute with slider speed control',
    ],
    conditionGrade: 5,
    conditionLabel: CONDITION_TIERS[5].label,
    conditionDescription: 'Sample observation: Like new. Smooth feed dogs, freshly tested tension balance. Includes instruction manual and accessory pouch.',
    suggestedUseCase: 'Hemming curtains, repairing torn seams, garment alterations, and craft or quilting projects.',
    imagePath: 'demo/items/sewing-machine.jpg',
    imageAlt: 'Modern computerized sewing machine on a table with needle, presser foot, and spools of thread',
    isDemo: true,
  },
  {
    id: 'demo-carpet-steam-cleaner',
    title: 'Portable Deep Carpet & Upholstery Spot Cleaner',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Powerful portable spot cleaner combining robust suction, scrubbing action, and cleaning solution to remove deep-down dirt and stubborn stains.',
    specifications: [
      'Motor: 5.7 amp powerful suction',
      'Tank Capacity: 3/4 gallon dual-tank system (clean/dirty water)',
      'Hose: 5-foot flexible reach hose with 3-inch tough stain tool',
      'Power Cord: 20-foot cord with quick-release wrap',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Sanitized and completely dried after last use. Brush bristles straight and suction chamber spotless.',
    suggestedUseCase: 'Spot-cleaning sofa upholstery, cleaning automobile carpet floor mats, and treating pet stains on area rugs.',
    imagePath: 'demo/items/carpet-steam-cleaner.jpg',
    imageAlt: 'Compact spot cleaning appliance resting on clean carpet with hose and brush attachment',
    isDemo: true,
  },
  {
    id: 'demo-camping-tent',
    title: '6-Person Family Cabin Camping Tent with Rainfly',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'Spacious 6-person cabin tent with pre-attached steel and fiberglass poles for a 60-second setup. WeatherTec welded corners and inverted seams keep rain out.',
    specifications: [
      'Capacity: Fits 6 people or 2 queen-sized airbeds',
      'Dimensions: 10 x 9 ft floor footprint, 6 ft center height',
      'Setup: 60-second instant pole framework',
      'Included: Waterproof rainfly, ground stakes, carry bag',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Clean fabric, waterproof seam tape fully intact. All zippers glide freely. Complete with guy lines and ground stakes.',
    suggestedUseCase: 'Family weekend camping trips, music festivals, provincial park vacations, and backyard campouts.',
    imagePath: 'demo/items/camping-tent.jpg',
    imageAlt: 'A pitched cabin tent in a scenic outdoor campsite among pine trees during daytime',
    isDemo: true,
  },
  {
    id: 'demo-portable-camp-stove',
    title: '2-Burner Propane Portable Camping Stove',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'High-output two-burner portable outdoor stove producing 20,000 BTUs per burner. Features matchless rotary ignition and a three-sided folding windscreen.',
    specifications: [
      'Output: Dual 20,000 BTU burners (40,000 BTU total output)',
      'Cooking Area: 21.5 x 12 inches (fits two 10-inch skillets)',
      'Ignition: Matchless piezoelectric push-and-turn ignition',
      'Fuel: Standard 1-lb disposable propane cylinder (regulator included)',
    ],
    conditionGrade: 4,
    conditionLabel: CONDITION_TIERS[4].label,
    conditionDescription: 'Sample observation: Nickel-coated steel grates clean and free of grease buildup. Both burner rings ignite evenly.',
    suggestedUseCase: 'Campground group cooking, tailgate meals, morning camp coffee, and outdoor skillet cooking.',
    imagePath: 'demo/items/portable-camp-stove.jpg',
    imageAlt: 'Two-burner camping stove set up on an outdoor picnic table with cooking cookware in the woods',
    isDemo: true,
  },
  {
    id: 'demo-portable-projector',
    title: 'Portable 720p HD Movie Projector with Built-In Speaker',
    category: CATEGORIES.ELECTRONICS.id,
    categoryLabel: CATEGORIES.ELECTRONICS.label,
    description: 'Portable DLP movie projector with 500 ANSI lumen lamp, 1-second autofocus, dual 10W cinematic audio drivers, and built-in 3-hour rechargeable battery.',
    specifications: [
      'Resolution: 1280 x 720 (720p HD) DLP with auto keystone correction',
      'Brightness: 500 ANSI lumens',
      'Audio: Dual 10W stereo speakers',
      'Connectivity: HDMI 1.4, USB-A, Bluetooth, 3.5mm AUX audio out',
      'Battery: Built-in 12,500mAh battery (up to 3 hours playtime)',
    ],
    conditionGrade: 5,
    conditionLabel: CONDITION_TIERS[5].label,
    conditionDescription: 'Sample observation: Pristine condition. Optical lens free of dust or scratches. Includes remote control, HDMI cable, power adapter, and padded travel pouch.',
    suggestedUseCase: 'Backyard outdoor summer movie nights, community slideshow presentations, and gaming projector setups.',
    imagePath: 'demo/items/portable-projector.jpg',
    imageAlt: 'Compact video projector casting a bright movie image onto a projection screen in an evening setting',
    isDemo: true,
  },
]);
