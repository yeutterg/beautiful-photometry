import { SpectralData, Metrics } from '../types/spectrum';
import { CIE_X, CIE_Y, CIE_Z, V_LAMBDA, V_PRIME_LAMBDA, MELANOPIC } from '../data/cie-data';
import { calculateCRI as calculateCRICIE } from './cri-practical';
import { calculateTM30 } from './tm30';

// Helper function to interpolate SPD to standard wavelengths
export function interpolateSPD(spd: SpectralData, targetWavelengths: number[]): number[] {
  const wavelengths = Object.keys(spd).map(Number).sort((a, b) => a - b);
  const values: number[] = [];

  for (const targetWL of targetWavelengths) {
    if (spd[targetWL] !== undefined) {
      values.push(spd[targetWL]);
    } else {
      // Linear interpolation
      let lowerWL = -1, upperWL = -1;
      for (let i = 0; i < wavelengths.length - 1; i++) {
        if (wavelengths[i] <= targetWL && wavelengths[i + 1] > targetWL) {
          lowerWL = wavelengths[i];
          upperWL = wavelengths[i + 1];
          break;
        }
      }
      
      if (lowerWL > 0 && upperWL > 0) {
        const ratio = (targetWL - lowerWL) / (upperWL - lowerWL);
        const interpolated = spd[lowerWL] + ratio * (spd[upperWL] - spd[lowerWL]);
        values.push(interpolated);
      } else {
        values.push(0);
      }
    }
  }
  
  return values;
}

// Calculate CIE 1931 XYZ tristimulus values
export function calculateXYZ(spd: SpectralData): { X: number; Y: number; Z: number } {
  const wavelengths = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
  const spdValues = interpolateSPD(spd, wavelengths);
  
  let X = 0, Y = 0, Z = 0;
  
  for (let i = 0; i < wavelengths.length; i++) {
    const wl = wavelengths[i];
    const intensity = spdValues[i];
    
    X += intensity * (CIE_X[wl] || 0) * 5; // 5nm interval
    Y += intensity * (CIE_Y[wl] || 0) * 5;
    Z += intensity * (CIE_Z[wl] || 0) * 5;
  }
  
  // Normalize
  const sum = X + Y + Z;
  if (sum > 0) {
    X = X / sum;
    Y = Y / sum;
    Z = Z / sum;
  }
  
  return { X, Y, Z };
}

// Calculate chromaticity coordinates
export function calculateChromaticity(spd: SpectralData): { x: number; y: number } {
  const { X, Y, Z } = calculateXYZ(spd);
  const sum = X + Y + Z;
  
  if (sum === 0) return { x: 0.3333, y: 0.3333 };
  
  return {
    x: X / sum,
    y: Y / sum
  };
}

// Calculate CCT using McCamy's approximation
export function calculateCCT(spd: SpectralData): number {
  const { x, y } = calculateChromaticity(spd);
  
  // McCamy's approximation
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 437 * Math.pow(n, 3) + 3601 * Math.pow(n, 2) + 6861 * n + 5517;
  
  return Math.round(cct);
}

// Calculate Duv (distance from Planckian locus)
export function calculateDuv(spd: SpectralData): number {
  const { x, y } = calculateChromaticity(spd);
  const cct = calculateCCT(spd);
  
  // Simplified calculation - would need full Planckian locus data for accuracy
  // This is a placeholder that gives approximate values
  const T = cct;
  let xp, yp;
  
  if (T < 4000) {
    xp = -0.2661239 * Math.pow(10, 9) / Math.pow(T, 3) - 0.2343589 * Math.pow(10, 6) / Math.pow(T, 2) + 0.8776956 * Math.pow(10, 3) / T + 0.179910;
  } else {
    xp = -3.0258469 * Math.pow(10, 9) / Math.pow(T, 3) + 2.1070379 * Math.pow(10, 6) / Math.pow(T, 2) + 0.2226347 * Math.pow(10, 3) / T + 0.240390;
  }
  
  if (T < 2222) {
    yp = -1.1063814 * Math.pow(xp, 3) - 1.34811020 * Math.pow(xp, 2) + 2.18555832 * xp - 0.20219683;
  } else if (T < 4000) {
    yp = -0.9549476 * Math.pow(xp, 3) - 1.37418593 * Math.pow(xp, 2) + 2.09137015 * xp - 0.16748867;
  } else {
    yp = 3.0817580 * Math.pow(xp, 3) - 5.87338670 * Math.pow(xp, 2) + 3.75112997 * xp - 0.37001483;
  }
  
  // Calculate Duv
  const duv = Math.sqrt(Math.pow(x - xp, 2) + Math.pow(y - yp, 2));
  const sign = (y - yp) >= 0 ? 1 : -1;
  
  return Math.round(sign * duv * 10000) / 10000;
}

