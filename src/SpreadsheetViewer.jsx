/**
 * Spreadsheet Viewer - Shows the underlying HyperFormula spreadsheet
 *
 * This demonstrates the "verifiability" aspect of Grid - users can see
 * the actual spreadsheet backing their dashboard.
 */

import React, { useState, useEffect } from 'react';
import { Grid } from './grid/engine.js';

/**
 * Main spreadsheet viewer component
 */
export function SpreadsheetViewer() {
  const [activeSheet, setActiveSheet] = useState('main');
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    // Get all sheet names
    const sheetNames = Grid.hf.getSheetNames();
    setSheets(sheetNames);

    // Update every 200ms to reflect changes
    const interval = setInterval(() => {
      setSheets([...Grid.hf.getSheetNames()]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Spreadsheet View</h2>
        <p style={styles.subtitle}>
          The actual HyperFormula spreadsheet backing your dashboard
        </p>
      </div>

      {/* Sheet tabs */}
      <div style={styles.tabs}>
        {sheets.map((sheetName) => (
          <button
            key={sheetName}
            onClick={() => setActiveSheet(sheetName)}
            style={{
              ...styles.tab,
              ...(activeSheet === sheetName ? styles.tabActive : {}),
            }}
          >
            {sheetName}
          </button>
        ))}
      </div>

      {/* Sheet content */}
      {activeSheet === 'main' ? <MainSheet /> : <DataSheet sheetName={activeSheet} />}
    </div>
  );
}

/**
 * Main sheet showing named cells and formulas
 */
function MainSheet() {
  const [namedCells, setNamedCells] = useState({});
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    const updateData = () => {
      setNamedCells(Grid.getAllNamedCells());

      // Get actual spreadsheet data from HyperFormula
      const sheetId = Grid.sheetId;
      const width = Grid.namedCells.size;
      const height = 1;

      const data = [];
      for (let row = 0; row < height; row++) {
        const rowData = [];
        for (let col = 0; col < width; col++) {
          const value = Grid.hf.getCellValue({ sheet: sheetId, col, row });
          rowData.push(value);
        }
        data.push(rowData);
      }
      setSheetData(data);
    };

    updateData();
    const interval = setInterval(updateData, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.sheetContainer}>
      <h3 style={styles.sheetTitle}>Named Cells & Formulas</h3>

      <div style={styles.tableWrapper}>
        <table style={styles.spreadsheet}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Cell Name</th>
              <th style={styles.headerCell}>Type</th>
              <th style={styles.headerCell}>Value</th>
              <th style={styles.headerCell}>Formula</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(namedCells).map(([name, info]) => (
              <tr key={name}>
                <td style={styles.nameCell}>{name}</td>
                <td style={styles.cell}>
                  <span style={styles.typeBadge}>{info.type}</span>
                </td>
                <td style={styles.valueCell}>
                  {Array.isArray(info.value) ? (
                    <span style={styles.arrayValue}>
                      Array [{info.value.length}] {JSON.stringify(info.value).substring(0, 50)}...
                    </span>
                  ) : (
                    <span>{JSON.stringify(info.value)}</span>
                  )}
                </td>
                <td style={styles.formulaCell}>
                  {info.formula ? (
                    <code style={styles.formula}>{info.formula}</code>
                  ) : (
                    <span style={styles.noFormula}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.info}>
        <strong>💡 Tip:</strong> This shows all named cells stored in the spreadsheet. Formulas
        automatically recalculate when their dependencies change.
      </div>
    </div>
  );
}

/**
 * Data sheet showing table contents
 */
function DataSheet({ sheetName }) {
  const [data, setData] = useState([]);
  const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });

  useEffect(() => {
    const updateData = () => {
      const sheetId = Grid.hf.getSheetId(sheetName);
      if (sheetId === undefined) return;

      // Get sheet dimensions
      const height = Grid.hf.getSheetHeight(sheetId);
      const width = Grid.hf.getSheetWidth(sheetId);

      setDimensions({ rows: height, cols: width });

      // Get all data
      const sheetData = [];
      for (let row = 0; row < height; row++) {
        const rowData = [];
        for (let col = 0; col < width; col++) {
          const cellData = Grid.hf.getCellValue({ sheet: sheetId, col, row });
          rowData.push(cellData);
        }
        sheetData.push(rowData);
      }
      setData(sheetData);
    };

    updateData();
    const interval = setInterval(updateData, 200);
    return () => clearInterval(interval);
  }, [sheetName]);

  if (data.length === 0) {
    return <div style={styles.empty}>No data in this sheet</div>;
  }

  return (
    <div style={styles.sheetContainer}>
      <h3 style={styles.sheetTitle}>
        {sheetName} ({dimensions.rows} rows × {dimensions.cols} columns)
      </h3>

      <div style={styles.tableWrapper}>
        <table style={styles.spreadsheet}>
          <thead>
            <tr>
              <th style={styles.rowHeader}>#</th>
              {data[0] &&
                data[0].map((_, colIndex) => (
                  <th key={colIndex} style={styles.colHeader}>
                    {columnIndexToLetter(colIndex)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td style={styles.rowHeader}>{rowIndex + 1}</td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      ...styles.cell,
                      ...(rowIndex === 0 ? styles.headerRow : {}),
                    }}
                  >
                    {formatCellValue(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.info}>
        <strong>💡 Tip:</strong> This is the raw table data stored in HyperFormula. Row 1 contains
        headers, data starts at row 2.
      </div>
    </div>
  );
}

// Helper functions
function columnIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

function formatCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Styles
const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0',
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.2s',
    marginBottom: '-2px',
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sheetTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '600px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
  },
  spreadsheet: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  headerCell: {
    padding: '10px 12px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    fontWeight: '700',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  rowHeader: {
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    fontWeight: '600',
    color: '#6b7280',
    borderRight: '2px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'center',
    minWidth: '50px',
  },
  colHeader: {
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    fontWeight: '600',
    color: '#6b7280',
    borderRight: '1px solid #e5e7eb',
    borderBottom: '2px solid #e5e7eb',
    textAlign: 'center',
    minWidth: '80px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  cell: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    color: '#111827',
    whiteSpace: 'nowrap',
  },
  nameCell: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    fontWeight: '600',
    color: '#3b82f6',
  },
  valueCell: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    fontFamily: 'monospace',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  formulaCell: {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    fontFamily: 'monospace',
    maxWidth: '400px',
  },
  formula: {
    color: '#059669',
    fontSize: '12px',
  },
  noFormula: {
    color: '#9ca3af',
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  arrayValue: {
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  headerRow: {
    fontWeight: '600',
    backgroundColor: '#f9fafb',
  },
  info: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1e40af',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px',
  },
};
