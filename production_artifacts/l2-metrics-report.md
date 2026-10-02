# L2 Metrics Report (Day 7)

**Status:** Completed
**Objective:** Implement trend, anomaly, HHI, ABC, and decomposition metrics as isolated compute blocks that only run when sufficient data is available.

## 1. Statistical Functions

Implemented mathematical helpers in `modules/analytics/l2-metrics.ts`:
- **Simple Moving Average (SMA)**
- **Exponential Moving Average (EMA)**
- **Median Absolute Deviation (MAD)** for robust anomaly detection (insensitive to outliers compared to standard deviation).
- **Z-Score** to calculate normalized standard deviations from a trailing sample.
- **Ordinary Least Squares (OLS)** linear trend slope directly computed via sufficient statistics (Sigma T, Sigma Y, etc.) to evaluate trend vectors without heavy regression libraries.

## 2. Market & Concentration Metrics

- **ABC / Pareto Classification**: Added a query that sorts offerings by aggregated daily revenue over a trailing 30-day window. It segments them into `A` (top 70% of revenue), `B` (next 20%), and `C` (bottom 10%) classes. The top 50 are evaluated to prevent scanning long-tail dead stock.
- **Herfindahl-Hirschman Index (HHI)**: Computes customer revenue concentration (0 to 10,000 scale). Values above 2500 indicate high dependency on a few key customers. Again, evaluated exclusively off `analytics_daily_customer` tables rather than scanning line items.

## 3. Data Gating

All metrics respect strict eligibility rules:
- Trend, SMA, EMA, and MAD evaluate only if **>= 14 closed days** exist in the daily rollup tables.
- Z-Score requires **>= 30 days** of history to establish a statistically relevant standard deviation baseline.
- If data gates fail, the engine explicitly returns `sufficiency_status: 'insufficient_data'`.

## 4. Testing Strategy

Created `tests/l2-metrics.test.ts` as a set of "Golden Tests". The inputs (small arrays of numbers) were fixed, and their expected outputs were hand-calculated using standard mathematical formulas. Vitest executes these functions to guarantee the core statistics logic works deterministically before evaluating database state.

## 5. Next Steps

- Proceed with **Day 8: Sparse seasonality and forecast jobs** where we will begin evaluating weekly cycles and Holt projections.
