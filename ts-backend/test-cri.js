// Test CRI calculation accuracy
// Use built-in fetch (Node 18+)

// Test SPD data (example from Excel)
const testSPD = {
  380: 0.10, 385: 0.12, 390: 0.14, 395: 0.16, 400: 0.18,
  405: 0.20, 410: 0.22, 415: 0.24, 420: 0.26, 425: 0.28,
  430: 0.30, 435: 0.32, 440: 0.34, 445: 0.36, 450: 0.38,
  455: 0.40, 460: 0.42, 465: 0.44, 470: 0.46, 475: 0.48,
  480: 0.50, 485: 0.52, 490: 0.54, 495: 0.56, 500: 0.58,
  505: 0.60, 510: 0.62, 515: 0.64, 520: 0.66, 525: 0.68,
  530: 0.70, 535: 0.72, 540: 0.74, 545: 0.76, 550: 0.78,
  555: 0.80, 560: 0.82, 565: 0.84, 570: 0.86, 575: 0.88,
  580: 0.90, 585: 0.92, 590: 0.94, 595: 0.96, 600: 0.98,
  605: 1.00, 610: 0.98, 615: 0.96, 620: 0.94, 625: 0.92,
  630: 0.90, 635: 0.88, 640: 0.86, 645: 0.84, 650: 0.82,
  655: 0.80, 660: 0.78, 665: 0.76, 670: 0.74, 675: 0.72,
  680: 0.70, 685: 0.68, 690: 0.66, 695: 0.64, 700: 0.62,
  705: 0.60, 710: 0.58, 715: 0.56, 720: 0.54, 725: 0.52,
  730: 0.50, 735: 0.48, 740: 0.46, 745: 0.44, 750: 0.42,
  755: 0.40, 760: 0.38, 765: 0.36, 770: 0.34, 775: 0.32,
  780: 0.30
};

async function testCRI() {
  try {
    const response = await fetch('http://localhost:8081/api/cri', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test',
        name: 'Test SPD',
        data: testSPD
      })
    });

    const result = await response.json();
    console.log('CRI Calculation Results:');
    console.log('========================');
    console.log(`CRI (Ra): ${result.cri}`);
    console.log(`R9: ${result.r9}`);
    console.log('\nIndividual R values:');
    
    if (result.r_values) {
      Object.entries(result.r_values).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

    // Expected values from Excel (approximate)
    console.log('\n\nExpected values from Excel:');
    console.log('===========================');
    console.log('Ra: ~75.9');
    console.log('R1: ~69.2');
    console.log('R2: ~83.6');
    console.log('R3: ~92.1');
    console.log('R4: ~72.7');
    console.log('R5: ~73.9');
    console.log('R6: ~79.6');
    console.log('R7: ~82.3');
    console.log('R8: ~53.4');
    console.log('R9: ~-47.3');

  } catch (error) {
    console.error('Error testing CRI:', error);
  }
}

testCRI();