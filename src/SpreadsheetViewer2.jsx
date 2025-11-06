/**
 * Spreadsheet Viewer - Using Handsontable to render HyperFormula sheets
 *
 * This shows the ACTUAL spreadsheet using the official Handsontable UI
 * connected to our HyperFormula instance.
 */

import React, { useState, useEffect, useRef } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
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
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Spreadsheet View</h2>
        <p style={styles.subtitle}>
          Interactive Handsontable connected to your HyperFormula instance
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

      {/* Named Cells Summary */}
      {activeSheet === 'main' && <NamedCellsSummary />}

      {/* Handsontable instance */}
      <HandsontableSheet sheetName={activeSheet} key={activeSheet} />
    </div>
  );
}

/**
 * Named cells summary for main sheet
 */
function NamedCellsSummary() {
  const [namedCells, setNamedCells] = useState({});

  useEffect(() => {
    const updateData = () => {
      setNamedCells(Grid.getAllNamedCells());
    };

    updateData();
    const interval = setInterval(updateData, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.summary}>
      <h3 style={styles.summaryTitle}>Named Cells & Formulas</h3>
      <div style={styles.summaryGrid}>
        {Object.entries(namedCells).map(([name, info]) => (
          <div key={name} style={styles.summaryCard}>
            <div style={styles.summaryName}>{name}</div>
            <div style={styles.summaryValue}>
              {Array.isArray(info.value) ? (
                <span style={styles.arrayValue}>Array [{info.value.length}]</span>
              ) : (
                <span>{JSON.stringify(info.value)}</span>
              )}
            </div>
            {info.formula && (
              <div style={styles.summaryFormula}>
                <code>{info.formula}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Handsontable component for a specific sheet
 */
function HandsontableSheet({ sheetName }) {
  const containerRef = useRef(null);
  const hotRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get sheet data from HyperFormula
    const sheetId = Grid.hf.getSheetId(sheetName);
    if (sheetId === undefined) return;

    // Get sheet dimensions - use getSheetDimensions API
    const dimensions = Grid.hf.getSheetDimensions(sheetId);
    const height = dimensions.height;
    const width = dimensions.width;

    // Extract data from HyperFormula
    const data = [];
    for (let row = 0; row < height; row++) {
      const rowData = [];
      for (let col = 0; col < width; col++) {
        const value = Grid.hf.getCellValue({ sheet: sheetId, col, row });
        const serialized = Grid.hf.getCellSerialized({ sheet: sheetId, col, row });

        // If it's a formula, show the formula
        if (serialized && typeof serialized === 'string' && serialized.startsWith('=')) {
          rowData.push(serialized);
        } else {
          rowData.push(value);
        }
      }
      data.push(rowData);
    }

    // Create Handsontable instance
    hotRef.current = new Handsontable(containerRef.current, {
      data: data,
      colHeaders: true,
      rowHeaders: true,
      width: '100%',
      height: 500,
      licenseKey: 'non-commercial-and-evaluation',
      readOnly: true, // Make read-only for now
      columnSorting: false,
      manualColumnResize: true,
      manualRowResize: true,
      contextMenu: false,
      cells: function (row, col) {
        const cellProperties = {};

        // Get the actual value from HyperFormula
        const value = Grid.hf.getCellValue({ sheet: sheetId, col, row });
        const serialized = Grid.hf.getCellSerialized({ sheet: sheetId, col, row });

        // Style header rows differently
        if (row === 0 && sheetName !== 'main') {
          cellProperties.className = 'htHeaderRow';
        }

        // Style formula cells
        if (serialized && typeof serialized === 'string' && serialized.startsWith('=')) {
          cellProperties.className = 'htFormulaCell';
        }

        return cellProperties;
      },
    });

    // Cleanup on unmount
    return () => {
      if (hotRef.current) {
        hotRef.current.destroy();
        hotRef.current = null;
      }
    };
  }, [sheetName]);

  return (
    <div style={styles.sheetContainer}>
      <div style={styles.sheetHeader}>
        <h3 style={styles.sheetTitle}>{sheetName}</h3>
        <p style={styles.sheetInfo}>
          {sheetName === 'main'
            ? 'Named cells and formulas (A1, B1, C1, ... = selectedRegion, totalRevenue, avgSale, ...)'
            : 'Raw table data from HyperFormula'}
        </p>
      </div>
      <div ref={containerRef} style={styles.handsontableContainer} />
      <div style={styles.info}>
        <strong>💡 Tip:</strong> This is a live view of your HyperFormula spreadsheet.
        Change filters on the Dashboard and switch back to see values update in real-time!
      </div>
    </div>
  );
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
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
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
    borderBottom: '3px solid #3b82f6',
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  },
  summaryCard: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  summaryName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: '4px',
  },
  summaryValue: {
    fontSize: '13px',
    color: '#111827',
    marginBottom: '4px',
    fontFamily: 'monospace',
  },
  summaryFormula: {
    fontSize: '11px',
    color: '#059669',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  arrayValue: {
    color: '#7c3aed',
    fontStyle: 'italic',
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sheetHeader: {
    marginBottom: '16px',
  },
  sheetTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  sheetInfo: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  handsontableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
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
};
