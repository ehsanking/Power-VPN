const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'route.ts') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('force-dynamic')) {
                const parts = content.split('\n');
                let insertAt = 0;
                while (insertAt < parts.length && (parts[insertAt].startsWith('import ') || parts[insertAt].trim() === '')) {
                    insertAt++;
                }
                parts.splice(insertAt, 0, "export const dynamic = 'force-dynamic';\n");
                fs.writeFileSync(fullPath, parts.join('\n'));
            }
        }
    }
}
processDir(path.join(__dirname, 'app', 'api'));
