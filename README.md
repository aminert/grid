# Grid POC - Spreadsheet-Backed React Apps

## The Breakthrough

**Problem:** AI data tools (Julius, ChatGPT Data Analyst) fail because users can't verify AI-generated Python/SQL code.

**Solution:** Use spreadsheet formulas as the execution layer. Everyone can read formulas. Everyone can verify logic.

## The Architecture

```
User Question (natural language)
    ↓
AI generates formulas + React components
    ↓
HyperFormula (spreadsheet engine)
    ↓
React hooks (useCell, useRange)
    ↓
Components render (reading from spreadsheet)
    ↓
User interacts (changes dropdown)
    ↓
Cell updates → formulas recalc → UI updates
```

**No Python. No SQL. No JavaScript callbacks.**

**Just: formulas + declarative bindings + reactive UI.**

## What This POC Proves

1. ✅ **Reactive loop works** - Change dropdown → formulas recalc → UI updates
2. ✅ **Verifiable** - All logic is visible in formulas (debug panel)
3. ✅ **Declarative** - No callbacks in user code
4. ✅ **Practical** - Real dashboard with metrics, charts, tables

## Running the POC

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:5173
```

## Try It

1. Dashboard loads showing "All" regions
2. Change dropdown to "West"
3. Watch everything update instantly:
   - Metrics recalculate
   - Chart filters to West products
   - Table shows West sales only
4. Open debug panel to see formulas and values

## Project Structure

```
src/
  grid/
    engine.js       - Spreadsheet wrapper + reactivity
    hooks.js        - React hooks (useCell, useRange)
    components.jsx  - Grid components (Dropdown, Metric, etc.)
  setup.js         - Test data + formulas (what AI generates)
  App.jsx          - Dashboard (what AI generates)
  index.jsx        - Entry point
```

## Key Files

### `engine.js` - The Reactive Spreadsheet Engine

- Wraps HyperFormula for formula evaluation
- Implements named cells/ranges
- Handles subscriptions for React integration
- Tracks dependencies and recalculates on changes

### `hooks.js` - React Integration

- `useCell(name)` - Read cell value, subscribe to changes
- `useRange(name)` - Read array/table, subscribe to changes
- `setCell(name, value)` - Update cell value

### `components.jsx` - Declarative UI Components

All components are declarative - they handle their own subscriptions and updates:

- `<Dropdown options="regionList" bindTo="selectedRegion" />`
- `<Metric title="Revenue" value="totalRevenue" format="currency" />`
- `<BarChart data="salesByProduct" />`
- `<DebugPanel />` - Shows all formulas and values

### `setup.js` - What AI Would Generate

This file contains:
- Test data generation (100 sales records)
- Formula definitions (e.g., `=SUM(filteredSales[amount])`)
- Named cell setup

In production, AI would generate this based on user questions.

### `App.jsx` - The Dashboard

Pure declarative code. No state. No callbacks. Just components reading from the spreadsheet.

## Why This Matters

**Spreadsheet operations are the universal verification layer:**

- ✅ Visual (see everything at once)
- ✅ Tangible (cells you can click)
- ✅ Compositional (formulas reference other cells)
- ✅ Reactive (change one cell, cascade updates)
- ✅ Exploratory (try things, no commitment)
- ✅ Self-documenting (formula shows the logic)

**This is NOT "dumbing down" - it's choosing the right abstraction.**

70+ years and spreadsheets remain dominant because they work.

## What's Next

1. **Formula Generation** - Build AI that generates formulas from natural language
2. **Component Generation** - Generate React component trees from user intent
3. **Advanced Formulas** - Support more complex operations (FILTER, GROUPBY, etc.)
4. **Editing** - Let users edit formulas directly in the UI
5. **Persistence** - Save/load spreadsheets
6. **Collaboration** - Multi-user editing

## The Vision

**Grid = Lovable + Verifiability**

- **Lovable** works because UI is visually verifiable
- **Grid** works because data logic is verifiable (via formulas)

We're not building "AI for spreadsheets" (Gemini/Copilot).

We're building **"AI that USES spreadsheets as the execution layer for data apps."**

---

Built with ❤️ using React + HyperFormula
