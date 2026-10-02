import { describe, it, expect } from 'vitest';
import { 
  calculateWeeklySeasonality, 
  calculateHoltForecast 
} from '../modules/analytics/forecasting';

describe('L3 Forecasting and Seasonality', () => {
  it('returns insufficient_data for seasonality if < 14 days', () => {
    const data = [10, 20, 30, 40, 50]; // 5 days
    const result = calculateWeeklySeasonality(data);
    expect(result.status).toBe('insufficient_data');
    expect(result.indices.length).toBe(0);
  });

  it('calculates weekly seasonality indices for valid data', () => {
    // Generate 14 days of data with a clear pattern
    // Mon: 100, Tue: 100, Wed: 100, Thu: 100, Fri: 200, Sat: 200, Sun: 50
    const week = [100, 100, 100, 100, 200, 200, 50];
    // Reverse because the function expects [newest, ..., oldest]
    // If chronologic is week 1 + week 2, reverse of that is input
    const chronologic = [...week, ...week];
    const data = [...chronologic].reverse();
    
    const result = calculateWeeklySeasonality(data);
    expect(result.status).toBe('computed');
    expect(result.indices.length).toBe(7);
    
    // Sum of indices must be 7
    const sum = result.indices.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(7, 3);
  });

  it('returns insufficient_data for Holt forecast if < 30 days', () => {
    const data = new Array(29).fill(100);
    const result = calculateHoltForecast(data, 10);
    expect(result.status).toBe('insufficient_data');
    expect(result.forecast.length).toBe(0);
  });

  it('calculates Holt forecast for valid data', () => {
    // 30 days of data with a perfect linear trend
    // [oldest=10, 20, 30, ... 300=newest]
    const chronologic = Array.from({ length: 30 }, (_, i) => (i + 1) * 10);
    const data = [...chronologic].reverse(); // newest first
    
    // We expect the forecast to continue the upward trend
    // Because Holt smooths, it won't be exactly [310, 320...] immediately due to alpha/beta weights, 
    // but it should definitely be > 300.
    const result = calculateHoltForecast(data, 5, 0.8, 0.8);
    expect(result.status).toBe('computed');
    expect(result.forecast.length).toBe(5); // Requested horizon 5
    
    // The first forecasted value should be > 300
    expect(result.forecast[0]).toBeGreaterThan(300);
    // Values should be increasing
    expect(result.forecast[1]).toBeGreaterThan(result.forecast[0]);
  });
  
  it('caps the forecast horizon at the training window length', () => {
    // 30 days of data
    const data = new Array(30).fill(100);
    // Request 50 days of forecast
    const result = calculateHoltForecast(data, 50);
    // Should cap at 30
    expect(result.forecast.length).toBe(30);
  });
});
