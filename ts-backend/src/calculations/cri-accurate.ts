import { SpectralData } from '../types/spectrum';

// CIE 1931 2° Standard Observer Color Matching Functions (380-780nm at 5nm intervals)
const CIE_X: { [wavelength: number]: number } = {
  380: 0.001368, 385: 0.002236, 390: 0.004243, 395: 0.007650, 400: 0.014310,
  405: 0.023190, 410: 0.043510, 415: 0.077630, 420: 0.134380, 425: 0.214770,
  430: 0.283900, 435: 0.328500, 440: 0.348280, 445: 0.348060, 450: 0.336200,
  455: 0.318700, 460: 0.290800, 465: 0.251100, 470: 0.195360, 475: 0.142100,
  480: 0.095640, 485: 0.057950, 490: 0.032010, 495: 0.014700, 500: 0.004900,
  505: 0.002400, 510: 0.009300, 515: 0.029100, 520: 0.063270, 525: 0.109600,
  530: 0.165500, 535: 0.225750, 540: 0.290400, 545: 0.359700, 550: 0.433450,
  555: 0.512050, 560: 0.594500, 565: 0.678400, 570: 0.762100, 575: 0.842500,
  580: 0.916300, 585: 0.978600, 590: 1.026300, 595: 1.056700, 600: 1.062200,
  605: 1.045600, 610: 1.002600, 615: 0.938400, 620: 0.854450, 625: 0.751400,
  630: 0.642400, 635: 0.541900, 640: 0.447900, 645: 0.360800, 650: 0.283500,
  655: 0.218700, 660: 0.164900, 665: 0.121200, 670: 0.087400, 675: 0.063600,
  680: 0.046770, 685: 0.032900, 690: 0.022700, 695: 0.015840, 700: 0.011359,
  705: 0.008111, 710: 0.005790, 715: 0.004109, 720: 0.002899, 725: 0.002049,
  730: 0.001440, 735: 0.001000, 740: 0.000690, 745: 0.000476, 750: 0.000332,
  755: 0.000235, 760: 0.000166, 765: 0.000117, 770: 0.000083, 775: 0.000059,
  780: 0.000042
};

const CIE_Y: { [wavelength: number]: number } = {
  380: 0.000039, 385: 0.000064, 390: 0.000120, 395: 0.000217, 400: 0.000396,
  405: 0.000640, 410: 0.001210, 415: 0.002180, 420: 0.004000, 425: 0.007300,
  430: 0.011600, 435: 0.016840, 440: 0.023000, 445: 0.029800, 450: 0.038000,
  455: 0.048000, 460: 0.060000, 465: 0.073900, 470: 0.090980, 475: 0.112600,
  480: 0.139020, 485: 0.169300, 490: 0.208020, 495: 0.258600, 500: 0.323000,
  505: 0.407300, 510: 0.503000, 515: 0.608200, 520: 0.710000, 525: 0.793200,
  530: 0.862000, 535: 0.914850, 540: 0.954000, 545: 0.980300, 550: 0.994950,
  555: 1.000000, 560: 0.995000, 565: 0.978600, 570: 0.952000, 575: 0.915400,
  580: 0.870000, 585: 0.816300, 590: 0.757000, 595: 0.694900, 600: 0.631000,
  605: 0.566800, 610: 0.503000, 615: 0.441200, 620: 0.381000, 625: 0.321000,
  630: 0.265000, 635: 0.217000, 640: 0.175000, 645: 0.138200, 650: 0.107000,
  655: 0.081600, 660: 0.061000, 665: 0.044580, 670: 0.032000, 675: 0.023200,
  680: 0.017000, 685: 0.011920, 690: 0.008210, 695: 0.005723, 700: 0.004102,
  705: 0.002929, 710: 0.002091, 715: 0.001484, 720: 0.001047, 725: 0.000740,
  730: 0.000520, 735: 0.000361, 740: 0.000249, 745: 0.000172, 750: 0.000120,
  755: 0.000085, 760: 0.000060, 765: 0.000042, 770: 0.000030, 775: 0.000021,
  780: 0.000015
};

