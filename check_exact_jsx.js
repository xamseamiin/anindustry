// check_exact_jsx.js
const fs = require('fs');
const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');

const babel = require('@babel/parser');
try {
    babel.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
    console.log('✅ AST Parsing Succeeded! No syntax errors!');
} catch (err) {
    console.error('❌ AST Error:', err.message);
    if (err.loc) {
        console.error(`At line ${err.loc.line}, column ${err.loc.column}`);
    }
}
