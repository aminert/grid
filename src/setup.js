/**
 * Setup - Test Data and Formula Definitions
 *
 * This is what AI would generate based on user questions.
 * For the POC, it's hardcoded to demonstrate the architecture.
 */

import { Grid } from './grid/engine.js';

/**
 * Generate realistic sales test data
 */
function generateTestData() {
  const regions = ['West', 'East', 'North', 'South'];
  const products = ['Widget', 'Gadget', 'Doohickey'];

  const data = [['date', 'region', 'product', 'amount']];

  // Generate 100 sales records for Oct-Dec 2024
  for (let i = 0; i < 100; i++) {
    const date = new Date(2024, 9 + Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 28));
    const region = regions[Math.floor(Math.random() * regions.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const amount = Math.floor(50 + Math.random() * 450);

    data.push([
      date.toISOString().split('T')[0], // YYYY-MM-DD
      region,
      product,
      amount,
    ]);
  }

  return data;
}

/**
 * Initialize the Grid with data and formulas
 */
export function initializeGrid() {
  // Check if already initialized (handles React StrictMode double-render)
  if (Grid.isInitialized()) {
    console.log('⚡ Grid already initialized, skipping...');
    return;
  }

  console.log('🚀 Initializing Grid POC...');

  // 1. Load test sales data
  const salesData = generateTestData();
  Grid.loadData('sales', salesData);

  // 2. Define input cells (user-controlled values)
  Grid.defineNamedCell('selectedRegion', 'All');

  // 3. Define computed ranges and values
  // These are the formulas AI would generate

  // List of unique regions (for dropdown)
  Grid.defineNamedCell('regionList', '=ARRAYFORMULA({"All";"West";"East";"North";"South"})');

  // Filtered sales based on selected region
  // Note: HyperFormula syntax - we'll use simple approach
  Grid.defineNamedCell(
    'filteredSalesCount',
    '=COUNTIFS(sales[region],selectedRegion)'
  );

  // Since HyperFormula doesn't support complex FILTER easily, we'll use simpler metrics
  // that work with SUMIF, AVERAGEIF, COUNTIF

  // Total revenue (with conditional logic)
  Grid.defineNamedCell(
    'totalRevenue',
    '=IF(selectedRegion="All",SUM(sales[amount]),SUMIF(sales[region],selectedRegion,sales[amount]))'
  );

  // Average sale
  Grid.defineNamedCell(
    'avgSale',
    '=IF(selectedRegion="All",AVERAGE(sales[amount]),AVERAGEIF(sales[region],selectedRegion,sales[amount]))'
  );

  // Sale count
  Grid.defineNamedCell(
    'saleCount',
    '=IF(selectedRegion="All",COUNTA(sales[amount]),COUNTIF(sales[region],selectedRegion))'
  );

  // For charts and tables, we'll compute aggregates
  // Since HyperFormula has limitations with dynamic arrays, we'll pre-compute these

  // Sales by product - we'll compute for each product
  Grid.defineNamedCell(
    'widgetSales',
    '=IF(selectedRegion="All",SUMIFS(sales[amount],sales[product],"Widget"),SUMIFS(sales[amount],sales[product],"Widget",sales[region],selectedRegion))'
  );

  Grid.defineNamedCell(
    'gadgetSales',
    '=IF(selectedRegion="All",SUMIFS(sales[amount],sales[product],"Gadget"),SUMIFS(sales[amount],sales[product],"Gadget",sales[region],selectedRegion))'
  );

  Grid.defineNamedCell(
    'doohickeySales',
    '=IF(selectedRegion="All",SUMIFS(sales[amount],sales[product],"Doohickey"),SUMIFS(sales[amount],sales[product],"Doohickey",sales[region],selectedRegion))'
  );

  // Combine into chart data array
  Grid.defineNamedCell(
    'salesByProduct',
    '=ARRAYFORMULA({{"Widget",widgetSales};{"Gadget",gadgetSales};{"Doohickey",doohickeySales}})'
  );

  // For the table, we'll show a filtered subset
  // Since dynamic filtering is complex, we'll create a static view that updates based on metrics
  // In a real implementation, AI would generate more sophisticated formulas or use a different approach

  // Create a simple recent sales table (showing all for now - filtering is handled by components)
  // We'll pass the table reference directly to components
  Grid.defineNamedCell('recentSales', 'sales');

  // Mark as initialized
  Grid.markInitialized();

  const namedCellsCount = Object.keys(Grid.getAllNamedCells()).length;
  console.log('✅ Grid initialized successfully!');
  console.log('📊 Loaded', salesData.length - 1, 'sales records');
  console.log('🔧 Defined', namedCellsCount, 'named cells/ranges');
}
