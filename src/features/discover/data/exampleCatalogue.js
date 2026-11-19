/**
 * Curated, read-only demonstration catalogue for BorrowNest (Module 08).
 *
 * Provides new visitors with a realistic, browseable sample inventory
 * of exactly 20 verified items across five core categories:
 * - Tools (5 items)
 * - Gardening (4 items)
 * - Household (4 items)
 * - Outdoor (4 items)
 * - Electronics (3 items)
 *
 * Content integrity safeguards:
 * - Exactly 20 products matching genuine physical photography stored locally.
 * - Zero mock data in IndexedDB (personal inventory remains strictly local & private).
 * - Zero fabricated neighbourhood names, street addresses, or owner identities.
 * - Zero fictional condition inspection tiers or condition inspection records.
 * - Explicitly labeled as illustrative demonstration equipment throughout.
 */

import { CATEGORIES } from '../../listings/validation/itemValidation';

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
  // =========================================================================
  // TOOLS (5 ITEMS)
  // =========================================================================
  {
    id: 'demo-cordless-drill',
    title: 'Cordless Compact Drill/Driver',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Versatile cordless drill/driver with keyless ratcheting chuck, ergonomic handle grip, dual speed ranges, and adjustable clutch collar for general drilling and driving tasks.',
    specifications: [
      'Chuck: Keyless ratcheting chuck for round and hex shank bits',
      'Speed Range: Dual-speed gearbox with variable-speed trigger control',
      'Included: Rechargeable lithium-ion battery pack and charging cradle',
      'Mount: Integrated belt hook and ergonomic textured rubber grip',
    ],
    suggestedUseCase: 'Hanging curtain rods, assembling flat-pack furniture, light carpentry, and home maintenance.',
    imagePath: 'demo/items/cordless-drill.jpg',
    imageAlt: 'Cordless power drill sitting on a workshop floor next to a lithium-ion battery pack',
    isDemo: true,
  },
  {
    id: 'demo-electric-screwdriver',
    title: 'Rechargeable Precision Electric Screwdriver Kit',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Compact cordless electric screwdriver with push-button forward and reverse controls, torque adjustment collar, bit extension shaft, and organized bit storage case.',
    specifications: [
      'Drive: Forward/reverse push-button power drive with manual override',
      'Bit Assortment: Precision hex, Torx, Phillips, and slotted screwdriver bits',
      'Storage: Hinged storage case with dedicated molded slots and bit organizer',
      'Charging: Built-in rechargeable battery with USB charging interface',
    ],
    suggestedUseCase: 'Disassembling small appliances, repairing laptops, tightening eyeglasses, and assembling electronics.',
    imagePath: 'demo/items/electric-screwdriver.jpg',
    imageAlt: 'Cordless electric screwdriver in an organized storage case surrounded by assorted screwdriver bits',
    isDemo: true,
  },
  {
    id: 'demo-complete-toolkit',
    title: 'Household Hand Tool & Socket Set',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Comprehensive general-purpose mechanics and home repair hand-tool set arranged in an organized tray, including chrome socket drive set, ratchet, breaker bar, and wrenches.',
    specifications: [
      'Socket Drive: Ratchet handle with extension bar and metric/SAE socket array',
      'Wrenches: Chrome combination open-end and box wrenches',
      'Hand Tools: Selection of screwdrivers, pliers, and utility bit adapters',
      'Organizer: Custom molded tool tray with labeled sizing for quick inventory',
    ],
    suggestedUseCase: 'Bicycle adjustments, plumbing fixture repairs, tightening furniture bolts, and home DIY tasks.',
    imagePath: 'demo/items/complete-toolkit.jpg',
    imageAlt: 'Mechanic reaching for a socket wrench in an organized tray of chrome sockets and hand tools',
    isDemo: true,
  },
  {
    id: 'demo-impact-driver',
    title: 'Cordless Impact Driver',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'High-torque compact cordless impact driver designed for fast repetitive screw driving and heavy-duty fastener installations into timber and framing without wrist strain.',
    specifications: [
      'Collar: 1/4-inch hex quick-release collet for rapid one-handed bit changes',
      'Motor: Brushless motor delivering high rotational torque with concussive blows',
      'Controls: Variable-speed trigger with directional forward/reverse selector',
      'Battery: Detachable lithium-ion rechargeable battery pack with fuel gauge',
    ],
    suggestedUseCase: 'Building deck framing, driving structural lag screws, hanging drywall, and assembling timber fences.',
    imagePath: 'demo/items/impact-driver.jpg',
    imageAlt: 'Cordless impact driver power tool with driver bit and rechargeable battery resting on a workshop bench',
    isDemo: true,
  },
  {
    id: 'demo-wet-dry-shop-vac',
    title: 'Wet and Dry Workshop Vacuum',
    category: CATEGORIES.TOOLS.id,
    categoryLabel: CATEGORIES.TOOLS.label,
    description: 'Heavy-duty canister utility vacuum designed for wet liquid spills and dry workshop debris, featuring large drum collection tank, flexible ribbed hose, and wide floor nozzle.',
    specifications: [
      'Drum: Heavy-duty canister drum with swivel caster wheels and carry handle',
      'Hose: Flexible ribbed vacuum suction hose with locking tank connector',
      'Filtration: Dual-mode filter system suitable for water suction and dry sawdust',
      'Attachments: Wide utility floor nozzle and crevice tool for tight workshop corners',
    ],
    suggestedUseCase: 'Cleaning workshop sawdust, clearing water leaks, vacuuming car footwells, and post-renovation cleanup.',
    imagePath: 'demo/items/wet-dry-shop-vac.jpg',
    imageAlt: 'Yellow canister wet and dry workshop vacuum with flexible suction hose resting on tiled floor',
    isDemo: true,
  },

  // =========================================================================
  // GARDENING (4 ITEMS)
  // =========================================================================
  {
    id: 'demo-pruning-shears',
    title: 'Bypass Pruning Shears & Branch Trimmer',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'Precision bypass garden pruner featuring curved carbon steel cutting blades, coiled return spring, ergonomic rubber comfort grips, and thumb-operated safety lock latch.',
    specifications: [
      'Cutting Action: Scissor-style bypass shearing for clean living plant cuts',
      'Blade: Hardened carbon steel blade designed to slice without crushing stems',
      'Handles: Non-slip textured rubber grips with integrated shock-absorbing spring',
      'Safety: Positive-locking thumb safety latch for safe storage and transport',
    ],
    suggestedUseCase: 'Pruning perennial shrubs, deadheading rose bushes, trimming fruit trees, and harvesting herbs.',
    imagePath: 'demo/items/pruning-shears.jpg',
    imageAlt: 'Gardener using bypass pruning shears to trim green foliage and branches in a garden',
    isDemo: true,
  },
  {
    id: 'demo-hedge-trimmer',
    title: 'Cordless Garden Hedge Trimmer',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'Cordless electric hedge trimmer with dual-action double-sided shearing blades, transparent hand safety shield, and wrap-around auxiliary front handle for clean hedgerow shaping.',
    specifications: [
      'Blades: Dual-action reciprocating double-sided hardened steel cutting bar',
      'Safety: Two-hand safety interlock switches and impact-resistant hand guard',
      'Power: Cordless rechargeable battery operation with ergonomic handle balance',
      'Capacity: Suitable for trimming leafy shrubs and new hedge shoot growth',
    ],
    suggestedUseCase: 'Shaping cedar and boxwood hedges, trimming garden shrubs, and leveling boundary foliage.',
    imagePath: 'demo/items/hedge-trimmer.jpg',
    imageAlt: 'Gardener trimming leafy evergreen bushes with a cordless electric hedge trimmer',
    isDemo: true,
  },
  {
    id: 'demo-electric-lawn-mower',
    title: 'Push Lawn Mower',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'Reliable walk-behind push lawn mower featuring steel cutting deck, adjustable wheel height settings, folding push handle, and rotary blade for residential turf maintenance.',
    specifications: [
      'Deck: Durable steel cutting deck with side discharge and grass collection chute',
      'Height Adjustment: Multi-position single-lever wheel height adjusters',
      'Handle: Ergonomic padded push handlebar that folds for compact storage',
      'Blades: High-lift rotary steel blade for uniform lawn grass cutting',
    ],
    suggestedUseCase: 'Weekly mowing of suburban front and back yards, lawn maintenance, and turf trimming.',
    imagePath: 'demo/items/electric-lawn-mower.jpg',
    imageAlt: 'Push lawn mower being inspected and maintained on a green residential lawn',
    isDemo: true,
  },
  {
    id: 'demo-cordless-leaf-blower',
    title: 'Cordless Leaf Blower',
    category: CATEGORIES.GARDENING.id,
    categoryLabel: CATEGORIES.GARDENING.label,
    description: 'High-velocity cordless leaf blower with tapered concentrator nozzle, variable airflow trigger, and lightweight balanced tube designed to quickly clear paths and yards.',
    specifications: [
      'Airflow: High-speed axial blower fan with directional concentrator nozzle',
      'Controls: Variable-speed trigger with cruise control lock for steady sweeping',
      'Portability: Balanced handheld body with ergonomic grip to reduce arm fatigue',
      'Power: Rechargeable lithium-ion battery system for quiet cordless operation',
    ],
    suggestedUseCase: 'Clearing autumn leaves from lawns, blowing debris off driveways, and cleaning patio decks.',
    imagePath: 'demo/items/cordless-leaf-blower.jpg',
    imageAlt: 'Operator using a portable leaf blower to sweep fallen leaves and debris along a paved path',
    isDemo: true,
  },

  // =========================================================================
  // HOUSEHOLD (4 ITEMS)
  // =========================================================================
  {
    id: 'demo-sewing-machine',
    title: 'Household Sewing & Mending Machine',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Feature-rich electric household sewing and mending machine with multiple stitch patterns, needle threader, free arm for sleeves, and foot controller pedal.',
    specifications: [
      'Stitch Selection: Multiple utility, stretch, and decorative stitch selections',
      'Thread Handling: Top drop-in bobbin system with transparent inspection cover',
      'Controls: Foot pedal speed controller and reverse reinforcement stitch lever',
      'Accessories: Standard presser foot, needle set, and comprehensive operator manual',
    ],
    suggestedUseCase: 'Hemming curtains and trousers, repairing torn garment seams, and crafting fabric projects.',
    imagePath: 'demo/items/sewing-machine.jpg',
    imageAlt: 'White domestic sewing machine on a worktable next to an open instruction manual',
    isDemo: true,
  },
  {
    id: 'demo-carpet-steam-cleaner',
    title: 'Portable Carpet & Upholstery Spot Cleaner',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Targeted upholstery and spot cleaning vacuum featuring flexible suction hose, narrow scrubbing nozzle, and dual-tank system for targeted stain extraction on fabric furniture.',
    specifications: [
      'Suction: Concentrated spot extraction suction through narrow utility nozzle',
      'Reach: Flexible suction hose designed for deep cleaning cushions and vehicle seats',
      'Design: Compact portable appliance body for easy transport up stairs and into cars',
      'Tanks: Dual clean-solution and dirty-water containment compartments',
    ],
    suggestedUseCase: 'Removing spills from armchairs and sofas, cleaning car floor mats, and treating pet stains.',
    imagePath: 'demo/items/carpet-steam-cleaner.jpg',
    imageAlt: 'Vacuum spot cleaning nozzle being drawn across an upholstered fabric armchair cushion',
    isDemo: true,
  },
  {
    id: 'demo-garment-steamer',
    title: 'Handheld Garment Steamer',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Portable handheld fabric and garment steamer with quick-heat steam plate, transparent water reservoir, and ergonomic grip for smoothing hanging clothes and drapes.',
    specifications: [
      'Heating: Rapid-heat steam boiler providing continuous vertical steam flow',
      'Water Tank: Detachable clear water reservoir with spill-resistant seal',
      'Plate: Wide stainless-steel steam soleplate for smooth fabric contact',
      'Safety: Automatic shutoff sensor and heat-resistant lightweight casing',
    ],
    suggestedUseCase: 'Removing wrinkles from hanging dress shirts, freshening curtains, and smoothing delicate fabrics.',
    imagePath: 'demo/items/garment-steamer.jpg',
    imageAlt: 'Person holding a white handheld garment steamer smoothing clothes hanging on a wooden rack',
    isDemo: true,
  },
  {
    id: 'demo-air-purifier',
    title: 'Portable Tower Air Purifier',
    category: CATEGORIES.HOUSEHOLD.id,
    categoryLabel: CATEGORIES.HOUSEHOLD.label,
    description: 'Modern cylindrical tower air purifier with multi-stage HEPA particulate filter, honeycomb air intake grille, digital status display, and quiet fan speed settings.',
    specifications: [
      'Filtration: Cylindrical 360-degree high-efficiency HEPA particulate and carbon filter',
      'Airflow: Tower design with dual directional air amplifier loop and intake perforations',
      'Controls: Digital status display with multiple fan speeds and night mode',
      'Coverage: Sized for master bedrooms, home offices, and living rooms',
    ],
    suggestedUseCase: 'Filtering wildfire smoke, reducing seasonal pollen and dust, and purifying indoor room air.',
    imagePath: 'demo/items/air-purifier.jpg',
    imageAlt: 'Bladeless tower air purifier appliance with exposed cylindrical honeycomb filter on a workbench',
    isDemo: true,
  },

  // =========================================================================
  // OUTDOOR (4 ITEMS)
  // =========================================================================
  {
    id: 'demo-camping-tent',
    title: 'Family Cabin Camping Tent',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'Spacious family camping tent featuring weatherproof coated fabric, full-coverage rainfly, bathtub floor, mesh ventilation windows, and sturdy shock-corded pole framework.',
    specifications: [
      'Capacity: Multi-person family footprint accommodating sleeping pads and gear',
      'Weather Protection: Coated water-resistant canopy with taped seam rainfly',
      'Ventilation: Large mesh roof panels and zippered doors for cross-ventilation',
      'Accessories: Ground stakes, guyline cords, and zippered carry duffel bag',
    ],
    suggestedUseCase: 'Weekend campground getaways, family summer park camping trips, and outdoor festivals.',
    imagePath: 'demo/items/camping-tent.jpg',
    imageAlt: 'Pitched camping tent on a mountain summit campsite at sunrise with mountain views',
    isDemo: true,
  },
  {
    id: 'demo-portable-camp-stove',
    title: 'Portable Camping Gas Stove',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'Compact single-burner outdoor camping gas stove featuring piezo ignition dial, porcelain-coated drip pan, safety gas canister locking lever, and integrated wind baffle.',
    specifications: [
      'Burner: Efficient concentric gas burner producing focused cooking heat',
      'Ignition: Matchless piezoelectric push-and-turn ignition knob',
      'Safety: Automatic gas shutoff safety mechanism for canister overpressure',
      'Case: Lightweight portable design suitable for picnic tables and tailgates',
    ],
    suggestedUseCase: 'Cooking hot camp meals, boiling water for coffee, tailgate cooking, and emergency storm prep.',
    imagePath: 'demo/items/portable-camp-stove.jpg',
    imageAlt: 'Portable camping gas stove with blue flame cooking a pot of food on an outdoor winter campsite',
    isDemo: true,
  },
  {
    id: 'demo-folding-camping-chairs',
    title: 'Folding Portable Camping Chairs (Set)',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'Set of portable folding outdoor armchairs constructed with powder-coated steel scissor frames, durable polyester fabric, mesh cup holders, and shoulder carry bags.',
    specifications: [
      'Frame: Folding tubular steel cross-braced frame supporting standard adult seating',
      'Fabric: Heavy-duty weather-resistant Oxford polyester fabric with reinforced seams',
      'Comfort: Padded armrests with integrated mesh drink holder cup pockets',
      'Packability: Folds down compactly into drawstring travel pouches with straps',
    ],
    suggestedUseCase: 'Campfire gatherings, beach outings, outdoor concerts, and sideline sports viewing.',
    imagePath: 'demo/items/folding-camping-chairs.jpg',
    imageAlt: 'Red and green folding camping armchairs set up near a tent at a woodland campsite',
    isDemo: true,
  },
  {
    id: 'demo-portable-camping-table',
    title: 'Portable Folding Camping Table',
    category: CATEGORIES.OUTDOOR.id,
    categoryLabel: CATEGORIES.OUTDOOR.label,
    description: 'Lightweight folding outdoor table with slatted roll-up tabletop, cross-leg folding aluminum support frame, and non-skid rubber feet for outdoor dining and meal preparation.',
    specifications: [
      'Tabletop: Roll-up slatted surface that wipes clean easily after outdoor dining',
      'Base: Cross-leg scissor folding aluminum framework for rapid setup',
      'Stability: Reinforced hinge points and rubberized anti-slip ground feet',
      'Transport: Disassembles into compact roll format inside carrying case',
    ],
    suggestedUseCase: 'Camp kitchen prep station, picnic dining table, tailgate food display, and campsite board games.',
    imagePath: 'demo/items/portable-camping-table.jpg',
    imageAlt: 'Wooden slatted folding camping table set up outdoors with a freshly prepared camp meal',
    isDemo: true,
  },

  // =========================================================================
  // ELECTRONICS (3 ITEMS)
  // =========================================================================
  {
    id: 'demo-portable-projector',
    title: 'Portable HD Movie Projector',
    category: CATEGORIES.ELECTRONICS.id,
    categoryLabel: CATEGORIES.ELECTRONICS.label,
    description: 'Compact portable HD video projector featuring optical focus lens, adjustable gimbal swivel tilt stand, integrated speaker grille, and flexible input connectivity for big-screen viewing.',
    specifications: [
      'Optics: Optical projection lens with manual focus ring and keystone correction',
      'Audio: Built-in speaker with acoustic ventilation grille for self-contained sound',
      'Mount: Integrated 360-degree swivel gimbal stand for table or ceiling projection',
      'Inputs: HDMI, USB-A, and wireless screen casting support for media playback',
    ],
    suggestedUseCase: 'Backyard summer outdoor movie nights, living room presentations, and big-screen gaming.',
    imagePath: 'demo/items/portable-projector.jpg',
    imageAlt: 'Compact white portable video projector on a gimbal swivel base with carry strap and lens',
    isDemo: true,
  },
  {
    id: 'demo-portable-bluetooth-speaker',
    title: 'Portable Wireless Bluetooth Speaker',
    category: CATEGORIES.ELECTRONICS.id,
    categoryLabel: CATEGORIES.ELECTRONICS.label,
    description: 'Durable portable wireless speaker featuring twin acoustic drivers, passive bass radiator, tactile top-mounted playback buttons, and rechargeable battery for all-day sound.',
    specifications: [
      'Connectivity: Wireless Bluetooth pairing with smartphones, tablets, and laptops',
      'Acoustics: Stereo full-range drivers with passive radiator for balanced sound',
      'Battery: Built-in lithium-ion rechargeable battery with micro-USB / USB-C charging',
      'Controls: Top-panel tactile controls for volume, track skip, and power/pairing',
    ],
    suggestedUseCase: 'Playing music during backyard barbecues, workshop audio, park picnics, and camping trips.',
    imagePath: 'demo/items/portable-bluetooth-speaker.jpg',
    imageAlt: 'Black portable wireless Bluetooth speaker resting on a table beside a smartphone',
    isDemo: true,
  },
  {
    id: 'demo-portable-power-station',
    title: 'Portable Battery Power Station',
    category: CATEGORIES.ELECTRONICS.id,
    categoryLabel: CATEGORIES.ELECTRONICS.label,
    description: 'High-capacity portable battery power station equipped with digital LCD battery percentage display, AC wall outlet sockets, USB-A and USB-C fast-charge ports, and top carry handle.',
    specifications: [
      'Outputs: Pure sine wave AC outlet sockets, high-speed USB-C, and USB-A ports',
      'Display: Digital LCD screen displaying charge percentage and power output wattage',
      'Safety: Battery management system protecting against overcurrent and short circuits',
      'Portability: Compact cabinet with integrated rigid handle for easy transport',
    ],
    suggestedUseCase: 'Charging laptops and phones during camping, running portable lights, and emergency backup power.',
    imagePath: 'demo/items/portable-power-station.jpg',
    imageAlt: 'Portable battery power station on a desk with digital display showing 100 percent battery',
    isDemo: true,
  },
]);
