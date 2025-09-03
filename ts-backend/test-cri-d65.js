// Test CRI calculation with D65 illuminant (should give Ra=100)

// D65 standard illuminant
const d65SPD = {
  380: 49.98, 385: 52.31, 390: 54.65, 395: 68.70, 400: 82.75,
  405: 87.12, 410: 91.49, 415: 92.46, 420: 93.43, 425: 90.06,
  430: 86.68, 435: 95.77, 440: 104.86, 445: 110.94, 450: 117.01,
  455: 117.41, 460: 117.81, 465: 116.34, 470: 114.86, 475: 115.39,
  480: 115.92, 485: 112.37, 490: 108.81, 495: 109.08, 500: 109.35,
  505: 108.58, 510: 107.80, 515: 106.30, 520: 104.79, 525: 106.24,
  530: 107.69, 535: 106.05, 540: 104.41, 545: 104.23, 550: 104.05,
  555: 102.02, 560: 100.00, 565: 98.17, 570: 96.33, 575: 96.06,
  580: 95.79, 585: 92.24, 590: 88.69, 595: 89.35, 600: 90.01,
  605: 89.80, 610: 89.60, 615: 88.65, 620: 87.70, 625: 85.49,
  630: 83.29, 635: 83.49, 640: 83.70, 645: 81.86, 650: 80.03,
  655: 80.12, 660: 80.21, 665: 81.25, 670: 82.28, 675: 80.28,
  680: 78.28, 685: 74.00, 690: 69.72, 695: 70.67, 700: 71.61,
  705: 72.98, 710: 74.35, 715: 67.98, 720: 61.60, 725: 65.74,
  730: 69.89, 735: 72.49, 740: 75.09, 745: 69.34, 750: 63.59,
  755: 55.01, 760: 46.42, 765: 56.51, 770: 66.60, 775: 65.09,
  780: 63.59
};

// Normalize to 0-1 range
const max = Math.max(...Object.values(d65SPD));
const normalizedD65 = {};
for (const wl in d65SPD) {
  normalizedD65[wl] = d65SPD[wl] / max;
}

async function testD65() {
  try {
    const response = await fetch('http://localhost:8081/api/cri', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'd65',
        name: 'D65 Illuminant',
        data: normalizedD65
      })
    });

    const result = await response.json();
    console.log('D65 CRI Test Results:');
    console.log('======================');
    console.log(`CRI (Ra): ${result.cri} (expected: ~100)`);
    console.log(`R9: ${result.r9}`);
    console.log('\nIndividual R values:');
    
    if (result.r_values) {
      Object.entries(result.r_values).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
    console.log('\nNote: D65 at 6500K should give very high CRI values');

  } catch (error) {
    console.error('Error testing D65:', error);
  }
}

testD65();