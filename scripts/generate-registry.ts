import * as fs from 'fs';
import * as path from 'path';

interface RegistryEntry {
  name: string;
  path: string;
  category: string;
}

interface Registry {
  components: Record<string, string>;
  pages: Record<string, string>;
  actions: Record<string, string>;
  fixtures?: Record<string, string>;
  services?: Record<string, string>;
}

function scanDirectory(dir: string, extension: string, category: string): Record<string, string> {
  const registry: Record<string, string> = {};
  
  function walkDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
        const name = entry.name.replace(extension, '');
        
        // Extract category from path (e.g., 'dashboard', 'admin', 'lims')
        const pathParts = relativePath.split('/');
        const categoryIndex = pathParts.findIndex(part => part === 'components' || part === 'pages' || part === 'actions' || part === 'fixtures' || part === 'services');
        const category = categoryIndex >= 0 && categoryIndex < pathParts.length - 1 ? pathParts[categoryIndex + 1] : '';
        
        // Create key: use category prefix if duplicate exists
        let key = name;
        if (registry[key] && registry[key] !== relativePath) {
          // Duplicate found, use category prefix
          key = category ? `${category}_${name}` : name;
          // If still duplicate, use full path segments
          if (registry[key]) {
            const pathSegments = pathParts.slice(categoryIndex + 1, -1);
            key = pathSegments.length > 0 ? `${pathSegments.join('_')}_${name}` : name;
          }
        }
        
        registry[key] = relativePath;
      }
    }
  }
  
  walkDir(dir);
  return registry;
}

function generateRegistry(): Registry {
  const registry: Registry = {
    components: {},
    pages: {},
    actions: {},
    fixtures: {},
    services: {}
  };

  // Scan components
  const componentsDir = path.join(process.cwd(), 'src/components');
  if (fs.existsSync(componentsDir)) {
    registry.components = scanDirectory(componentsDir, '.component.ts', 'component');
  }

  // Scan pages
  const pagesDir = path.join(process.cwd(), 'src/pages');
  if (fs.existsSync(pagesDir)) {
    registry.pages = scanDirectory(pagesDir, '.page.ts', 'page');
  }

  // Scan actions
  const actionsDir = path.join(process.cwd(), 'src/actions');
  if (fs.existsSync(actionsDir)) {
    registry.actions = scanDirectory(actionsDir, '.actions.ts', 'action');
  }

  // Scan fixtures
  const fixturesDir = path.join(process.cwd(), 'src/fixtures');
  if (fs.existsSync(fixturesDir)) {
    registry.fixtures = scanDirectory(fixturesDir, '.fixture.ts', 'fixture');
  }

  // Scan services
  const servicesDir = path.join(process.cwd(), 'src/services');
  if (fs.existsSync(servicesDir)) {
    registry.services = scanDirectory(servicesDir, '.service.ts', 'service');
  }

  return registry;
}

function formatRegistryAsMarkdown(registry: Registry): string {
  let markdown = '# CAF Naming Registry\n\n';
  markdown += '> **Auto-generated registry of all Components, Pages, Actions, Fixtures, and Services**\n';
  markdown += '> **Purpose**: Check this registry before generating new files to reuse existing ones or modify them instead.\n';
  markdown += `> **Last Updated**: ${new Date().toISOString()}\n\n`;
  markdown += '---\n\n';

  // Components Section
  markdown += '## Components (`src/components/`)\n\n';
  markdown += '| Name | Path |\n';
  markdown += '|------|------|\n';
  const componentEntries = Object.entries(registry.components).sort(([a], [b]) => a.localeCompare(b));
  for (const [name, filePath] of componentEntries) {
    markdown += `| \`${name}\` | \`${filePath}\` |\n`;
  }
  markdown += '\n';

  // Pages Section
  markdown += '## Pages (`src/pages/`)\n\n';
  markdown += '| Name | Path |\n';
  markdown += '|------|------|\n';
  const pageEntries = Object.entries(registry.pages).sort(([a], [b]) => a.localeCompare(b));
  for (const [name, filePath] of pageEntries) {
    markdown += `| \`${name}\` | \`${filePath}\` |\n`;
  }
  markdown += '\n';

  // Actions Section
  markdown += '## Actions (`src/actions/`)\n\n';
  markdown += '| Name | Path |\n';
  markdown += '|------|------|\n';
  const actionEntries = Object.entries(registry.actions).sort(([a], [b]) => a.localeCompare(b));
  for (const [name, filePath] of actionEntries) {
    markdown += `| \`${name}\` | \`${filePath}\` |\n`;
  }
  markdown += '\n';

  // Fixtures Section
  if (registry.fixtures && Object.keys(registry.fixtures).length > 0) {
    markdown += '## Fixtures (`src/fixtures/`)\n\n';
    markdown += '| Name | Path |\n';
    markdown += '|------|------|\n';
    const fixtureEntries = Object.entries(registry.fixtures).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, filePath] of fixtureEntries) {
      markdown += `| \`${name}\` | \`${filePath}\` |\n`;
    }
    markdown += '\n';
  }

  // Services Section
  if (registry.services && Object.keys(registry.services).length > 0) {
    markdown += '## Services (`src/services/`)\n\n';
    markdown += '| Name | Path |\n';
    markdown += '|------|------|\n';
    const serviceEntries = Object.entries(registry.services).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, filePath] of serviceEntries) {
      markdown += `| \`${name}\` | \`${filePath}\` |\n`;
    }
    markdown += '\n';
  }

  // Quick Reference
  markdown += '---\n\n';
  markdown += '## Quick Reference\n\n';
  markdown += '### How to Use This Registry\n\n';
  markdown += '1. **Before generating new files**: Search this registry for similar names\n';
  markdown += '2. **If found**: Modify the existing file instead of creating a duplicate\n';
  markdown += '3. **If not found**: Generate new file following CAF naming conventions\n';
  markdown += '4. **After generating**: Run `npm run generate-registry` to update this file\n\n';
  markdown += '### Naming Conventions\n\n';
  markdown += '- **Components**: `[Name].component.ts` (e.g., `NavigationMenu.component.ts`)\n';
  markdown += '- **Pages**: `[Name].page.ts` (e.g., `Dashboard.page.ts`)\n';
  markdown += '- **Actions**: `[Name].actions.ts` (e.g., `Login.actions.ts`)\n';
  markdown += '- **Fixtures**: `[Name].fixture.ts` (e.g., `Auth.fixture.ts`)\n';
  markdown += '- **Services**: `[Name].service.ts` (e.g., `Api.service.ts`)\n\n';

  return markdown;
}

// Main execution
const registry = generateRegistry();
const markdown = formatRegistryAsMarkdown(registry);
const outputPath = path.join(process.cwd(), '.cursor/docs/registry.md');

// Ensure directory exists before writing
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, markdown, 'utf-8');
console.log(`✅ Registry generated successfully at: ${outputPath}`);
console.log(`📊 Found ${Object.keys(registry.components).length} components, ${Object.keys(registry.pages).length} pages, ${Object.keys(registry.actions).length} actions`);
