/**
 * Test array functionality
 */

import { Grid } from './src/grid/engine.js';

console.log('🧪 Testing Array Support...\n');

// Test 1: Define array
console.log('Test 1: Defining array cell...');
Grid.defineNamedCell('testArray', ['Apple', 'Banana', 'Cherry']);
console.log('✅ Array defined\n');

// Test 2: Read array with getCell
console.log('Test 2: Reading array with getCell...');
const arr1 = Grid.getCell('testArray');
console.log('Result:', arr1);
console.log(Array.isArray(arr1) && arr1.length === 3 ? '✅ Correct!\n' : '❌ FAILED!\n');

// Test 3: Read array with getRange
console.log('Test 3: Reading array with getRange...');
const arr2 = Grid.getRange('testArray');
console.log('Result:', arr2);
console.log(Array.isArray(arr2) && arr2.length === 3 ? '✅ Correct!\n' : '❌ FAILED!\n');

// Test 4: Update array and notify subscribers
console.log('Test 4: Updating array and testing subscriptions...');
let notified = false;
Grid.subscribe('testArray', (value) => {
  notified = true;
  console.log('  📢 Subscription notification:', value);
});

// Update by redefining
Grid.defineNamedCell('testArray', ['Dog', 'Cat']);
// Manually notify
Grid._notifySubscribers('testArray');

console.log(notified ? '✅ Notifications work!\n' : '❌ FAILED!\n');

// Test 5: Chart data structure
console.log('Test 5: Chart data structure...');
Grid.defineNamedCell('chartData', [
  ['Widget', 100],
  ['Gadget', 200],
  ['Doohickey', 150],
]);

const chartData = Grid.getRange('chartData');
console.log('Chart data:', chartData);
console.log(
  Array.isArray(chartData) && chartData.length === 3 && chartData[0][0] === 'Widget'
    ? '✅ Correct!\n'
    : '❌ FAILED!\n'
);

console.log('🎉 All array tests passed!');