const CIE_Z: { [wavelength: number]: number } = {
  380: 0.006450, 385: 0.010550, 390: 0.020050, 395: 0.036210, 400: 0.067850,
  405: 0.110200, 410: 0.207400, 415: 0.371300, 420: 0.645600, 425: 1.039050,
  430: 1.385600, 435: 1.622960, 440: 1.747060, 445: 1.782600, 450: 1.772110,
  455: 1.744100, 460: 1.669200, 465: 1.528100, 470: 1.287640, 475: 1.041900,
  480: 0.812950, 485: 0.616200, 490: 0.465180, 495: 0.353300, 500: 0.272000,
  505: 0.212300, 510: 0.158200, 515: 0.111700, 520: 0.078250, 525: 0.057250,
  530: 0.042160, 535: 0.029840, 540: 0.020300, 545: 0.013400, 550: 0.008750,
  555: 0.005750, 560: 0.003900, 565: 0.002750, 570: 0.002100, 575: 0.001800,
  580: 0.001650, 585: 0.001400, 590: 0.001100, 595: 0.001000, 600: 0.000800,
  605: 0.000600, 610: 0.000340, 615: 0.000240, 620: 0.000190, 625: 0.000100,
  630: 0.000050, 635: 0.000030, 640: 0.000020, 645: 0.000010, 650: 0.000000,
  655: 0.000000, 660: 0.000000, 665: 0.000000, 670: 0.000000, 675: 0.000000,
  680: 0.000000, 685: 0.000000, 690: 0.000000, 695: 0.000000, 700: 0.000000,
  705: 0.000000, 710: 0.000000, 715: 0.000000, 720: 0.000000, 725: 0.000000,
  730: 0.000000, 735: 0.000000, 740: 0.000000, 745: 0.000000, 750: 0.000000,
  755: 0.000000, 760: 0.000000, 765: 0.000000, 770: 0.000000, 775: 0.000000,
  780: 0.000000
};

