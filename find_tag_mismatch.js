// find_tag_mismatch.js
const fs = require('fs');

const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');
const lines = content.split('\n');

let fragmentCount = 0;
let parenCount = 0;

for (let i = 1088; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const fragOpen = (line.match(/<>/g) || []).length;
    const fragClose = (line.match(/<\/>/g) || []).length;
    fragmentCount += (fragOpen - fragClose);

    if (fragOpen > 0 || fragClose > 0) {
        console.log(`Line ${lineNum}: fragCount=${fragmentCount} | ${line.trim()}`);
    }
}
console.log(`Final fragCount: ${fragmentCount}`);
