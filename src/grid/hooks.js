/**
 * React Hooks for Grid Integration
 *
 * These hooks connect React components to the Grid engine,
 * automatically subscribing to changes and re-rendering when values update.
 */

import { useState, useEffect } from 'react';
import { Grid } from './engine.js';

/**
 * Hook to read a single named cell and subscribe to changes
 * @param {string} name - Name of the cell
 * @returns {any} Current value of the cell
 */
export function useCell(name) {
  const [value, setValue] = useState(() => Grid.getCell(name));

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = Grid.subscribe(name, (newValue) => {
      setValue(newValue);
    });

    // Get initial value in case it changed before subscription
    setValue(Grid.getCell(name));

    // Cleanup
    return unsubscribe;
  }, [name]);

  return value;
}

/**
 * Hook to read a named range and subscribe to changes
 * @param {string} name - Name of the range
 * @returns {Array} Current value of the range
 */
export function useRange(name) {
  const [value, setValue] = useState(() => Grid.getRange(name));

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = Grid.subscribe(name, () => {
      setValue(Grid.getRange(name));
    });

    // Get initial value in case it changed before subscription
    setValue(Grid.getRange(name));

    // Cleanup
    return unsubscribe;
  }, [name]);

  return value || [];
}

/**
 * Helper to set a cell value
 * @param {string} name - Name of the cell
 * @param {any} value - New value
 */
export function setCell(name, value) {
  Grid.setCell(name, value);
}

/**
 * Hook to get all named cells (for debugging)
 * @returns {Object} All named cells with their values and formulas
 */
export function useAllNamedCells() {
  const [cells, setCells] = useState(() => Grid.getAllNamedCells());

  useEffect(() => {
    // Update every 100ms (simple approach for debug panel)
    const interval = setInterval(() => {
      setCells(Grid.getAllNamedCells());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return cells;
}

/**
 * Hook to get all tables (for debugging)
 * @returns {Object} All tables
 */
export function useAllTables() {
  const [tables] = useState(() => Grid.getAllTables());
  return tables;
}
