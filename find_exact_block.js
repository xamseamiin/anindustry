// find_exact_block.js
const fs = require('fs');
const babel = require('@babel/parser');

const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');
const lines = content.split('\n');

for (let len = 1100; len < lines.length; len += 50) {
    const sub = lines.slice(0, len).join('\n') + '\n</div></div>); }';
    try {
        babel.parse(sub, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    } catch (err) {
        console.log(`Failed at approx line ${len}: ${err.message}`);
        break;
    }
}
