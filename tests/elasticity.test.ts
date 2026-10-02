import { describe, it, expect } from 'vitest';
import { calculatePriceElasticity } from '../modules/analytics/elasticity';

describe('Price Elasticity Calculator', () => {
  it('blocks calculation if there are fewer than 30 observations', () => {
    const data = Array.from({ length: 29 }, () => ({ priceCents: 1000, quantity: 5 }));
    const result = calculatePriceElasticity(data);
    expect(result.status).toBe('insufficient_data_points');
  });

  it('blocks calculation if there are fewer than 3 distinct price points', () => {
    const data = Array.from({ length: 35 }, (_, i) => ({
      // Only 2 price points: 1000 and 1500
      priceCents: i % 2 === 0 ? 1000 : 1500, 
      quantity: 5
    }));
    const result = calculatePriceElasticity(data);
    expect(result.status).toBe('insufficient_price_variation');
  });

  it('blocks calculation if the regression R-squared is too low (noise)', () => {
    // Generate 40 completely random scatter points (no correlation)
    const data = Array.from({ length: 40 }, (_, i) => ({
      priceCents: 1000 + (Math.random() * 1000), // Prices between 10.00 and 20.00
      quantity: Math.random() * 100 // Quantity completely independent of price
    }));
    
    // There is a microscopic chance R-squared is > 0.1 by pure luck, but practically it will fail
    const result = calculatePriceElasticity(data);
    expect(result.status).toBe('low_confidence');
    expect(result.rSquared).toBeLessThan(0.1);
  });

  it('successfully calculates elasticity for valid, correlated data', () => {
    // Generate 40 points where quantity explicitly drops as price increases
    // Elasticity formula: ln(Q) = a + E * ln(P)
    // Let's force an elasticity of roughly -1.5
    // So Q = k * P^(-1.5)
    const k = 1000000;
    const data = Array.from({ length: 40 }, (_, i) => {
      // 4 distinct base price points with some jitter
      const basePrices = [1000, 1200, 1500, 2000];
      const p = basePrices[i % 4] + (Math.random() * 50); // slight price jitter
      
      const q = k * Math.pow(p / 100, -1.5);
      
      return { priceCents: p, quantity: q };
    });

    const result = calculatePriceElasticity(data);
    expect(result.status).toBe('computed');
    expect(result.elasticity).toBeLessThan(-1.0); // Should be negative and elastic
    expect(result.rSquared).toBeGreaterThan(0.9); // Nearly perfect correlation
  });
});
