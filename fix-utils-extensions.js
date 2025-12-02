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

function fixUtilsExtensions(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let replacements = 0;

        // Fix @/Utils/formatDateTime.jsx → @/Utils/formatDateTime.js
        const formatDateTimePattern = /from\s+(['"])@\/Utils\/formatDateTime\.jsx\1/g;
        if (content.match(formatDateTimePattern)) {
            content = content.replace(formatDateTimePattern, 'from $1@/Utils/formatDateTime.js$1');
            replacements++;
        }

        // Fix @/Utils/formatRupiah.jsx → @/Utils/formatRupiah.js
        const formatRupiahPattern = /from\s+(['"])@\/Utils\/formatRupiah\.jsx\1/g;
        if (content.match(formatRupiahPattern)) {
            content = content.replace(formatRupiahPattern, 'from $1@/Utils/formatRupiah.js$1');
            replacements++;
        }

        // Fix @/Utils/formatDateIndo.jsx → @/Utils/formatDateIndo.js
        const formatDateIndoPattern = /from\s+(['"])@\/Utils\/formatDateIndo\.jsx\1/g;
        if (content.match(formatDateIndoPattern)) {
            content = content.replace(formatDateIndoPattern, 'from $1@/Utils/formatDateIndo.js$1');
            replacements++;
        }

        // Fix @/Utils/formatTimeIndo.jsx → @/Utils/formatTimeIndo.js
        const formatTimeIndoPattern = /from\s+(['"])@\/Utils\/formatTimeIndo\.jsx\1/g;
        if (content.match(formatTimeIndoPattern)) {
            content = content.replace(formatTimeIndoPattern, 'from $1@/Utils/formatTimeIndo.js$1');
            replacements++;
        }

        // Fix any other @/Utils/*.jsx → @/Utils/*.js (except CountDown and cartUtils which are .jsx)
        const generalUtilsPattern = /from\s+(['"])@\/Utils\/([a-zA-Z]+)\.jsx\1/g;
        const matches = content.match(generalUtilsPattern);
        if (matches) {
            matches.forEach(match => {
                // Skip CountDown.jsx and cartUtils.jsx (they are actually .jsx files)
                if (!match.includes('CountDown') && !match.includes('cartUtils') && !match.includes('lazyLoad')) {
                    const utilName = match.match(/\/Utils\/([a-zA-Z]+)\.jsx/)[1];
                    content = content.replace(
                        new RegExp(`from\\s+(['"])@/Utils/${utilName}\\.jsx\\1`, 'g'),
                        `from $1@/Utils/${utilName}.js$1`
                    );
                    replacements++;
                }
            });
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

console.log('=== FIXING UTILS EXTENSIONS (.jsx → .js) ===\n');

const files = getAllFiles(rootDir);
console.log(`Processing ${files.length} files...\n`);

files.forEach(file => {
    const replacements = fixUtilsExtensions(file);
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
console.log('\nNote: Utils imports now use .js extension (except CountDown.jsx, cartUtils.jsx, lazyLoad.jsx)');
