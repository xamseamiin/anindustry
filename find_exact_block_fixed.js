// find_exact_block_fixed.js
const fs = require('fs');
const babel = require('@babel/parser');

const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 1100; i <= lines.length; i += 10) {
    // Try building a valid full file by slicing up to i, and adding whatever closing tags are needed
    const sub = lines.slice(0, i).join('\n');
    let testCode = sub;
    // append closing divs
    testCode += '\n</div></div>); }';
    try {
        babel.parse(testCode, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
        console.log(`✅ Clean up to line ${i}`);
    } catch (err) {
        console.log(`❌ Error when including up to line ${i}: ${err.message}`);
    }
}
