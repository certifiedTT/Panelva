#!/usr/bin/env node

/**
 * Vengeance UI CLI Tool for Panelva Web
 * Allows listing, inspecting, and installing any of the 120+ animated components
 * directly from the official Vengeance UI registry (https://www.vengenceui.com).
 *
 * Usage:
 *   node scripts/vengence-ui.js list
 *   node scripts/vengence-ui.js add <component-name>
 *   node scripts/vengence-ui.js inspect <component-name>
 */

const fs = require('fs');
const path = require('path');

const REGISTRY_BASE = 'https://www.vengenceui.com/r';
const REGISTRY_INDEX = `${REGISTRY_BASE}/index.json`;
const WEB_ROOT = path.resolve(__dirname, '..');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch from ${url}: HTTP ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function listComponents() {
  console.log('⚡ Fetching Vengeance UI component registry...');
  try {
    const items = await fetchJSON(REGISTRY_INDEX);
    console.log(`\n📦 Available Vengeance UI Components (${items.length} total):\n`);
    
    // Group or display in columns
    const names = items.map((i) => i.name || i).sort();
    const colWidth = 28;
    const numCols = 3;
    for (let i = 0; i < names.length; i += numCols) {
      const row = names.slice(i, i + numCols).map((n) => n.padEnd(colWidth)).join(' ');
      console.log(`  ${row}`);
    }
    console.log('\nInstall any component with:');
    console.log('  npm run vengence add <component-name>');
    console.log('  or: npx shadcn@latest add @vengeanceui/<component-name>\n');
  } catch (err) {
    console.error('❌ Error fetching registry index:', err.message);
    process.exit(1);
  }
}

async function inspectComponent(name) {
  const cleanName = name.replace(/^@vengeanceui\//, '').replace(/\.json$/, '');
  const url = `${REGISTRY_BASE}/${cleanName}.json`;
  console.log(`🔍 Inspecting ${cleanName} from ${url}...`);

  try {
    const data = await fetchJSON(url);
    console.log(`\nName: ${data.name}`);
    console.log(`Type: ${data.type || 'registry:ui'}`);
    console.log(`Dependencies: ${(data.dependencies || []).join(', ') || 'None'}`);
    console.log(`Files:`);
    (data.files || []).forEach((f) => {
      console.log(`  - ${f.target || f.path}`);
    });
    console.log('');
  } catch (err) {
    console.error(`❌ Component "${cleanName}" not found in registry:`, err.message);
    process.exit(1);
  }
}

async function addComponent(name) {
  const cleanName = name.replace(/^@vengeanceui\//, '').replace(/\.json$/, '');
  const url = `${REGISTRY_BASE}/${cleanName}.json`;
  console.log(`⬇️ Downloading Vengeance UI component: ${cleanName}...`);

  try {
    const data = await fetchJSON(url);
    if (!data.files || data.files.length === 0) {
      console.error(`❌ No files found in component metadata for ${cleanName}`);
      process.exit(1);
    }

    // Write each file into src/components/ui/ or target
    for (const file of data.files) {
      const targetRel = file.target || file.path;
      // Resolve path within apps/web/src/
      // e.g. "components/ui/glass-dock.tsx" -> "src/components/ui/glass-dock.tsx"
      const normalizedPath = targetRel.startsWith('src/')
        ? targetRel
        : path.join('src', targetRel);
      const destPath = path.resolve(WEB_ROOT, normalizedPath);

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, file.content, 'utf8');
      console.log(`  ✅ Written: ${normalizedPath}`);
    }

    if (data.dependencies && data.dependencies.length > 0) {
      console.log(`\n📌 Component dependencies: ${data.dependencies.join(', ')}`);
    }

    console.log(`\n🎉 Successfully installed ${cleanName}!\n`);
  } catch (err) {
    console.error(`❌ Failed to install ${cleanName}:`, err.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  switch (command) {
    case 'list':
      await listComponents();
      break;
    case 'inspect':
      if (!args[1]) {
        console.error('Usage: node scripts/vengence-ui.js inspect <component-name>');
        process.exit(1);
      }
      await inspectComponent(args[1]);
      break;
    case 'add':
    case 'install':
      if (!args[1]) {
        console.error('Usage: node scripts/vengence-ui.js add <component-name>');
        process.exit(1);
      }
      await addComponent(args[1]);
      break;
    default:
      console.log(`Unknown command "${command}". Available commands: list, add, inspect`);
  }
}

main();