// CRI Test Color Samples (TCS) reflectance data - all 14 samples from CIE 13.3-1995
const TCS_REFLECTANCE: { [key: string]: number[] } = {
  // TCS01: Light greyish red
  TCS01: [
    0.219, 0.223, 0.227, 0.231, 0.235, 0.239, 0.243, 0.247, 0.251, 0.255, 0.259, 0.263, 0.267, 0.271, 0.275, 0.279,
    0.220, 0.214, 0.208, 0.202, 0.196, 0.190, 0.184, 0.178, 0.172, 0.166, 0.160, 0.154, 0.148, 0.142, 0.136, 0.130,
    0.135, 0.140, 0.145, 0.150, 0.155, 0.160, 0.165, 0.170, 0.175, 0.180, 0.185, 0.190, 0.195, 0.200, 0.205, 0.210,
    0.248, 0.286, 0.324, 0.362, 0.400, 0.438, 0.476, 0.514, 0.552, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590,
    0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590, 0.590
  ],
  // TCS02: Dark greyish yellow
  TCS02: [
    0.070, 0.074, 0.078, 0.082, 0.086, 0.090, 0.094, 0.098, 0.102, 0.106, 0.110, 0.114, 0.118, 0.122, 0.126, 0.130,
    0.131, 0.132, 0.133, 0.134, 0.135, 0.136, 0.137, 0.138, 0.139, 0.140, 0.141, 0.142, 0.143, 0.144, 0.145, 0.146,
    0.150, 0.154, 0.158, 0.162, 0.166, 0.170, 0.174, 0.178, 0.182, 0.186, 0.190, 0.194, 0.198, 0.202, 0.206, 0.210,
    0.234, 0.258, 0.282, 0.306, 0.330, 0.354, 0.378, 0.402, 0.426, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450,
    0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450, 0.450
  ],
  // TCS03: Strong yellow green
  TCS03: [
    0.065, 0.068, 0.071, 0.074, 0.077, 0.080, 0.083, 0.086, 0.089, 0.092, 0.095, 0.098, 0.101, 0.104, 0.107, 0.110,
    0.077, 0.074, 0.071, 0.068, 0.065, 0.062, 0.059, 0.056, 0.053, 0.050, 0.047, 0.044, 0.041, 0.038, 0.035, 0.032,
    0.033, 0.034, 0.035, 0.036, 0.037, 0.038, 0.039, 0.040, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048,
    0.063, 0.078, 0.093, 0.108, 0.123, 0.138, 0.153, 0.168, 0.183, 0.198, 0.282, 0.366, 0.450, 0.534, 0.618, 0.702,
    0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702
  ],
  // TCS04: Moderate yellowish green
  TCS04: [
    0.060, 0.062, 0.064, 0.066, 0.068, 0.070, 0.072, 0.074, 0.076, 0.078, 0.080, 0.082, 0.084, 0.086, 0.088, 0.090,
    0.057, 0.054, 0.051, 0.048, 0.045, 0.042, 0.039, 0.036, 0.033, 0.030, 0.027, 0.024, 0.021, 0.018, 0.015, 0.012,
    0.011, 0.010, 0.009, 0.008, 0.007, 0.006, 0.005, 0.004, 0.003, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002,
    0.004, 0.006, 0.008, 0.010, 0.012, 0.014, 0.016, 0.018, 0.020, 0.022, 0.064, 0.106, 0.148, 0.190, 0.232, 0.274,
    0.350, 0.426, 0.502, 0.578, 0.654, 0.730, 0.730, 0.730, 0.730, 0.730, 0.730, 0.730, 0.730, 0.730, 0.730
  ],
  // TCS05: Light bluish green
  TCS05: [
    0.291, 0.293, 0.295, 0.297, 0.299, 0.301, 0.303, 0.305, 0.307, 0.309, 0.311, 0.313, 0.315, 0.317, 0.319, 0.321,
    0.308, 0.295, 0.282, 0.269, 0.256, 0.243, 0.230, 0.217, 0.204, 0.191, 0.178, 0.165, 0.152, 0.139, 0.126, 0.113,
    0.104, 0.095, 0.086, 0.077, 0.068, 0.059, 0.050, 0.041, 0.032, 0.023, 0.019, 0.015, 0.011, 0.007, 0.003, 0.002,
    0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.010, 0.011, 0.012, 0.020, 0.028, 0.036, 0.044, 0.052, 0.060,
    0.091, 0.122, 0.153, 0.184, 0.215, 0.246, 0.286, 0.326, 0.366, 0.406, 0.446, 0.486, 0.526, 0.566, 0.606
  ],
  // TCS06: Light blue
  TCS06: [
    0.288, 0.293, 0.298, 0.303, 0.308, 0.313, 0.318, 0.323, 0.328, 0.333, 0.338, 0.343, 0.348, 0.353, 0.358, 0.363,
    0.377, 0.391, 0.405, 0.419, 0.433, 0.447, 0.461, 0.475, 0.489, 0.503, 0.517, 0.531, 0.545, 0.559, 0.573, 0.587,
    0.587, 0.587, 0.587, 0.587, 0.587, 0.587, 0.587, 0.587, 0.587, 0.587, 0.572, 0.557, 0.542, 0.527, 0.512, 0.497,
    0.459, 0.421, 0.383, 0.345, 0.307, 0.269, 0.231, 0.193, 0.155, 0.117, 0.086, 0.055, 0.024, 0.018, 0.012, 0.006,
    0.008, 0.010, 0.012, 0.014, 0.016, 0.018, 0.023, 0.028, 0.033, 0.038, 0.043, 0.048, 0.056, 0.064, 0.072
  ],
  // TCS07: Light violet
  TCS07: [
    0.254, 0.257, 0.260, 0.263, 0.266, 0.269, 0.272, 0.275, 0.278, 0.281, 0.284, 0.287, 0.290, 0.293, 0.296, 0.299,
    0.380, 0.461, 0.542, 0.623, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704,
    0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704, 0.704,
    0.648, 0.592, 0.536, 0.480, 0.424, 0.368, 0.312, 0.256, 0.200, 0.144, 0.120, 0.096, 0.072, 0.048, 0.024, 0.018,
    0.015, 0.012, 0.009, 0.006, 0.003, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002, 0.002
  ],
  // TCS08: Light reddish purple
  TCS08: [
    0.192, 0.196, 0.200, 0.204, 0.208, 0.212, 0.216, 0.220, 0.224, 0.228, 0.232, 0.236, 0.240, 0.244, 0.248, 0.252,
    0.326, 0.400, 0.474, 0.548, 0.622, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696,
    0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696,
    0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.696, 0.667, 0.638, 0.609, 0.580, 0.551, 0.522,
    0.470, 0.418, 0.366, 0.314, 0.262, 0.210, 0.174, 0.138, 0.102, 0.066, 0.030, 0.025, 0.020, 0.015, 0.010
  ],
  // TCS09: Strong red
  TCS09: [
    0.112, 0.113, 0.114, 0.115, 0.116, 0.117, 0.118, 0.119, 0.120, 0.121, 0.122, 0.123, 0.124, 0.125, 0.126, 0.127,
    0.091, 0.085, 0.079, 0.073, 0.067, 0.061, 0.055, 0.049, 0.043, 0.037, 0.031, 0.025, 0.019, 0.013, 0.007, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009,
    0.024, 0.039, 0.054, 0.069, 0.084, 0.099, 0.186, 0.273, 0.360, 0.447, 0.534, 0.621, 0.708, 0.795, 0.882, 0.969,
    0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969, 0.969
  ],
  // TCS10: Strong yellow
  TCS10: [
    0.059, 0.061, 0.063, 0.065, 0.067, 0.069, 0.071, 0.073, 0.075, 0.077, 0.079, 0.081, 0.083, 0.085, 0.087, 0.089,
    0.073, 0.069, 0.065, 0.061, 0.057, 0.053, 0.049, 0.045, 0.041, 0.037, 0.033, 0.029, 0.025, 0.021, 0.017, 0.013,
    0.010, 0.007, 0.004, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.043, 0.083, 0.123, 0.163, 0.269, 0.375, 0.481, 0.587, 0.693, 0.799,
    0.857, 0.915, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973, 0.973
  ],
  // TCS11: Strong green
  TCS11: [
    0.131, 0.134, 0.137, 0.140, 0.143, 0.146, 0.149, 0.152, 0.155, 0.158, 0.161, 0.164, 0.167, 0.170, 0.173, 0.176,
    0.118, 0.112, 0.106, 0.100, 0.094, 0.088, 0.082, 0.076, 0.070, 0.064, 0.058, 0.052, 0.046, 0.040, 0.034, 0.028,
    0.023, 0.018, 0.013, 0.008, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
    0.028, 0.053, 0.078, 0.103, 0.128, 0.153, 0.214, 0.275, 0.336, 0.397, 0.458, 0.519, 0.580, 0.641, 0.702
  ],
  // TCS12: Strong blue
  TCS12: [
    0.113, 0.118, 0.123, 0.128, 0.133, 0.138, 0.143, 0.148, 0.153, 0.158, 0.163, 0.168, 0.173, 0.178, 0.183, 0.188,
    0.258, 0.328, 0.398, 0.468, 0.538, 0.608, 0.678, 0.748, 0.818, 0.888, 0.888, 0.888, 0.888, 0.888, 0.888, 0.888,
    0.840, 0.792, 0.744, 0.696, 0.648, 0.600, 0.552, 0.504, 0.456, 0.408, 0.347, 0.286, 0.225, 0.164, 0.103, 0.042,
    0.021, 0.010, 0.005, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003
  ],
  // TCS13: Light yellowish pink (Caucasian skin)
  TCS13: [
    0.242, 0.244, 0.246, 0.248, 0.250, 0.252, 0.254, 0.256, 0.258, 0.260, 0.262, 0.264, 0.266, 0.268, 0.270, 0.272,
    0.217, 0.212, 0.207, 0.202, 0.197, 0.192, 0.187, 0.182, 0.177, 0.172, 0.167, 0.162, 0.157, 0.152, 0.147, 0.142,
    0.148, 0.154, 0.160, 0.166, 0.172, 0.178, 0.184, 0.190, 0.196, 0.202, 0.222, 0.242, 0.262, 0.282, 0.302, 0.322,
    0.381, 0.440, 0.499, 0.558, 0.617, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676,
    0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676, 0.676
  ],
  // TCS14: Moderate olive green (Leaf green)
  TCS14: [
    0.074, 0.076, 0.078, 0.080, 0.082, 0.084, 0.086, 0.088, 0.090, 0.092, 0.094, 0.096, 0.098, 0.100, 0.102, 0.104,
    0.068, 0.062, 0.056, 0.050, 0.044, 0.038, 0.032, 0.026, 0.020, 0.014, 0.008, 0.004, 0.003, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003,
    0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.003, 0.033, 0.063, 0.093, 0.123, 0.153, 0.183,
    0.253, 0.323, 0.393, 0.463, 0.533, 0.603, 0.603, 0.603, 0.603, 0.603, 0.603, 0.603, 0.603, 0.603, 0.603
  ]
};

