import { SpectralData } from './types/spectrum';
import { CIE_1931_X, CIE_1931_Y, CIE_1931_Z } from './calculations/cri-cie';

// Test with a simple incandescent SPD
const testSPD: SpectralData = {
  380: 0.0091, 385: 0.0103, 390: 0.0116, 395: 0.0129, 400: 0.0143,
  405: 0.0158, 410: 0.0173, 415: 0.0188, 420: 0.0205, 425: 0.0222,
  430: 0.0240, 435: 0.0258, 440: 0.0277, 445: 0.0297, 450: 0.0318,
  455: 0.0339, 460: 0.0361, 465: 0.0384, 470: 0.0408, 475: 0.0432,
  480: 0.0458, 485: 0.0484, 490: 0.0511, 495: 0.0539, 500: 0.0567,
  505: 0.0597, 510: 0.0627, 515: 0.0658, 520: 0.0690, 525: 0.0723,
  530: 0.0756, 535: 0.0791, 540: 0.0826, 545: 0.0862, 550: 0.0899,
  555: 0.0937, 560: 0.0975, 565: 0.1014, 570: 0.1054, 575: 0.1095,
  580: 0.1137, 585: 0.1179, 590: 0.1222, 595: 0.1266, 600: 0.1311,
  605: 0.1356, 610: 0.1402, 615: 0.1449, 620: 0.1497, 625: 0.1545,
  630: 0.1594, 635: 0.1644, 640: 0.1694, 645: 0.1745, 650: 0.1797,
  655: 0.1849, 660: 0.1902, 665: 0.1956, 670: 0.2010, 675: 0.2065,
  680: 0.2121, 685: 0.2177, 690: 0.2234, 695: 0.2291, 700: 0.2349,
  705: 0.2408, 710: 0.2467, 715: 0.2527, 720: 0.2588, 725: 0.2649,
  730: 0.2711, 735: 0.2773, 740: 0.2836, 745: 0.2899, 750: 0.2963,
  755: 0.3028, 760: 0.3093, 765: 0.3159, 770: 0.3225, 775: 0.3292,
  780: 0.3360
};

// Calculate XYZ manually to debug
function debugCalculateXYZ(spd: SpectralData): { X: number; Y: number; Z: number } {
  let X = 0, Y = 0, Z = 0;
  let sumY = 0;

  console.log('Calculating XYZ...');
  
  // Calculate normalization factor k
  for (let wl = 380; wl <= 780; wl += 5) {
    const yBar = CIE_1931_Y[wl] || 0;
    sumY += yBar;
    console.log(`  wl=${wl}, Y_bar=${yBar.toFixed(6)}, sumY=${sumY.toFixed(6)}`);
    if (wl === 400) break; // Just show first few
  }
  console.log(`  ... Total sumY = ${sumY}`);
  
  const k = 100 / sumY;
  console.log(`  Normalization k = 100 / ${sumY} = ${k}`);

  // Calculate XYZ
  let sampleCount = 0;
  for (let wl = 380; wl <= 780; wl += 5) {
    const intensity = spd[wl] || spd[wl.toString()] || 0;
    const xBar = CIE_1931_X[wl] || 0;
    const yBar = CIE_1931_Y[wl] || 0;
    const zBar = CIE_1931_Z[wl] || 0;
    
    X += intensity * xBar;
    Y += intensity * yBar;
    Z += intensity * zBar;
    
    if (sampleCount < 3) {
      console.log(`  wl=${wl}: intensity=${intensity.toFixed(4)}, X+=${(intensity * xBar).toFixed(6)}, Y+=${(intensity * yBar).toFixed(6)}, Z+=${(intensity * zBar).toFixed(6)}`);
    }
    sampleCount++;
  }
  console.log(`  Raw totals: X=${X}, Y=${Y}, Z=${Z}`);
  
  const result = { 
    X: X * k, 
    Y: Y * k, 
    Z: Z * k 
  };
  
  console.log(`  Final XYZ: X=${result.X}, Y=${result.Y}, Z=${result.Z}`);
  return result;
}

// Calculate CIE 1960 UCS chromaticity coordinates (u, v)
function debugCalculateUV(X: number, Y: number, Z: number): { u: number; v: number } {
  console.log(`\nCalculating u,v from X=${X}, Y=${Y}, Z=${Z}`);
  
  const sum = X + Y + Z;
  console.log(`  X + Y + Z = ${sum}`);
  
  if (sum === 0) {
    console.log('  Sum is 0, returning u=0, v=0');
    return { u: 0, v: 0 };
  }
  
  const u = 4 * X / (X + 15 * Y + 3 * Z);
  const v = 6 * Y / (X + 15 * Y + 3 * Z);
  
  console.log(`  u = 4*X / (X + 15*Y + 3*Z) = 4*${X} / (${X} + 15*${Y} + 3*${Z})`);
  console.log(`    = ${4*X} / ${X + 15*Y + 3*Z} = ${u}`);
  console.log(`  v = 6*Y / (X + 15*Y + 3*Z) = 6*${Y} / (${X} + 15*${Y} + 3*${Z})`);
  console.log(`    = ${6*Y} / ${X + 15*Y + 3*Z} = ${v}`);
  
  return { u, v };
}

// Calculate CCT
function debugCalculateCCT(u: number, v: number): number {
  console.log(`\nCalculating CCT from u=${u}, v=${v}`);
  
  const n = (u - 0.3320) / (0.1858 - v);
  console.log(`  n = (u - 0.3320) / (0.1858 - v)`);
  console.log(`    = (${u} - 0.3320) / (0.1858 - ${v})`);
  console.log(`    = ${u - 0.3320} / ${0.1858 - v}`);
  console.log(`    = ${n}`);
  
  const cct = 437 * Math.pow(n, 3) + 3601 * Math.pow(n, 2) + 6861 * n + 5517;
  console.log(`  CCT = 437*n³ + 3601*n² + 6861*n + 5517`);
  console.log(`      = 437*${Math.pow(n, 3)} + 3601*${Math.pow(n, 2)} + 6861*${n} + 5517`);
  console.log(`      = ${cct}`);
  
  return Math.round(cct);
}

console.log('Debug Test: Step-by-step CRI calculation\n');
console.log('=========================================\n');

// Step 1: Calculate XYZ
const xyz = debugCalculateXYZ(testSPD);

// Step 2: Calculate u,v
const uv = debugCalculateUV(xyz.X, xyz.Y, xyz.Z);

// Step 3: Calculate CCT
const cct = debugCalculateCCT(uv.u, uv.v);
console.log(`\nFinal CCT: ${cct}K`);

// Check for issues
console.log('\n=========================================');
console.log('Checking for potential issues:');
console.log(`  - Is XYZ valid? ${xyz.X > 0 && xyz.Y > 0 && xyz.Z > 0 ? 'Yes' : 'No'}`);
console.log(`  - Is u,v valid? ${!isNaN(uv.u) && !isNaN(uv.v) ? 'Yes' : 'No'}`);
console.log(`  - Is CCT valid? ${!isNaN(cct) && cct > 0 ? 'Yes' : 'No'}`);

export {};