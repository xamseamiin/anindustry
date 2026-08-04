// find_jsx_imbalance.js
const fs = require('fs');

const content = fs.readFileSync('app/telegram-mini-app/page.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let divStack = [];

for (let i = 1088; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Count <div (ignoring self closing)
    const opens = (line.match(/<div(\s|>)/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
    const realOpens = opens - selfCloses;

    const closes = (line.match(/<\/div>/g) || []).length;

    for (let o = 0; o < realOpens; o++) {
        depth++;
        divStack.push(lineNum);
    }
    for (let c = 0; c < closes; c++) {
        depth--;
        divStack.pop();
    }

    if (line.includes('return (') || line.includes('activeTab') || line.includes('editingExpense') || line.includes('showAccountModal') || lineNum > 2380) {
        console.log(`Line ${lineNum}: depth=${depth}, stack_len=${divStack.length}`);
    }
}

console.log(`Final depth at end: ${depth}`);
if (divStack.length > 0) {
    console.log('Unclosed <div> tags opened at lines:', divStack);
}
