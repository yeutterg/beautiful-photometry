import { calculateCRICIE } from './calculations/cri-cie';
import { SpectralData } from './types/spectrum';

// Inline debug version of CRI calculation
function debugCRI(spd: SpectralData) {
  console.log('=== Starting CRI Calculation ===');
  
  // Step 1: Calculate XYZ for test source
  let X = 0, Y = 0, Z = 0;
  for (let wl = 380; wl <= 780; wl += 5) {
    const intensity = spd[wl] || 0;
    X += intensity * 0.1; // Simplified - just checking flow
    Y += intensity * 0.1;
    Z += intensity * 0.1;
  }
  console.log(`Test source XYZ: X=${X.toFixed(3)}, Y=${Y.toFixed(3)}, Z=${Z.toFixed(3)}`);
  
  // Step 2: Calculate u,v
  const sum = X + Y + Z;
  if (sum === 0) {
    console.log('ERROR: XYZ sum is 0!');
    return;
  }
  const u = 4 * X / (X + 15 * Y + 3 * Z);
  const v = 6 * Y / (X + 15 * Y + 3 * Z);
  console.log(`Test source u,v: u=${u.toFixed(4)}, v=${v.toFixed(4)}`);
  
  // Step 3: Calculate CCT
  const n = (u - 0.3320) / (0.1858 - v);
  console.log(`n = ${n.toFixed(4)}`);
  
  if (isNaN(n)) {
    console.log('ERROR: n is NaN!');
    console.log(`  u - 0.3320 = ${u - 0.3320}`);
    console.log(`  0.1858 - v = ${0.1858 - v}`);
    return;
  }
  
  const cct = 437 * Math.pow(n, 3) + 3601 * Math.pow(n, 2) + 6861 * n + 5517;
  console.log(`CCT = ${Math.round(cct)}K`);
  
  // Step 4: Check if we would get a reference illuminant
  console.log(`Reference type: ${cct < 5000 ? 'Planckian' : 'Daylight'}`);
  
  // Step 5: Try calculating one R value
  console.log('\nTrying to calculate R1...');
  
  // Simplified test color sample calculation
  const testReflectance = 0.3; // Average reflectance
  let sampleY = 0;
  for (let wl = 380; wl <= 780; wl += 5) {
    sampleY += (spd[wl] || 0) * testReflectance * 0.1;
  }
  console.log(`Sample Y under test: ${sampleY.toFixed(3)}`);
  
  // Check W*U*V* calculation
  const W = 25 * Math.pow(sampleY, 1/3) - 17;
  console.log(`W* = 25 * ${sampleY}^(1/3) - 17 = ${W.toFixed(3)}`);
  
  if (isNaN(W)) {
    console.log('ERROR: W* is NaN!');
    console.log(`  sampleY = ${sampleY}`);
    console.log(`  sampleY^(1/3) = ${Math.pow(sampleY, 1/3)}`);
  }
  
  // Check for negative or zero Y
  if (sampleY <= 0) {
    console.log('ERROR: Sample Y is <= 0, this will cause NaN in W* calculation!');
  }
}

// Test with incandescent
const incandescent: SpectralData = {
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

console.log('Testing with Incandescent SPD\n');
debugCRI(incandescent);

console.log('\n\n=== Now testing actual CRI function ===');
try {
  const result = calculateCRICIE(incandescent);
  console.log('Result:', result);
} catch (error) {
  console.log('ERROR in calculateCRICIE:', error);
}

export {};