// Calculate melanopic ratio
export function calculateMelanopicRatio(spd: SpectralData): number {
  const wavelengths = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
  const spdValues = interpolateSPD(spd, wavelengths);
  
  let melanopicSum = 0;
  let photopicSum = 0;
  
  for (let i = 0; i < wavelengths.length; i++) {
    const wl = wavelengths[i];
    const intensity = spdValues[i];
    
    melanopicSum += intensity * (MELANOPIC[wl] || 0);
    photopicSum += intensity * (V_LAMBDA[wl] || 0);
  }
  
  if (photopicSum === 0) return 0;
  return Math.round((melanopicSum / photopicSum) * 1000) / 1000;
}

// Calculate melanopic response (melanopic lux)
export function calculateMelanopicResponse(spd: SpectralData): number {
  const wavelengths = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
  const spdValues = interpolateSPD(spd, wavelengths);
  
  let melanopicSum = 0;
  
  for (let i = 0; i < wavelengths.length; i++) {
    const wl = wavelengths[i];
    const intensity = spdValues[i];
    melanopicSum += intensity * (MELANOPIC[wl] || 0) * 5; // 5nm interval
  }
  
  // Scale to approximate lux equivalent
  return Math.round(melanopicSum * 683);
}

// Calculate S/P ratio (Scotopic/Photopic)
export function calculateSPRatio(spd: SpectralData): number {
  const wavelengths = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
  const spdValues = interpolateSPD(spd, wavelengths);
  
  let scotopicSum = 0;
  let photopicSum = 0;
  
  for (let i = 0; i < wavelengths.length; i++) {
    const wl = wavelengths[i];
    const intensity = spdValues[i];
    
    scotopicSum += intensity * (V_PRIME_LAMBDA[wl] || 0);
    photopicSum += intensity * (V_LAMBDA[wl] || 0);
  }
  
  if (photopicSum === 0) return 0;
  return Math.round((scotopicSum / photopicSum) * 1000) / 1000;
}

// Calculate M/P ratio (Melanopic/Photopic)
export function calculateMPRatio(spd: SpectralData): number {
  // This is essentially the melanopic ratio
  return calculateMelanopicRatio(spd);
}

// Calculate MDER (Melanopic Daylight Efficacy Ratio) per CIE S026-2018
// MDER normalizes to D65 daylight as reference (MDER = 1 for D65)
export function calculateMDER(spd: SpectralData): number {
  // MDER = M/P ratio × 0.906 (daylight correction factor)
  const mpRatio = calculateMPRatio(spd);
  return Math.round(mpRatio * 0.906 * 1000) / 1000;
}

