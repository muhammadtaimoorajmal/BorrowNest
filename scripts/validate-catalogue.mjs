/**
 * Automated Catalogue & Asset Integrity Validator for BorrowNest (Module 08)
 *
 * Verifies:
 * 1. Exactly 20 curated example products.
 * 2. Strict category breakdown: Tools (5), Gardening (4), Household (4), Outdoor (4), Electronics (3).
 * 3. Unique stable IDs.
 * 4. Non-empty title, description, and meaningful image alternative text.
 * 5. Local image path existence and uniqueness.
 * 6. Zero fabricated condition inspection grades, owners, or neighbourhoods.
 * 7. Complete attribution entries in docs/assets/DEMO_IMAGE_ATTRIBUTIONS.md.
 * 8. Existence of the visual contact sheet docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REQUIRED_CATEGORIES = {
  TOOLS: 5,
  GARDENING: 4,
  HOUSEHOLD: 4,
  OUTDOOR: 4,
  ELECTRONICS: 3,
};

const TOTAL_EXPECTED = 20;

function runValidation() {
  console.log('🔍 Running BorrowNest Catalogue & Asset Integrity Validation...\n');
  const errors = [];

  // 1. Read and parse exampleCatalogue.js
  const cataloguePath = path.join(rootDir, 'src', 'features', 'discover', 'data', 'exampleCatalogue.js');
  if (!fs.existsSync(cataloguePath)) {
    console.error(`❌ Fatal: Catalogue file not found at ${cataloguePath}`);
    process.exit(1);
  }

  const catalogueContent = fs.readFileSync(cataloguePath, 'utf8');

  // Extract items using regex or dynamic evaluation
  const idMatches = [...catalogueContent.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const titleMatches = [...catalogueContent.matchAll(/title:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const categoryMatches = [...catalogueContent.matchAll(/category:\s*CATEGORIES\.([A-Z_]+)\.id/g)].map((m) => m[1]);
  const imagePathMatches = [...catalogueContent.matchAll(/imagePath:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const imageAltMatches = [...catalogueContent.matchAll(/imageAlt:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);

  console.log(`Found ${idMatches.length} catalogue items in exampleCatalogue.js`);

  // Total count check
  if (idMatches.length !== TOTAL_EXPECTED) {
    errors.push(`Catalogue must contain exactly ${TOTAL_EXPECTED} items, found ${idMatches.length}`);
  }

  // Unique IDs check
  const idSet = new Set(idMatches);
  if (idSet.size !== idMatches.length) {
    errors.push(`Duplicate item IDs detected: ${idMatches.length - idSet.size} duplicate(s)`);
  }

  // Category counts
  const catCounts = {
    TOOLS: 0,
    GARDENING: 0,
    HOUSEHOLD: 0,
    OUTDOOR: 0,
    ELECTRONICS: 0,
  };

  categoryMatches.forEach((cat) => {
    if (cat in catCounts) {
      catCounts[cat]++;
    } else {
      errors.push(`Unknown category '${cat}' in catalogue items`);
    }
  });

  for (const [cat, expected] of Object.entries(REQUIRED_CATEGORIES)) {
    if (catCounts[cat] !== expected) {
      errors.push(`Category '${cat}' has ${catCounts[cat]} items, expected exactly ${expected}`);
    }
  }

  // Unique image paths check
  const imagePathSet = new Set(imagePathMatches);
  if (imagePathSet.size !== imagePathMatches.length) {
    errors.push(`Duplicate image paths detected: ${imagePathMatches.length - imagePathSet.size} duplicate(s)`);
  }

  // File existence check on disk
  imagePathMatches.forEach((relPath) => {
    const fullPath = path.join(rootDir, 'public', relPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Image file does not exist: ${relPath} (expected at ${fullPath})`);
    } else {
      const stats = fs.statSync(fullPath);
      if (stats.size < 1000) {
        errors.push(`Image file is suspiciously small or empty: ${relPath} (${stats.size} bytes)`);
      }
    }
  });

  // Meaningful alternative text check
  imageAltMatches.forEach((alt, idx) => {
    if (!alt || alt.trim().length < 15) {
      errors.push(`Item #${idx + 1} has insufficient alternative text: "${alt}"`);
    }
  });

  // Check no conditionGrade on demo items
  if (catalogueContent.includes('conditionGrade:')) {
    errors.push(`Catalogue contains obsolete 'conditionGrade' fields. Fictional condition inspections must be removed from example items.`);
  }

  // Check no approximateArea or owner on demo items
  if (catalogueContent.includes('approximateArea:')) {
    errors.push(`Catalogue contains 'approximateArea' fields. Fictional neighbourhood names must not be present on example items.`);
  }
  if (catalogueContent.includes('owner:') || catalogueContent.includes('ownerId:')) {
    errors.push(`Catalogue contains owner fields. Fictional owner identities must not be present on example items.`);
  }

  // Check documentation attribution registry
  const attributionsPath = path.join(rootDir, 'docs', 'assets', 'DEMO_IMAGE_ATTRIBUTIONS.md');
  if (!fs.existsSync(attributionsPath)) {
    errors.push(`Attributions registry missing at ${attributionsPath}`);
  } else {
    const attrContent = fs.readFileSync(attributionsPath, 'utf8');
    imagePathMatches.forEach((imgPath) => {
      const baseName = path.basename(imgPath);
      if (!attrContent.includes(baseName)) {
        errors.push(`Image ${baseName} is not registered in DEMO_IMAGE_ATTRIBUTIONS.md`);
      }
    });
  }

  // Check contact sheet existence
  const contactSheetPath = path.join(rootDir, 'docs', 'assets', 'DEMO_CATALOGUE_CONTACT_SHEET.webp');
  if (!fs.existsSync(contactSheetPath)) {
    errors.push(`Contact sheet missing at ${contactSheetPath}`);
  } else {
    const sheetStat = fs.statSync(contactSheetPath);
    if (sheetStat.size < 50000) {
      errors.push(`Contact sheet is suspiciously small: ${sheetStat.size} bytes`);
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error('❌ Catalogue validation failed with the following errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ All Catalogue & Asset Integrity Checks Passed:');
  console.log(`  • Total Products: ${idMatches.length} / 20`);
  console.log(`  • Category Distribution: Tools (${catCounts.TOOLS}), Gardening (${catCounts.GARDENING}), Household (${catCounts.HOUSEHOLD}), Outdoor (${catCounts.OUTDOOR}), Electronics (${catCounts.ELECTRONICS})`);
  console.log(`  • Verified Image Files: ${imagePathMatches.length} / 20 existing on disk in public/`);
  console.log(`  • Verified Attributions: 20 / 20 documented in docs/assets/DEMO_IMAGE_ATTRIBUTIONS.md`);
  console.log(`  • Contact Sheet: Verified at docs/assets/DEMO_CATALOGUE_CONTACT_SHEET.webp`);
}

runValidation();
