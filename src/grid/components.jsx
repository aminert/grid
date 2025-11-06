/**
 * Grid Components - Declarative React components backed by spreadsheet
 *
 * All components are declarative - they automatically:
 * - Read from named cells/ranges
 * - Subscribe to changes
 * - Update the grid when user interacts
 *
 * No callbacks needed in user code!
 */

import React from 'react';
import { useCell, useRange, setCell } from './hooks.js';
import { Grid } from './engine.js';

/**
 * Dropdown that binds to a named cell
 */
export function Dropdown({ label, options, bindTo }) {
  const optionList = useRange(options);
  const currentValue = useCell(bindTo);

  const handleChange = (e) => {
    setCell(bindTo, e.target.value);
  };

  return (
    <div style={styles.dropdown}>
      <label style={styles.label}>{label}</label>
      <select value={currentValue || ''} onChange={handleChange} style={styles.select}>
        {Array.isArray(optionList) &&
          optionList.map((option, idx) => (
            <option key={idx} value={option}>
              {option}
            </option>
          ))}
      </select>
    </div>
  );
}

/**
 * Metric card that displays a value from a named cell
 */
export function Metric({ title, value, format = 'number' }) {
  const cellValue = useCell(value);

  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      case 'percent':
        return `${(val * 100).toFixed(1)}%`;
      default:
        return String(val);
    }
  };

  return (
    <div style={styles.metric}>
      <div style={styles.metricTitle}>{title}</div>
      <div style={styles.metricValue}>{formatValue(cellValue)}</div>
    </div>
  );
}

/**
 * Simple bar chart
 */
export function BarChart({ data, title }) {
  const chartData = useRange(data);

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div style={styles.chart}>
        <h3 style={styles.chartTitle}>{title}</h3>
        <div>No data</div>
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...chartData.map((row) => (Array.isArray(row) ? row[1] : 0)));

  return (
    <div style={styles.chart}>
      <h3 style={styles.chartTitle}>{title}</h3>
      <div style={styles.chartBars}>
        {chartData.map((row, idx) => {
          const label = Array.isArray(row) ? row[0] : row;
          const value = Array.isArray(row) ? row[1] : 0;
          const width = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={idx} style={styles.barRow}>
              <div style={styles.barLabel}>{label}</div>
              <div style={styles.barContainer}>
                <div style={{ ...styles.bar, width: `${width}%` }}>
                  <span style={styles.barValue}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Data table
 */
export function DataTable({ data }) {
  const tableData = useRange(data);

  if (!Array.isArray(tableData) || tableData.length === 0) {
    return <div style={styles.table}>No data</div>;
  }

  // Assume first row is headers (or infer from data)
  const firstRow = tableData[0];
  const hasHeaders = Array.isArray(firstRow);

  if (!hasHeaders) {
    return <div style={styles.table}>Invalid table data</div>;
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            {firstRow.map((header, idx) => (
              <th key={idx} style={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.slice(1).map((row, rowIdx) => (
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
    </div>
  );
}

/**
 * Debug panel showing all named cells and formulas
 */
export function DebugPanel() {
  const namedCells = useCell('__debug__') || {};

  // Get all named cells directly from Grid
  const [cells, setCells] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Get all named cells directly
      setCells(Grid.getAllNamedCells());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.debug}>
      <h3 style={styles.debugTitle}>🔍 Debug Panel - Named Cells & Formulas</h3>
      <div style={styles.debugContent}>
        {Object.entries(cells).map(([name, info]) => (
          <div key={name} style={styles.debugCell}>
            <div style={styles.debugCellName}>{name}:</div>
            <div style={styles.debugCellValue}>
              {Array.isArray(info.value) ? (
                <span>
                  [Array: {info.value.length} rows]
                </span>
              ) : (
                <strong>{JSON.stringify(info.value)}</strong>
              )}
            </div>
            {info.formula && <div style={styles.debugCellFormula}>Formula: {info.formula}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}


// ========== STYLES ==========

const styles = {
  dropdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  metric: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  metricTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  },
  chart: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#111827',
  },
  chartBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barLabel: {
    minWidth: '100px',
    fontSize: '14px',
    color: '#374151',
  },
  barContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    height: '32px',
    position: 'relative',
  },
  bar: {
    backgroundColor: '#3b82f6',
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: '8px',
    minWidth: '60px',
    transition: 'width 0.3s ease',
  },
  barValue: {
    fontSize: '12px',
    color: 'white',
    fontWeight: '600',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
  debug: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontFamily: 'monospace',
  },
  debugTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#111827',
  },
  debugContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  debugCell: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  debugCellName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: '4px',
  },
  debugCellValue: {
    fontSize: '13px',
    color: '#111827',
    marginBottom: '4px',
  },
  debugCellFormula: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
};
