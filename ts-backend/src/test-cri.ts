import { calculateCRICIE } from './calculations/cri-cie';
import { SpectralData } from './types/spectrum';

// Test SPD 1: Incandescent bulb (2700K) - should have CRI ~100
const incandescent2700K: SpectralData = {
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

// Test SPD 2: Cool white fluorescent (4100K) - should have CRI ~60-65
const fluorescent4100K: SpectralData = {
  380: 0.0020, 385: 0.0025, 390: 0.0030, 395: 0.0035, 400: 0.0040,
  405: 0.0110, 410: 0.0045, 415: 0.0050, 420: 0.0055, 425: 0.0060,
  430: 0.0065, 435: 0.0260, 440: 0.0070, 445: 0.0075, 450: 0.0080,
  455: 0.0085, 460: 0.0090, 465: 0.0095, 470: 0.0100, 475: 0.0105,
  480: 0.0110, 485: 0.0115, 490: 0.0370, 495: 0.0120, 500: 0.0125,
  505: 0.0130, 510: 0.0135, 515: 0.0140, 520: 0.0145, 525: 0.0150,
  530: 0.0155, 535: 0.0160, 540: 0.0165, 545: 0.0830, 550: 0.0180,
  555: 0.0185, 560: 0.0190, 565: 0.0195, 570: 0.0200, 575: 0.0205,
  580: 0.0470, 585: 0.0215, 590: 0.0220, 595: 0.0225, 600: 0.0230,
  605: 0.0235, 610: 0.0630, 615: 0.0245, 620: 0.0250, 625: 0.0255,
  630: 0.0260, 635: 0.0265, 640: 0.0270, 645: 0.0275, 650: 0.0280,
  655: 0.0285, 660: 0.0290, 665: 0.0295, 670: 0.0300, 675: 0.0305,
  680: 0.0310, 685: 0.0315, 690: 0.0320, 695: 0.0325, 700: 0.0330,
  705: 0.0335, 710: 0.0340, 715: 0.0345, 720: 0.0350, 725: 0.0355,
  730: 0.0360, 735: 0.0365, 740: 0.0370, 745: 0.0375, 750: 0.0380,
  755: 0.0385, 760: 0.0390, 765: 0.0395, 770: 0.0400, 775: 0.0405,
  780: 0.0410
};

// Test SPD 3: D65 daylight - should have CRI = 100 by definition
const d65Daylight: SpectralData = {
  380: 49.9755, 385: 52.3118, 390: 54.6482, 395: 68.7015, 400: 82.7549,
  405: 87.1204, 410: 91.486, 415: 92.4589, 420: 93.4318, 425: 90.057,
  430: 86.6823, 435: 95.7736, 440: 104.865, 445: 110.936, 450: 117.008,
  455: 117.41, 460: 117.812, 465: 116.336, 470: 114.861, 475: 115.392,
  480: 115.923, 485: 112.367, 490: 108.811, 495: 109.082, 500: 109.354,
  505: 108.578, 510: 107.802, 515: 106.296, 520: 104.79, 525: 106.239,
  530: 107.689, 535: 106.047, 540: 104.405, 545: 104.225, 550: 104.046,
  555: 102.023, 560: 100.0, 565: 98.1671, 570: 96.3342, 575: 96.0611,
  580: 95.788, 585: 92.2368, 590: 88.6856, 595: 89.3459, 600: 90.0062,
  605: 89.8026, 610: 89.5991, 615: 88.6489, 620: 87.6987, 625: 85.4936,
  630: 83.2886, 635: 83.4939, 640: 83.6992, 645: 81.863, 650: 80.0268,
  655: 80.1207, 660: 80.2146, 665: 81.2462, 670: 82.2778, 675: 80.281,
  680: 78.2842, 685: 74.0027, 690: 69.7213, 695: 70.6652, 700: 71.6091,
  705: 72.979, 710: 74.349, 715: 67.9765, 720: 61.604, 725: 65.7448,
  730: 69.8856, 735: 72.4863, 740: 75.087, 745: 69.3398, 750: 63.5927,
  755: 55.0054, 760: 46.4182, 765: 56.6118, 770: 66.8054, 775: 65.0941,
  780: 63.3828
};

// Test SPD 4: Simple flat spectrum - should have moderate CRI
const flatSpectrum: SpectralData = {};
for (let wl = 380; wl <= 780; wl += 5) {
  flatSpectrum[wl] = 1.0;
}

console.log('Testing CRI Calculation with Known SPDs\n');
console.log('=========================================\n');

// Test 1: Incandescent
console.log('Test 1: Incandescent 2700K');
console.log('Expected: CRI > 96');
try {
  const result1 = calculateCRICIE(incandescent2700K);
  console.log('Result:', result1);
  console.log(`CRI Ra = ${result1.Ra}, R9 = ${result1.R9}\n`);
} catch (error) {
  console.error('Error:', error);
  console.log('\n');
}

// Test 2: Fluorescent
console.log('Test 2: Cool White Fluorescent 4100K');
console.log('Expected: CRI ~60-65');
try {
  const result2 = calculateCRICIE(fluorescent4100K);
  console.log('Result:', result2);
  console.log(`CRI Ra = ${result2.Ra}, R9 = ${result2.R9}\n`);
} catch (error) {
  console.error('Error:', error);
  console.log('\n');
}

// Test 3: D65 Daylight
console.log('Test 3: D65 Daylight');
console.log('Expected: CRI = 100');
try {
  const result3 = calculateCRICIE(d65Daylight);
  console.log('Result:', result3);
  console.log(`CRI Ra = ${result3.Ra}, R9 = ${result3.R9}\n`);
} catch (error) {
  console.error('Error:', error);
  console.log('\n');
}

// Test 4: Flat spectrum
console.log('Test 4: Flat Spectrum');
console.log('Expected: CRI ~50-70');
try {
  const result4 = calculateCRICIE(flatSpectrum);
  console.log('Result:', result4);
  console.log(`CRI Ra = ${result4.Ra}, R9 = ${result4.R9}\n`);
} catch (error) {
  console.error('Error:', error);
  console.log('\n');
}

// Debug: Test with a simple SPD to see intermediate values
console.log('\n=========================================');
console.log('Debug Test: Simple SPD with intermediate logging\n');

const debugSPD: SpectralData = {};
// Create a simple warm white SPD
for (let wl = 380; wl <= 780; wl += 5) {
  // Simple warm white approximation
  debugSPD[wl] = 0.5 + 0.5 * (wl - 380) / 400;
}

console.log('Input SPD sample:', Object.entries(debugSPD).slice(0, 5));

try {
  // We'll need to add debug logging to the actual function
  const debugResult = calculateCRICIE(debugSPD);
  console.log('Debug Result:', debugResult);
} catch (error) {
  console.error('Debug Error:', error);
}

export {};