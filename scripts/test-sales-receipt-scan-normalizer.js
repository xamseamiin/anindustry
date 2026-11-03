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

const catalog = [
  { id: 'p-1l', name: '1L Bottled Water', sku: 'AN-1L', sellingPrice: 20 },
  { id: 'p-05l', name: '0.5L Bottled Water', sku: 'AN-05L', sellingPrice: 15 },
  { id: 'p-crate', name: 'Empty Crate Return', sku: 'CRATE', sellingPrice: 120 },
];

const handwrittenLikeResult = normalizeSalesReceiptAnalysis({
  customerName: 'Ahmed Waas',
  customerPhone: '0911111111',
  items: [
    { productName: '1L water', quantity: '20', unitPrice: '20', total: '400' },
    { productName: '0.5L bottle', quantity: 30, unitPrice: 15, total: 450 },
  ],
  totalAmount: 850,
  paidAmount: 500,
  paymentMethod: 'PARTIAL',
  accountName: 'E-Birr Merchant',
  receiptNumber: 'HW-102',
  date: '2026-09-05',
  confidence: 88,
}, catalog);

assert.strictEqual(handwrittenLikeResult.items.length, 2);
assert.strictEqual(handwrittenLikeResult.items[0].matchedProductId, 'p-1l');
assert.strictEqual(handwrittenLikeResult.items[1].matchedProductId, 'p-05l');
assert.strictEqual(handwrittenLikeResult.totalAmount, 850);
assert.strictEqual(handwrittenLikeResult.paidAmount, 500);
assert.strictEqual(handwrittenLikeResult.paymentMethod, 'PARTIAL');
assert.strictEqual(handwrittenLikeResult.transactionType, 'SALE');

const reviewNeededResult = normalizeSalesReceiptAnalysis({
  customerName: 'New Customer',
  items: [
    { productName: 'unknown handwritten item', quantity: 2, total: 300 },
  ],
  paidAmount: 0,
}, catalog);

assert.strictEqual(reviewNeededResult.items.length, 1);
assert.strictEqual(reviewNeededResult.items[0].matchedProductId, null);
assert.strictEqual(reviewNeededResult.paymentMethod, 'CREDIT');
assert.ok(reviewNeededResult.warnings.some((warning) => warning.includes('inventory')));

const repeatedBottleLines = normalizeSalesReceiptAnalysis({
  customerName: 'Maqmushi',
  items: [
    { productName: '1L Bottled Water', quantity: 4000, unitPrice: 20, total: 80000 },
    { productName: '0.5L Bottled Water', quantity: 500, unitPrice: 15, total: 7500 },
    { productName: '1L Bottled Water', quantity: 500, unitPrice: 20, total: 10000 },
    { productName: '1L Bottled Water', quantity: 700, unitPrice: 20, total: 14000 },
  ],
  totalAmount: 111500,
  paymentMethod: 'CASH',
  receiptNumber: '00054',
}, catalog);

assert.strictEqual(repeatedBottleLines.items.length, 2);
assert.strictEqual(repeatedBottleLines.items.find(item => item.matchedProductId === 'p-1l').quantity, 5200);
assert.strictEqual(repeatedBottleLines.items.find(item => item.matchedProductId === 'p-05l').quantity, 500);
assert.strictEqual(repeatedBottleLines.paidAmount, 111500);
assert.strictEqual(repeatedBottleLines.paymentMethod, 'CASH');

console.log('PASS sales receipt scan normalizer: product matching, repeated-line merging, cash inference, partial payment, and review warnings work.');
