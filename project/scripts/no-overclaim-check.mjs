import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TARGET_FILES = [
  'src/pages/ProofBundles.tsx',
  'src/lib/pdfGenerator.ts',
];

const BANNED_PATTERNS = [
  /\bprovable ai unlearning\b/i,
  /\btruly forget\b/i,
  /\bregulator[- ]ready\b/i,
  /\bcryptographic proof\b/i,
  /\bcourt-admissible\b/i,
  /\bfully verifiable\b/i,
  /\bcryptographically proven\b/i,
  /\bimmutable audit trail\b/i,
  /\bblockchain-verified\b/i,
  /\bmathematical certainty\b/i,
];

async function main() {
  const root = process.cwd();
  const findings = [];

  for (const relativePath of TARGET_FILES) {
    const fullPath = path.join(root, relativePath);
    const content = await readFile(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(line)) {
          findings.push({
            file: relativePath,
            line: index + 1,
            text: line.trim(),
            pattern: pattern.toString(),
          });
        }
      }
    });
  }

  if (findings.length === 0) {
    console.log('no-overclaim-check: PASS');
    return;
  }

  console.error(`no-overclaim-check: FAIL (${findings.length})`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}`);
    console.error(`  ${finding.text}`);
    console.error(`  matched ${finding.pattern}`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error('no-overclaim-check: ERROR', error);
  process.exit(1);
});
