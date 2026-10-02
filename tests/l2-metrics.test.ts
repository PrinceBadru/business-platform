import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { db, client } from '../lib/db/drizzle';
import * as schema from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateMAD, 
  calculateZScore, 
  calculateTrendSlope 
} from '../modules/analytics/l2-metrics';

describe('L2 Statistical Functions Golden Tests', () => {
  it('calculates SMA correctly', () => {
    const data = [10, 20, 30, 40, 50]; // Mean: 30
    expect(calculateSMA(data)).toBe(30);
  });

  it('calculates EMA correctly', () => {
    // If period = 3, k = 2/(3+1) = 0.5
    // values: [newest, older, oldest] -> [30, 20, 10]
    // Start oldest: EMA = 10
    // Next (20): EMA = (20 * 0.5) + (10 * 0.5) = 15
    // Next (30): EMA = (30 * 0.5) + (15 * 0.5) = 22.5
    const data = [30, 20, 10]; 
    expect(calculateEMA(data, 3)).toBe(22.5);
  });

  it('calculates MAD correctly', () => {
    // Values: 1, 1, 2, 2, 4, 6, 9
    // Median: 2
    // Absolute deviations from 2: 1, 1, 0, 0, 2, 4, 7
    // Sorted deviations: 0, 0, 1, 1, 2, 4, 7
    // Median of deviations: 1
    const data = [1, 1, 2, 2, 4, 6, 9];
    const { median, mad } = calculateMAD(data);
    expect(median).toBe(2);
    expect(mad).toBe(1);
  });

  it('calculates Z-Score correctly', () => {
    // Values: [10, 12, 23, 23, 16, 23, 21, 16]
    // We want the Z-score of a new value, say 30
    const data = [10, 12, 23, 23, 16, 23, 21, 16];
    // Mean of data = 18
    // Variance = sum( (x - 18)^2 ) / 7 = (64 + 36 + 25 + 25 + 4 + 25 + 9 + 4) / 7 = 192 / 7 = 27.4285
    // StdDev = sqrt(27.4285) = 5.2372
    // Z-Score for 30 = (30 - 18) / 5.2372 = 2.2913
    const z = calculateZScore(30, data);
    expect(z).toBeCloseTo(2.291, 2);
  });

  it('calculates OLS trend slope correctly', () => {
    // values (index 0 is newest, 1 is older...)
    // Let's use points: (x=0, y=1), (x=1, y=2), (x=2, y=3)
    // values array: [3, 2, 1] (because 3 is newest (t=2), 1 is oldest (t=0))
    // We expect slope = 1, intercept = 1
    const data = [3, 2, 1];
    const { slope, intercept } = calculateTrendSlope(data);
    expect(slope).toBeCloseTo(1, 4);
    expect(intercept).toBeCloseTo(1, 4);
  });
});