// Calculate blue light percentage (380-500nm) within visible spectrum (380-780nm)
// Formula: Percent Blue = 100 × (∫₃₈₀⁵⁰⁰ SPD(λ)dλ) / (∫₃₈₀⁷⁸⁰ SPD(λ)dλ)
export function calculateBluePercentage(spd: SpectralData): number {
  // Get all wavelengths and sort them
  const wavelengths = Object.keys(spd).map(Number).sort((a, b) => a - b);
  
  let blueIntegral = 0;  // 380-500nm
  let visibleIntegral = 0; // 380-780nm
  
  // Perform trapezoidal integration for better accuracy
  for (let i = 0; i < wavelengths.length - 1; i++) {
    const wl1 = wavelengths[i];
    const wl2 = wavelengths[i + 1];
    const intensity1 = spd[wl1];
    const intensity2 = spd[wl2];
    
    // Skip if outside visible range
    if (wl2 < 380 || wl1 > 780) continue;
    
    // Calculate trapezoidal area
    const deltaWl = wl2 - wl1;
    const avgIntensity = (intensity1 + intensity2) / 2;
    const area = avgIntensity * deltaWl;
    
    // Add to visible integral if in range
    if (wl1 >= 380 && wl2 <= 780) {
      visibleIntegral += area;
    } else if ((wl1 < 380 && wl2 > 380) || (wl1 < 780 && wl2 > 780)) {
      // Partial overlap with visible range - interpolate
      const visibleStart = Math.max(380, wl1);
      const visibleEnd = Math.min(780, wl2);
      const partialDelta = visibleEnd - visibleStart;
      const interpolatedIntensity1 = wl1 < 380 ? 
        intensity1 + (intensity2 - intensity1) * ((380 - wl1) / deltaWl) : intensity1;
      const interpolatedIntensity2 = wl2 > 780 ? 
        intensity1 + (intensity2 - intensity1) * ((780 - wl1) / deltaWl) : intensity2;
      visibleIntegral += (interpolatedIntensity1 + interpolatedIntensity2) / 2 * partialDelta;
    }
    
    // Add to blue integral if in blue range
    if (wl1 >= 380 && wl2 <= 500) {
      blueIntegral += area;
    } else if ((wl1 < 380 && wl2 > 380 && wl2 <= 500) || (wl1 >= 380 && wl1 < 500 && wl2 > 500)) {
      // Partial overlap with blue range - interpolate
      const blueStart = Math.max(380, wl1);
      const blueEnd = Math.min(500, wl2);
      const partialDelta = blueEnd - blueStart;
      const interpolatedIntensity1 = wl1 < 380 ? 
        intensity1 + (intensity2 - intensity1) * ((380 - wl1) / deltaWl) : intensity1;
      const interpolatedIntensity2 = wl2 > 500 ? 
        intensity1 + (intensity2 - intensity1) * ((500 - wl1) / deltaWl) : intensity2;
      blueIntegral += (interpolatedIntensity1 + interpolatedIntensity2) / 2 * partialDelta;
    }
  }
  
  if (visibleIntegral === 0) return 0;
  
  // Calculate percentage
  const percentage = (blueIntegral / visibleIntegral) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

// Calculate peak wavelength
export function calculatePeakWavelength(spd: SpectralData): number {
  let maxIntensity = 0;
  let peakWavelength = 0;
  
  for (const [wl, intensity] of Object.entries(spd)) {
    if (intensity > maxIntensity) {
      maxIntensity = intensity;
      peakWavelength = parseInt(wl);
    }
  }
  
  return peakWavelength;
}

// Calculate dominant wavelength
export function calculateDominantWavelength(spd: SpectralData): number {
  const { x, y } = calculateChromaticity(spd);
  
  // White point (D65)
  const xw = 0.31271;
  const yw = 0.32902;
  
  // This is a simplified calculation
  // A full implementation would need to find the intersection with the spectrum locus
  const angle = Math.atan2(y - yw, x - xw);
  
  // Map angle to approximate wavelength
  // This is a rough approximation
  let wavelength = 570; // Default green
  
  if (angle > 0 && angle < Math.PI / 3) {
    wavelength = 570 + (angle / (Math.PI / 3)) * 30;
  } else if (angle >= Math.PI / 3) {
    wavelength = 480 - ((angle - Math.PI / 3) / (Math.PI / 3)) * 30;
  } else if (angle < 0 && angle > -Math.PI / 2) {
    wavelength = 570 + (Math.abs(angle) / (Math.PI / 2)) * 110;
  }
  
  return Math.round(wavelength);
}

// Calculate all metrics for an SPD
export function calculateAllMetrics(name: string, spd: SpectralData): Metrics {
  try {
    const cct = calculateCCT(spd);
    const criResults = calculateCRICIE(spd);
    const tm30Results = calculateTM30(spd);
    
    return {
      name,
      cct: isNaN(cct) || cct < 1000 || cct > 20000 ? 'N/A' : `${cct}K`,
      duv: calculateDuv(spd),
      cri: criResults.Ra,
      criValues: criResults,
      r9: criResults.R9,
      rf: tm30Results.Rf,
      rg: tm30Results.Rg,
      tm30: tm30Results,
      melanopicResponse: calculateMelanopicResponse(spd),
      scotopicPhotopicRatio: calculateSPRatio(spd),
      melanopicPhotopicRatio: calculateMPRatio(spd),
      mder: calculateMDER(spd),
      bluePercentage: calculateBluePercentage(spd),
      peakWavelength: calculatePeakWavelength(spd),
      dominantWavelength: calculateDominantWavelength(spd)
    };
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      name,
      cct: 'Error',
      duv: undefined,
      cri: undefined,
      criValues: undefined,
      r9: undefined,
      rf: undefined,
      rg: undefined,
      tm30: undefined
    };
  }
}