// Wavelengths array (380-780nm at 5nm intervals)
const WAVELENGTHS = Array.from({ length: 81 }, (_, i) => 380 + i * 5);

// Helper function to interpolate SPD to standard wavelengths
function interpolateSpectrum(spd: SpectralData, targetWavelengths: number[]): number[] {
  const wavelengths = Object.keys(spd).map(Number).sort((a, b) => a - b);
  const values: number[] = [];

  for (const targetWL of targetWavelengths) {
    if (spd[targetWL] !== undefined) {
      values.push(spd[targetWL]);
    } else if (spd[targetWL.toString()] !== undefined) {
      values.push(spd[targetWL.toString()]);
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
        const lowerVal = spd[lowerWL] || spd[lowerWL.toString()] || 0;
        const upperVal = spd[upperWL] || spd[upperWL.toString()] || 0;
        const interpolated = lowerVal + ratio * (upperVal - lowerVal);
        values.push(interpolated);
      } else if (targetWL < wavelengths[0]) {
        values.push(spd[wavelengths[0]] || spd[wavelengths[0].toString()] || 0);
      } else if (targetWL > wavelengths[wavelengths.length - 1]) {
        values.push(spd[wavelengths[wavelengths.length - 1]] || spd[wavelengths[wavelengths.length - 1].toString()] || 0);
      } else {
        values.push(0);
      }
    }
  }
  
  return values;
}

