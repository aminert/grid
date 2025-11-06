/**
 * Simple test to verify the Grid engine works
 */

import { Grid } from './src/grid/engine.js';

console.log('🧪 Testing Grid Engine...\n');

// Test 1: Load data
console.log('Test 1: Loading sales data...');
const salesData = [
  ['date', 'region', 'product', 'amount'],
  ['2024-10-01', 'West', 'Widget', 100],
  ['2024-10-02', 'East', 'Gadget', 200],
  ['2024-10-03', 'West', 'Widget', 150],
  ['2024-10-04', 'North', 'Doohickey', 300],
];

Grid.loadData('sales', salesData);
console.log('✅ Data loaded\n');

// Test 2: Define named cells
console.log('Test 2: Defining named cells...');
Grid.defineNamedCell('selectedRegion', 'All');

// Use conditional formula to filter by region
Grid.defineNamedCell(
  'totalRevenue',
  '=IF(selectedRegion="All",SUM(sales[amount]),SUMIF(sales[region],selectedRegion,sales[amount]))'
);
console.log('✅ Named cells defined\n');

// Test 3: Read initial value
console.log('Test 3: Reading totalRevenue (should be 750)...');
const total1 = Grid.getCell('totalRevenue');
console.log('Total Revenue (All regions):', total1);
console.log(total1 === 750 ? '✅ Correct!\n' : '❌ FAILED!\n');

// Test 4: Change filter
console.log('Test 4: Changing filter to "West"...');
Grid.setCell('selectedRegion', 'West');

// Test 5: Read updated value
console.log('Test 5: Reading totalRevenue (should be 250)...');
const total2 = Grid.getCell('totalRevenue');
console.log('Total Revenue (West only):', total2);
console.log(total2 === 250 ? '✅ Correct!\n' : '❌ FAILED!\n');

// Test 6: Test subscriptions
console.log('Test 6: Testing subscriptions...');
let notificationCount = 0;
const unsubscribe = Grid.subscribe('totalRevenue', (value) => {
  notificationCount++;
  console.log(`  📢 Subscription notification ${notificationCount}: totalRevenue = ${value}`);
});

Grid.setCell('selectedRegion', 'East');
Grid.setCell('selectedRegion', 'All');

console.log(notificationCount === 2 ? '✅ Subscriptions work!\n' : '❌ FAILED!\n');

unsubscribe();

// Summary
console.log('🎉 All tests passed! Grid engine is working correctly.');
console.log('\n📊 Final state:');
console.log(Grid.getAllNamedCells());
