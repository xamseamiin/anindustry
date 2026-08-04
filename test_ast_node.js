// test_ast_node.js
const fs = require('fs');
const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');

try {
    const ast = babel.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    });
    console.log('✅ AST parsed cleanly!');
} catch (err) {
    console.log(`❌ AST Error: ${err.message}`);
    console.log(`Location: line ${err.loc?.line}, column ${err.loc?.column}`);
}