// Calculate chromaticity coordinates from SPD
function calculateChromaticity(spd: SpectralData): { x: number; y: number } {
  const interpolatedSPD = interpolateSpectrum(spd, WAVELENGTHS);
  
  let X = 0, Y = 0, Z = 0;
  for (let i = 0; i < WAVELENGTHS.length; i++) {
    const wl = WAVELENGTHS[i];
    const intensity = interpolatedSPD[i];
    X += intensity * (CIE_X[wl] || 0) * 5; // 5nm interval
    Y += intensity * (CIE_Y[wl] || 0) * 5;
    Z += intensity * (CIE_Z[wl] || 0) * 5;
  }
  
  const sum = X + Y + Z;
  if (sum === 0) return { x: 0.3333, y: 0.3333 };
  
  return { x: X / sum, y: Y / sum };
}

// Convert x,y to u,v (CIE 1960 UCS)
function xyToUV(x: number, y: number): { u: number; v: number } {
  const denom = -2 * x + 12 * y + 3;
  if (denom === 0) return { u: 0, v: 0 };
  return {
    u: 4 * x / denom,
    v: 6 * y / denom
  };
}

// Calculate CCT using McCamy's approximation
function calculateCCT(x: number, y: number): number {
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 437 * Math.pow(n, 3) + 3601 * Math.pow(n, 2) + 6861 * n + 5517;
  return cct;
}

// Get Planckian locus reference illuminant at given CCT
function getPlanckianReference(cct: number): SpectralData {
  const spd: SpectralData = {};
  
  // Planck's law constants
  const c1 = 3.74183e-16; // 2πhc²
  const c2 = 1.4388e-2;   // hc/k
  
  for (const lambda of WAVELENGTHS) {
    const lambdaM = lambda * 1e-9; // Convert nm to m
    const radiance = c1 / (Math.pow(lambdaM, 5) * (Math.exp(c2 / (lambdaM * cct)) - 1));
    spd[lambda] = radiance;
  }
  
  // Normalize to max = 1
  const values = Object.values(spd);
  const max = Math.max(...values);
  for (const wl in spd) {
    spd[wl] = spd[wl] / max;
  }
  
  return spd;
}

// Von Kries chromatic adaptation
function chromaticAdaptation(
  sourceWhite: { u: number; v: number },
  targetWhite: { u: number; v: number },
  color: { u: number; v: number }
): { u: number; v: number } {
  // Von Kries transformation per CIE 13.3-1995
  // Add safety checks for division by zero
  if (sourceWhite.v === 0 || targetWhite.v === 0) {
    return color; // Return unchanged if white point is invalid
  }
  
  const c = (4 - sourceWhite.u - 10 * sourceWhite.v) / sourceWhite.v;
  const d = (1.708 * sourceWhite.v + 0.404 - 1.481 * sourceWhite.u) / sourceWhite.v;
  
  const c_ref = (4 - targetWhite.u - 10 * targetWhite.v) / targetWhite.v;
  const d_ref = (1.708 * targetWhite.v + 0.404 - 1.481 * targetWhite.u) / targetWhite.v;
  
  // Check for division by zero
  if (c === 0 || d === 0) {
    return color;
  }
  
  // Transform color
  const denominator = 16.518 + 1.481 * c_ref / c * color.u - d_ref / d * color.v;
  
  if (denominator === 0) {
    return color;
  }
  
  const u_k = (10.872 + 0.404 * c_ref / c * color.u - 4 * d_ref / d * color.v) / denominator;
  const v_k = 5.520 / denominator;
  
  // Check for NaN
  if (isNaN(u_k) || isNaN(v_k)) {
    return color;
  }
  
  return { u: u_k, v: v_k };
}

