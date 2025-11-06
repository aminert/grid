/**
 * Dashboard App - Sales Analytics
 *
 * This is what AI would generate based on the user's question.
 * It's pure declarative code - no callbacks, no state management.
 * All data and logic lives in the spreadsheet.
 */

import React, { useEffect } from 'react';
import { Dropdown, Metric, BarChart, DebugPanel } from './grid/components.jsx';
import { useCell, useRange } from './grid/hooks.js';
import { initializeGrid } from './setup.js';

/**
 * Filtered data table component
 * Reads from sales table and filters based on selectedRegion
 */
function FilteredDataTable() {
  const salesData = useRange('recentSales');
  const selectedRegion = useCell('selectedRegion');

  if (!Array.isArray(salesData) || salesData.length === 0) {
    return <div style={styles.table}>No data</div>;
  }

  // Filter the data based on selected region
  const headers = salesData[0];
  const rows = salesData.slice(1);

  const filteredRows =
    selectedRegion === 'All'
      ? rows
      : rows.filter((row) => {
          const regionIndex = headers.indexOf('region');
          return row[regionIndex] === selectedRegion;
        });

  // Sort by date (most recent first) and take top 10
  const dateIndex = headers.indexOf('date');
  const sortedRows = [...filteredRows].sort((a, b) => {
    return new Date(b[dateIndex]) - new Date(a[dateIndex]);
  });

  const recentRows = sortedRows.slice(0, 10);

  return (
    <div style={styles.tableContainer}>
      <h3 style={styles.tableTitle}>Recent Sales</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} style={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recentRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} style={styles.td}>
                  {typeof cell === 'number' && cellIdx === row.length - 1
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(cell)
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {filteredRows.length > 10 && (
        <div style={styles.tableFooter}>
          Showing 10 of {filteredRows.length} records
        </div>
      )}
    </div>
  );
}

/**
 * Main Dashboard Component
 */
function Dashboard() {
  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <h1 style={styles.title}>📊 Sales Dashboard</h1>
        <p style={styles.subtitle}>
          Powered by Grid - Spreadsheet-backed React apps
        </p>
      </header>

      {/* Filters */}
      <div style={styles.filters}>
        <Dropdown label="Region" options="regionList" bindTo="selectedRegion" />
      </div>

      {/* Metrics */}
      <div style={styles.metrics}>
        <Metric title="Total Revenue" value="totalRevenue" format="currency" />
        <Metric title="Avg Sale" value="avgSale" format="currency" />
        <Metric title="Sale Count" value="saleCount" format="number" />
      </div>

      {/* Charts */}
      <div style={styles.charts}>
        <BarChart data="salesByProduct" title="Sales by Product" />
      </div>

      {/* Table */}
      <div style={styles.tableSection}>
        <FilteredDataTable />
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}

/**
 * App Root
 */
export default function App() {
  useEffect(() => {
    // Initialize Grid on mount
    initializeGrid();
  }, []);

  return (
    <div style={styles.app}>
      <Dashboard />
    </div>
  );
}

// ========== STYLES ==========

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  dashboard: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  filters: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  charts: {
    marginBottom: '24px',
  },
  tableSection: {
    marginBottom: '24px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  tableTitle: {
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    borderBottom: '1px solid #e5e7eb',
    margin: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#111827',
  },
  tableFooter: {
    padding: '12px 20px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
};
