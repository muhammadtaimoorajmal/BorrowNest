#!/usr/bin/env node

/**
 * Automated CSS Token Integrity Checker (BorrowNest Module 07)
 *
 * Scans all CSS files in src/, collects custom-property definitions,
 * collects custom-property references (var(--...)), and reports
 * any unresolved application tokens. Exits with code 1 if unresolved
 * tokens are found.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function findCssFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      findCssFiles(filePath, fileList);
    } else if (file.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export function validateTokens(srcDir = 'src') {
  const cssFiles = findCssFiles(srcDir);
  const globalDefinitions = new Set();
  const fileLocalDefinitions = new Map();
  const referencesByFile = new Map();

  const defPattern = /(--[a-zA-Z0-9_-]+)\s*:/g;
  const varPattern = /var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\)/g;

  for (const filePath of cssFiles) {
    const rawContent = readFileSync(filePath, 'utf-8');
    // Strip comments
    const content = rawContent.replace(/\/\*[\s\S]*?\*\//g, '');

    const localDefs = new Set();

    // Check definitions
    let defMatch;
    while ((defMatch = defPattern.exec(content)) !== null) {
      const prop = defMatch[1];
      localDefs.add(prop);
      if (filePath.endsWith('tokens.css') || filePath.endsWith('global.css') || content.includes(':root')) {
        globalDefinitions.add(prop);
      }
    }
    fileLocalDefinitions.set(filePath, localDefs);

    // Check references
    const refs = [];
    let varMatch;
    while ((varMatch = varPattern.exec(content)) !== null) {
      refs.push({
        variable: varMatch[1],
        fallback: varMatch[2] ? varMatch[2].trim() : null,
      });
    }
    referencesByFile.set(filePath, refs);
  }

  const unresolved = [];

  for (const [filePath, refs] of referencesByFile.entries()) {
    const localDefs = fileLocalDefinitions.get(filePath) || new Set();

    for (const ref of refs) {
      const prop = ref.variable;

      // Only check application namespace tokens (--bn-*), or flag missing tokens without fallback
      const isKnown = globalDefinitions.has(prop) || localDefs.has(prop);

      if (!isKnown) {
        unresolved.push({
          file: relative(process.cwd(), filePath),
          variable: prop,
          fallback: ref.fallback,
        });
      }
    }
  }

  return {
    scannedFilesCount: cssFiles.length,
    definedTokensCount: globalDefinitions.size,
    unresolved,
    success: unresolved.length === 0,
  };
}

// If run directly as CLI script
if (process.argv[1] && process.argv[1].endsWith('validate-tokens.mjs')) {
  console.log('Running BorrowNest CSS Token Integrity Check...');
  const result = validateTokens();

  console.log(`Scanned ${result.scannedFilesCount} CSS files.`);
  console.log(`Collected ${result.definedTokensCount} globally defined custom properties.`);

  if (!result.success) {
    console.error(`\n❌ Found ${result.unresolved.length} unresolved custom property references:\n`);
    for (const item of result.unresolved) {
      console.error(`  - ${item.file}: unresolved "${item.variable}" (fallback: ${item.fallback || 'none'})`);
    }
    process.exit(1);
  } else {
    console.log('\n✅ All CSS custom properties resolved successfully. Zero missing design tokens.\n');
    process.exit(0);
  }
}