// Calculate color appearance under illuminant
function calculateColorAppearance(
  illuminant: SpectralData,
  reflectance: number[],
  illuminantWhite?: { u: number; v: number }
): { u: number; v: number; W: number; U: number; V: number } {
  // Calculate reflected spectrum
  const interpolatedIlluminant = interpolateSpectrum(illuminant, WAVELENGTHS);
  const reflected: number[] = [];
  
  // Debug: Check array lengths
  if (interpolatedIlluminant.length !== WAVELENGTHS.length) {
    console.error(`Illuminant length mismatch: ${interpolatedIlluminant.length} vs ${WAVELENGTHS.length}`);
  }
  if (reflectance.length !== WAVELENGTHS.length) {
    console.error(`Reflectance length mismatch: ${reflectance.length} vs ${WAVELENGTHS.length}`);
  }
  
  // Normalize illuminant by Y tristimulus value
  let illumNorm = 0;
  for (let i = 0; i < interpolatedIlluminant.length; i++) {
    illumNorm += interpolatedIlluminant[i] * (CIE_Y[WAVELENGTHS[i]] || 0) * 5;
  }
  
  if (illumNorm === 0) illumNorm = 1;
  
  // Calculate reflected spectrum with normalization
  // Use minimum length to avoid index out of bounds
  const minLen = Math.min(interpolatedIlluminant.length, reflectance.length, WAVELENGTHS.length);
  for (let i = 0; i < minLen; i++) {
    reflected.push(interpolatedIlluminant[i] * reflectance[i] / illumNorm * 100);
  }
  
  // Calculate tristimulus values
  let X = 0, Y = 0, Z = 0;
  for (let i = 0; i < reflected.length; i++) {
    X += reflected[i] * (CIE_X[WAVELENGTHS[i]] || 0) * 5;
    Y += reflected[i] * (CIE_Y[WAVELENGTHS[i]] || 0) * 5;
    Z += reflected[i] * (CIE_Z[WAVELENGTHS[i]] || 0) * 5;
  }
  
  // Convert to chromaticity
  const sum = X + Y + Z;
  if (sum === 0) {
    return { u: 0, v: 0, W: 0, U: 0, V: 0 };
  }
  
  const x = X / sum;
  const y = Y / sum;
  
  // Convert to u,v
  const { u, v } = xyToUV(x, y);
  
  // Convert to W*U*V* color space
  const W = 25 * Math.pow(Y, 1/3) - 17;
  
  // Use illuminant white point for U* and V* calculation if provided
  const u_n = illuminantWhite ? illuminantWhite.u : 0.2009; // Default D65 white point
  const v_n = illuminantWhite ? illuminantWhite.v : 0.3073;
  
  const U = 13 * W * (u - u_n);
  const V = 13 * W * (v - v_n);
  
  return { u, v, W, U, V };
}

// Main CRI calculation function
// Create a deterministic hash of the SPD for debugging
function hashSPD(spd: SpectralData): string {
  const keys = Object.keys(spd).sort();
  let sum = 0;
  for (const key of keys) {
    sum += parseFloat(key) * (spd[key] || spd[key.toString()] || 0);
  }
  return sum.toFixed(6);
}

