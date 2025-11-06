/**
 * Grid Engine - Spreadsheet-backed reactive data layer
 *
 * This wraps HyperFormula and adds:
 * - Named cells and ranges (e.g., "totalRevenue", "salesData")
 * - Table-style column access (e.g., sales[region])
 * - React-friendly subscriptions for reactivity
 * - Automatic dependency tracking and recalculation
 */

import { HyperFormula } from 'hyperformula';

class GridEngine {
  constructor() {
    this.initialized = false;
    this._initialize();
  }

  _initialize() {
    // Initialize HyperFormula with configuration
    this.hf = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3',
      useColumnIndex: true,
    });

    // Main sheet for data and formulas
    const sheetName = this.hf.addSheet('main');
    this.sheetId = this.hf.getSheetId(sheetName);
    this.sheetName = sheetName;

    // Named cells/ranges: name -> { type, address, formula, value }
    this.namedCells = new Map();

    // Tables: tableName -> { sheetId, startRow, endRow, columns }
    this.tables = new Map();

    // Subscriptions: cellName -> Set of callbacks
    this.subscribers = new Map();

    // Track which named cells depend on which other named cells
    this.dependencies = new Map();
  }

  /**
   * Reset the Grid to initial state (useful for re-initialization)
   */
  reset() {
    this.initialized = false;
    this._initialize();
    console.log('Grid reset');
  }

  /**
   * Check if Grid has been set up with data
   */
  isInitialized() {
    return this.initialized && this.tables.size > 0;
  }

  /**
   * Mark Grid as initialized
   */
  markInitialized() {
    this.initialized = true;
  }

  /**
   * Load tabular data into the grid
   * @param {string} tableName - Name of the table
   * @param {Array<Array>} data - 2D array with headers in first row
   */
  loadData(tableName, data) {
    if (!data || data.length === 0) {
      throw new Error('Data cannot be empty');
    }

    const headers = data[0];

    // Add sheet and get its numeric ID
    const sheetName = this.hf.addSheet(tableName);
    const sheetId = this.hf.getSheetId(sheetName);

    // Load all data into HyperFormula
    this.hf.setSheetContent(sheetId, data);

    // Store table metadata
    this.tables.set(tableName, {
      sheetId,
      sheetName,
      startRow: 1, // Data starts at row 1 (0 is headers)
      endRow: data.length - 1,
      columns: headers,
      data: data.slice(1), // Store raw data for quick access
    });

    console.log(`Loaded table "${tableName}" with ${data.length - 1} rows and columns:`, headers);
  }

  /**
   * Define a named cell with a formula or static value
   * @param {string} name - Name of the cell (e.g., "totalRevenue")
   * @param {string|number|Array} formulaOrValue - Formula (starting with =), static value, or array
   */
  defineNamedCell(name, formulaOrValue) {
    const isFormula = typeof formulaOrValue === 'string' && formulaOrValue.startsWith('=');
    const isArray = Array.isArray(formulaOrValue);

    if (isArray) {
      // It's an array - store it directly without using HyperFormula
      this.namedCells.set(name, {
        type: 'array',
        value: formulaOrValue,
      });

      console.log(`Defined array cell "${name}":`, formulaOrValue);
    } else if (isFormula) {
      // It's a formula - parse and track dependencies
      const formula = formulaOrValue.substring(1); // Remove leading =
      const processedFormula = this._processFormula(formula);

      // Find a free cell to store this formula
      const address = this._allocateCell();

      // Set the formula in HyperFormula
      this.hf.setCellContents(address, [[`=${processedFormula}`]]);

      // Get the calculated value
      const value = this.hf.getCellValue(address);

      // Store named cell info
      this.namedCells.set(name, {
        type: 'formula',
        address,
        formula: formulaOrValue,
        processedFormula: `=${processedFormula}`,
        value,
      });

      // Extract dependencies from formula
      this._extractDependencies(name, formula);

      console.log(`Defined formula cell "${name}":`, formulaOrValue, '=', value);
    } else {
      // It's a static value
      const address = this._allocateCell();
      this.hf.setCellContents(address, [[formulaOrValue]]);

      this.namedCells.set(name, {
        type: 'value',
        address,
        value: formulaOrValue,
      });

      console.log(`Defined value cell "${name}":`, formulaOrValue);
    }
  }

  /**
   * Get the value of a named cell
   */
  getCell(name) {
    const cell = this.namedCells.get(name);
    if (!cell) {
      console.warn(`Named cell "${name}" not found`);
      return undefined;
    }

    // If it's an array type, return the stored value directly
    if (cell.type === 'array') {
      return cell.value;
    }

    // Get fresh value from HyperFormula
    const value = this.hf.getCellValue(cell.address);
    cell.value = value;

    return value;
  }

  /**
   * Set the value of a named cell
   */
  setCell(name, value) {
    const cell = this.namedCells.get(name);
    if (!cell) {
      // If cell doesn't exist, create it
      this.defineNamedCell(name, value);
      this._notifySubscribers(name);
      this._recalculateDependents(name);
      return;
    }

    // Update the cell value
    this.hf.setCellContents(cell.address, [[value]]);
    cell.value = value;
    cell.type = 'value'; // It's now a value, not a formula

    console.log(`Set cell "${name}" to:`, value);

    // Notify subscribers and recalculate dependents
    this._notifySubscribers(name);
    this._recalculateDependents(name);
  }

  /**
   * Get a range of values (for arrays, table data, etc.)
   */
  getRange(name) {
    const cell = this.namedCells.get(name);
    if (!cell) {
      console.warn(`Named range "${name}" not found`);
      return undefined;
    }

    // If it's an array type, return the stored value directly
    if (cell.type === 'array') {
      return cell.value;
    }

    const value = this.hf.getCellValue(cell.address);

    // If the value is an array (from a formula that returns an array), return it
    // Otherwise, try to get the range from HyperFormula
    if (Array.isArray(value)) {
      return value;
    }

    // Check if it's a table reference
    const table = this.tables.get(name);
    if (table) {
      return table.data;
    }

    // For single values, wrap in array
    return value;
  }

  /**
   * Subscribe to changes in a named cell
   */
  subscribe(name, callback) {
    if (!this.subscribers.has(name)) {
      this.subscribers.set(name, new Set());
    }
    this.subscribers.get(name).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(name, callback);
  }

  /**
   * Unsubscribe from changes
   */
  unsubscribe(name, callback) {
    const subs = this.subscribers.get(name);
    if (subs) {
      subs.delete(callback);
    }
  }

  /**
   * Get all named cells for debugging
   */
  getAllNamedCells() {
    const result = {};
    for (const [name, cell] of this.namedCells.entries()) {
      result[name] = {
        value: this.getCell(name),
        formula: cell.formula || null,
        type: cell.type,
      };
    }
    return result;
  }

  /**
   * Get all tables
   */
  getAllTables() {
    const result = {};
    for (const [name, table] of this.tables.entries()) {
      result[name] = {
        columns: table.columns,
        rowCount: table.data.length,
      };
    }
    return result;
  }

  // ========== INTERNAL METHODS ==========

  /**
   * Allocate a cell for storing a named value
   */
  _allocateCell() {
    const col = this.namedCells.size;
    const row = 0;
    return { sheet: this.sheetId, col, row };
  }

  /**
   * Process formula to handle custom syntax (e.g., table[column])
   */
  _processFormula(formula) {
    let processed = formula;

    // Handle table[column] references
    // Example: sales[region] -> column B of sales table
    const tableColumnRegex = /(\w+)\[(\w+)\]/g;
    processed = processed.replace(tableColumnRegex, (match, tableName, columnName) => {
      const table = this.tables.get(tableName);
      if (!table) {
        console.warn(`Table "${tableName}" not found in formula`);
        return match;
      }

      const colIndex = table.columns.indexOf(columnName);
      if (colIndex === -1) {
        console.warn(`Column "${columnName}" not found in table "${tableName}"`);
        return match;
      }

      // Convert to HyperFormula range reference
      // e.g., sales!B2:B101 (skip header row)
      const colLetter = this._numberToColumn(colIndex);
      const startRow = table.startRow + 1; // +1 because HyperFormula is 1-indexed
      const endRow = table.endRow + 1;
      return `${tableName}!${colLetter}${startRow}:${colLetter}${endRow}`;
    });

    // Handle named cell references
    for (const [name, cell] of this.namedCells.entries()) {
      // Replace standalone named cell references
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      processed = processed.replace(regex, () => {
        // Convert address to A1 notation
        return this._addressToA1(cell.address);
      });
    }

    // Handle whole table references (e.g., just "sales")
    // But NOT if they're already followed by ! (sheet reference)
    for (const [tableName, table] of this.tables.entries()) {
      // Use negative lookahead to avoid matching table names already converted to sheet references
      const regex = new RegExp(`\\b${tableName}\\b(?!!)`, 'g');
      processed = processed.replace(regex, () => {
        // Reference the entire data range (excluding headers)
        const startCol = this._numberToColumn(0);
        const endCol = this._numberToColumn(table.columns.length - 1);
        const startRow = table.startRow + 1;
        const endRow = table.endRow + 1;
        return `${tableName}!${startCol}${startRow}:${endCol}${endRow}`;
      });
    }

    return processed;
  }

  /**
   * Extract dependencies from a formula
   */
  _extractDependencies(name, formula) {
    const deps = new Set();

    // Extract named cell references
    for (const namedCell of this.namedCells.keys()) {
      const regex = new RegExp(`\\b${namedCell}\\b`);
      if (regex.test(formula)) {
        deps.add(namedCell);
      }
    }

    // Extract table references
    for (const tableName of this.tables.keys()) {
      const regex = new RegExp(`\\b${tableName}\\b`);
      if (regex.test(formula)) {
        deps.add(tableName);
      }
    }

    this.dependencies.set(name, deps);
  }

  /**
   * Recalculate all cells that depend on the changed cell
   */
  _recalculateDependents(changedName) {
    // Find all cells that depend on the changed cell
    const dependents = [];
    for (const [name, deps] of this.dependencies.entries()) {
      if (deps.has(changedName)) {
        dependents.push(name);
      }
    }

    console.log(`Recalculating ${dependents.length} cells dependent on "${changedName}":`, dependents);

    // Recalculate each dependent
    for (const name of dependents) {
      const cell = this.namedCells.get(name);
      if (cell && cell.type === 'formula') {
        // Get fresh value from HyperFormula (it auto-recalculates)
        const newValue = this.hf.getCellValue(cell.address);
        const oldValue = cell.value;
        cell.value = newValue;

        console.log(`  "${name}" updated:`, oldValue, '->', newValue);

        // Notify subscribers
        this._notifySubscribers(name);

        // Recursively recalculate cells that depend on this one
        this._recalculateDependents(name);
      }
    }
  }

  /**
   * Notify all subscribers of a cell change
   */
  _notifySubscribers(name) {
    const subs = this.subscribers.get(name);
    if (subs) {
      const value = this.getCell(name);
      subs.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in subscriber for "${name}":`, error);
        }
      });
    }
  }

  /**
   * Convert column number to letter (0 -> A, 1 -> B, etc.)
   */
  _numberToColumn(num) {
    let col = '';
    while (num >= 0) {
      col = String.fromCharCode((num % 26) + 65) + col;
      num = Math.floor(num / 26) - 1;
    }
    return col;
  }

  /**
   * Convert address object to A1 notation
   */
  _addressToA1(address) {
    const col = this._numberToColumn(address.col);
    const row = address.row + 1; // +1 because A1 notation is 1-indexed
    return `${this.sheetName}!${col}${row}`;
  }
}

// Create singleton instance
export const Grid = new GridEngine();
