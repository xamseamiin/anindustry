const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

const sourcePath = path.join(process.cwd(), 'lib', 'sales-receipt-ai.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;
const testModule = new Module(sourcePath, module);
testModule.filename = sourcePath;
testModule.paths = Module._nodeModulePaths(process.cwd());
testModule._compile(compiled, sourcePath);

const { normalizeSalesReceiptAnalysis } = testModule.exports;
const customers = [
  { id: 'customer-abshir', name: 'Abshir' },
  { id: 'customer-farax', name: 'Farax' },
  { id: 'customer-farah', name: 'Farah Ali' },
  { id: 'customer-farax-ali', name: 'Farax Ali' },
];

const result = normalizeSalesReceiptAnalysis({
  customerName: 'Abshir',
  items: [
    { productName: '1L Water', customerName: 'Farax', quantity: 2, unitPrice: 20, total: 40 },
  ],
  totalAmount: 40,
  paidAmount: 40,
  paymentMethod: 'CASH',
}, [{ id: 'water', name: '1L Water', sellingPrice: 20 }], customers);

assert.strictEqual(result.matchedCustomerId, 'customer-abshir');
assert.strictEqual(result.items[0].customerName, 'Farax');
assert.strictEqual(result.items[0].matchedCustomerId, 'customer-farax');
assert.strictEqual(result.requiresCustomerRegistration, false);
assert.ok(!result.warnings.some(warning => warning.includes('telefoon')));

const learnedResult = normalizeSalesReceiptAnalysis({ customerName: 'Faarax' }, [], customers, [
  { observedName: 'Faarax', correctedCustomerName: 'Farax' },
]);
assert.strictEqual(learnedResult.matchedCustomerId, 'customer-farax');

const ambiguousResult = normalizeSalesReceiptAnalysis({ customerName: 'Fara Ali' }, [], customers);
assert.strictEqual(ambiguousResult.matchedCustomerId, null);
assert.strictEqual(ambiguousResult.requiresCustomerRegistration, true);

console.log('PASS sales receipt Somali customer matching, row-level buyer matching, learned spelling aliases, and ambiguous-name review.');