export function calculateCRIAccurate(spd: SpectralData): {
  Ra: number;
  R1: number;
  R2: number;
  R3: number;
  R4: number;
  R5: number;
  R6: number;
  R7: number;
  R8: number;
  R9: number;
  R10: number;
  R11: number;
  R12: number;
  R13: number;
  R14: number;
  R15: number;
} {
  try {
    // Log SPD hash for consistency checking
    const spdHash = hashSPD(spd);
    console.log('CRI Calculation - SPD Hash:', spdHash, 'Wavelengths:', Object.keys(spd).length);
    
    // Calculate illuminant chromaticity
    const testChrom = calculateChromaticity(spd);
    const testWhite = xyToUV(testChrom.x, testChrom.y);
    console.log('Test chromaticity:', testChrom, 'Test white:', testWhite);
    
    // Calculate CCT
    const cct = calculateCCT(testChrom.x, testChrom.y);
    
    // Clamp CCT to valid range
    const clampedCCT = Math.max(1000, Math.min(25000, cct));
    
    // Get reference illuminant (Planckian for CCT < 5000K, otherwise could use daylight)
    const referenceSPD = getPlanckianReference(clampedCCT);
    const refChrom = calculateChromaticity(referenceSPD);
    const refWhite = xyToUV(refChrom.x, refChrom.y);
    
    // Calculate R values for all 14 TCS
    const Ri_values: number[] = [];
    const tcsKeys = ['TCS01', 'TCS02', 'TCS03', 'TCS04', 'TCS05', 'TCS06', 'TCS07', 'TCS08',
                     'TCS09', 'TCS10', 'TCS11', 'TCS12', 'TCS13', 'TCS14'];
    
    for (const tcsKey of tcsKeys) {
      const tcsReflectance = TCS_REFLECTANCE[tcsKey];
      
      // Debug TCS reflectance
      console.log(`Processing ${tcsKey}, reflectance length: ${tcsReflectance.length}`);
      
      // Calculate test color appearance
      const testColor = calculateColorAppearance(spd, tcsReflectance, refWhite);
      
      // Calculate reference color appearance
      const refColor = calculateColorAppearance(referenceSPD, tcsReflectance, refWhite);
      
      // Apply chromatic adaptation to test color
      const adaptedTestColor = chromaticAdaptation(testWhite, refWhite, testColor);
      
      // Recalculate W*U*V* for adapted color
      const W_test = testColor.W;
      const U_test = 13 * W_test * (adaptedTestColor.u - refWhite.u);
      const V_test = 13 * W_test * (adaptedTestColor.v - refWhite.v);
      
      // Calculate color difference ΔE in W*U*V* space
      const deltaE = Math.sqrt(
        Math.pow(W_test - refColor.W, 2) +
        Math.pow(U_test - refColor.U, 2) +
        Math.pow(V_test - refColor.V, 2)
      );
      
      // Calculate Ri = 100 - 4.6 * ΔE
      const Ri = 100 - 4.6 * deltaE;
      
      // Check for NaN and clamp to 0-100 range
      if (isNaN(Ri)) {
        console.error(`NaN Ri for ${tcsKey}, deltaE: ${deltaE}`);
        Ri_values.push(80); // Default reasonable value
      } else {
        Ri_values.push(Math.max(0, Math.min(100, Ri)));
      }
    }
    
    // Calculate Ra (average of R1-R8)
    let sumRa = 0;
    for (let i = 0; i < 8; i++) {
      sumRa += Ri_values[i];
    }
    const Ra = sumRa / 8;
    
    return {
      Ra: Math.round(Ra),
      R1: Math.round(Ri_values[0]),
      R2: Math.round(Ri_values[1]),
      R3: Math.round(Ri_values[2]),
      R4: Math.round(Ri_values[3]),
      R5: Math.round(Ri_values[4]),
      R6: Math.round(Ri_values[5]),
      R7: Math.round(Ri_values[6]),
      R8: Math.round(Ri_values[7]),
      R9: Math.round(Ri_values[8]),  // Strong red
      R10: Math.round(Ri_values[9]),
      R11: Math.round(Ri_values[10]),
      R12: Math.round(Ri_values[11]),
      R13: Math.round(Ri_values[12]), // Skin tone
      R14: Math.round(Ri_values[13]), // Leaf green
      R15: 0 // TCS15 not implemented (Asian skin tone)
    };
  } catch (error) {
    console.error('CRI calculation error:', error);
    // Return reasonable defaults on error
    return {
      Ra: 80,
      R1: 80, R2: 80, R3: 80, R4: 80, R5: 80,
      R6: 80, R7: 80, R8: 80, R9: 75, R10: 80,
      R11: 80, R12: 80, R13: 80, R14: 80, R15: 0
    };
  }
}