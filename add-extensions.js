import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, 'resources/js');
let filesChanged = 0;
let totalReplacements = 0;

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

function addExtensionsToImports(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let replacements = 0;

        // Pattern 1: @/components/ui/[name] without extension → add .jsx
        const uiPattern = /from\s+(['"])@\/components\/ui\/([a-z-]+)\1/g;
        const uiMatches = content.match(uiPattern);
        if (uiMatches) {
            content = content.replace(uiPattern, 'from $1@/components/ui/$2.jsx$1');
            replacements += uiMatches.length;
        }

        // Pattern 2: @/Components/[PascalCase] without extension → add .jsx
        const componentPattern = /from\s+(['"])@\/Components\/([A-Z][a-zA-Z]+)\1/g;
        const componentMatches = content.match(componentPattern);
        if (componentMatches) {
            content = content.replace(componentPattern, 'from $1@/Components/$2.jsx$1');
            replacements += componentMatches.length;
        }

        // Pattern 3: @/Components/[kebab-case] without extension → add .jsx
        const kebabPattern = /from\s+(['"])@\/Components\/([a-z][a-z-]+)\1/g;
        const kebabMatches = content.match(kebabPattern);
        if (kebabMatches) {
            content = content.replace(kebabPattern, 'from $1@/Components/$2.jsx$1');
            replacements += kebabMatches.length;
        }

        // Pattern 4: @/Layouts/[name] without extension → add .jsx
        const layoutPattern = /from\s+(['"])@\/Layouts\/([A-Za-z]+)\1/g;
        const layoutMatches = content.match(layoutPattern);
        if (layoutMatches) {
            content = content.replace(layoutPattern, 'from $1@/Layouts/$2.jsx$1');
            replacements += layoutMatches.length;
        }

        // Pattern 5: @/Utils/[name] without extension → add .jsx or .js
        const utilPattern = /from\s+(['"])@\/Utils\/([A-Za-z]+)\1/g;
        const utilMatches = content.match(utilPattern);
        if (utilMatches) {
            content = content.replace(utilPattern, 'from $1@/Utils/$2.jsx$1');
            replacements += utilMatches.length;
        }

        // Pattern 6: Relative imports ./[name] or ../[name] without extension
        const relativePattern = /from\s+(['"])(\.\.?\/[^'"]+?)(?<!\.jsx)(?<!\.js)\1/g;
        const relativeMatches = content.match(relativePattern);
        if (relativeMatches) {
            // Only add .jsx if it doesn't already have an extension
            content = content.replace(relativePattern, (match, quote, importPath) => {
                // Skip if already has extension or is a directory import
                if (importPath.includes('.') || importPath.endsWith('/')) {
                    return match;
                }
                return `from ${quote}${importPath}.jsx${quote}`;
            });
            replacements += relativeMatches.length;
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            return replacements;
        }

        return 0;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return 0;
    }
}

console.log('=== ADDING FILE EXTENSIONS TO IMPORTS ===\n');

const files = getAllFiles(rootDir);
console.log(`Processing ${files.length} files...\n`);

files.forEach(file => {
    const replacements = addExtensionsToImports(file);
    if (replacements > 0) {
        filesChanged++;
        totalReplacements += replacements;
        console.log(`✓ ${file}`);
        console.log(`  └─ ${replacements} import(s) fixed`);
    }
});

console.log('\n=== COMPLETED ===');
console.log(`Files changed: ${filesChanged}`);
console.log(`Total imports fixed: ${totalReplacements}`);
console.log('\nNote: All imports now have explicit .jsx extensions for Linux compatibility');
