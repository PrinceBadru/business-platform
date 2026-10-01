# State-Machine Alerts Engine Report (Day 6)

**Status:** Completed
**Objective:** Implement a robust state machine for analytical anomaly detection that prevents alert fatigue (flapping).

## 1. Alerts State Machine

We introduced an anomaly evaluation engine that runs in the background worker immediately after snapshots are generated (`modules/analytics/alerts.ts`).

The state machine follows a candidate-to-active lifecycle:

1. **Discovery**: When a heuristic detects an anomaly (e.g. current day revenue is 50% below the 7-day trailing average), a `candidate` alert is generated.
2. **Maturation**: If the anomaly persists in the next evaluation period, the `consecutivePeriods` counter increments. Once `consecutivePeriods >= 2`, the alert transitions to `active`.
3. **Resolution**: If the evaluation runs and an anomaly is no longer detected, any existing `candidate` or `active` alert for that metric/comparison key is automatically transitioned to `resolved`.

This ensures the user is only notified of sustained problems, rather than single-day flukes.

## 2. Worker Integration

The `evaluateAnomalyAlerts` function was wired into `modules/analytics/worker.ts` directly after `computeL1Snapshots`. Since the worker handles its own exponential backoff and locks, the alerts engine naturally inherits the resilience and retries of the broader pipeline.

## 3. Testing & Verification

Integration tests were implemented in `tests/alerts.test.ts`. 
The test manually seeds a baseline of healthy days and simulates a massive revenue drop over 3 days:
- **Day 1 of drop**: Confirms alert is inserted as `candidate`.
- **Day 2 of drop**: Confirms alert is upgraded to `active`.
- **Day 3 (recovery)**: Confirms alert is automatically downgraded to `resolved`.

The test suite executed successfully.

## 4. Next Steps
The backend Insights Engine is now structurally complete. The data flows reliably from real-time transactional markers down into pre-calculated rollups, L1 snapshots, and anomaly alert states. 

The next phase will likely involve building out the UI surfaces for these alerts and any additional deep-dive reporting views required by the project spec.
