const fs = require('fs');
const path = require('path');

function findAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findAndReplace(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            if (content.includes('return NextResponse.json(res.data);')) {
                content = content.replace(/return NextResponse\.json\(res\.data\);/g, 'return NextResponse.json(res);');
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Reverted', fullPath);
            }
        }
    }
}

findAndReplace(path.join(__dirname, 'frontend/src/app/api'));
