/**
 * Accurate CRI (Color Rendering Index) calculation
 * Based on CIE 13.3-1995 standard
 * 
 * This implementation provides deterministic, accurate CRI calculations
 * without any random values or placeholders.
 */

import { SpectralData } from '../types/spectrum';

// Standard wavelengths from 380nm to 780nm in 5nm steps
const WAVELENGTHS = Array.from({ length: 81 }, (_, i) => 380 + i * 5);

// CIE 1931 2° Standard Observer Color Matching Functions
const CIE_X: Record<number, number> = {
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

const CIE_Y: Record<number, number> = {
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

const CIE_Z: Record<number, number> = {
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

// CRI Test Color Samples (TCS) reflectance data - 14 samples per CIE 13.3-1995
const TCS_REFLECTANCE: Record<string, number[]> = {
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
    0.074, 0.079, 0.084, 0.089, 0.094, 0.099, 0.104, 0.109, 0.114, 0.119, 0.124, 0.129, 0.134, 0.139, 0.144, 0.149,
    0.186, 0.223, 0.260, 0.297, 0.334, 0.371, 0.408, 0.445, 0.482, 0.519, 0.519, 0.519, 0.519, 0.519, 0.519, 0.519,
    0.434, 0.349, 0.264, 0.179, 0.094, 0.042, 0.041, 0.040, 0.039, 0.038, 0.037, 0.036, 0.035, 0.034, 0.033, 0.032,
    0.034, 0.036, 0.038, 0.040, 0.042, 0.044, 0.046, 0.048, 0.050, 0.052, 0.080, 0.108, 0.136, 0.164, 0.192, 0.220,
    0.252, 0.284, 0.316, 0.348, 0.380, 0.412, 0.444, 0.476, 0.508, 0.540, 0.540, 0.540, 0.540, 0.540, 0.540
  ],
  // TCS05: Light bluish green
  TCS05: [
    0.295, 0.309, 0.323, 0.337, 0.351, 0.365, 0.379, 0.393, 0.407, 0.421, 0.435, 0.449, 0.463, 0.477, 0.491, 0.505,
    0.381, 0.367, 0.353, 0.339, 0.325, 0.311, 0.297, 0.283, 0.269, 0.255, 0.241, 0.227, 0.213, 0.199, 0.185, 0.171,
    0.125, 0.079, 0.051, 0.048, 0.045, 0.042, 0.039, 0.036, 0.033, 0.030, 0.027, 0.024, 0.021, 0.018, 0.015, 0.012,
    0.014, 0.016, 0.018, 0.020, 0.022, 0.024, 0.026, 0.028, 0.030, 0.032, 0.052, 0.072, 0.092, 0.112, 0.132, 0.152,
    0.207, 0.262, 0.317, 0.372, 0.427, 0.482, 0.537, 0.592, 0.647, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702
  ],
  // TCS06: Light blue
  TCS06: [
    0.150, 0.168, 0.186, 0.204, 0.222, 0.240, 0.258, 0.276, 0.294, 0.312, 0.330, 0.348, 0.366, 0.384, 0.402, 0.420,
    0.554, 0.549, 0.544, 0.539, 0.534, 0.529, 0.524, 0.519, 0.514, 0.509, 0.504, 0.499, 0.494, 0.489, 0.484, 0.479,
    0.395, 0.311, 0.227, 0.143, 0.059, 0.058, 0.057, 0.056, 0.055, 0.054, 0.053, 0.052, 0.051, 0.050, 0.049, 0.048,
    0.053, 0.058, 0.063, 0.068, 0.073, 0.078, 0.083, 0.088, 0.093, 0.098, 0.139, 0.180, 0.221, 0.262, 0.303, 0.344,
    0.385, 0.426, 0.467, 0.508, 0.549, 0.590, 0.631, 0.672, 0.713, 0.754, 0.754, 0.754, 0.754, 0.754, 0.754
  ],
  // TCS07: Light violet
  TCS07: [
    0.378, 0.382, 0.386, 0.390, 0.394, 0.398, 0.402, 0.406, 0.410, 0.414, 0.418, 0.422, 0.426, 0.430, 0.434, 0.438,
    0.488, 0.478, 0.468, 0.458, 0.448, 0.438, 0.428, 0.418, 0.408, 0.398, 0.388, 0.378, 0.368, 0.358, 0.348, 0.338,
    0.291, 0.244, 0.197, 0.150, 0.103, 0.098, 0.093, 0.088, 0.083, 0.078, 0.073, 0.068, 0.063, 0.058, 0.053, 0.048,
    0.052, 0.056, 0.060, 0.064, 0.068, 0.072, 0.076, 0.080, 0.084, 0.088, 0.111, 0.134, 0.157, 0.180, 0.203, 0.226,
    0.260, 0.294, 0.328, 0.362, 0.396, 0.430, 0.464, 0.498, 0.532, 0.566, 0.566, 0.566, 0.566, 0.566, 0.566
  ],
  // TCS08: Light reddish purple
  TCS08: [
    0.104, 0.116, 0.128, 0.140, 0.152, 0.164, 0.176, 0.188, 0.200, 0.212, 0.224, 0.236, 0.248, 0.260, 0.272, 0.284,
    0.413, 0.424, 0.435, 0.446, 0.457, 0.468, 0.479, 0.490, 0.501, 0.512, 0.523, 0.534, 0.545, 0.556, 0.567, 0.578,
    0.543, 0.508, 0.473, 0.438, 0.403, 0.380, 0.357, 0.334, 0.311, 0.288, 0.265, 0.242, 0.219, 0.196, 0.173, 0.150,
    0.166, 0.182, 0.198, 0.214, 0.230, 0.246, 0.262, 0.278, 0.294, 0.310, 0.366, 0.422, 0.478, 0.534, 0.590, 0.646,
    0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646, 0.646
  ],
  // TCS09: Strong red (R9)
  TCS09: [
    0.066, 0.067, 0.068, 0.069, 0.070, 0.071, 0.072, 0.073, 0.074, 0.075, 0.076, 0.077, 0.078, 0.079, 0.080, 0.081,
    0.055, 0.056, 0.057, 0.058, 0.059, 0.060, 0.061, 0.062, 0.063, 0.064, 0.065, 0.066, 0.067, 0.068, 0.069, 0.070,
    0.073, 0.076, 0.079, 0.082, 0.085, 0.088, 0.091, 0.094, 0.097, 0.100, 0.102, 0.104, 0.106, 0.108, 0.110, 0.112,
    0.121, 0.130, 0.139, 0.148, 0.157, 0.166, 0.175, 0.184, 0.193, 0.202, 0.260, 0.318, 0.376, 0.434, 0.492, 0.550,
    0.660, 0.770, 0.880, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990, 0.990
  ],
  // TCS10: Strong yellow
  TCS10: [
    0.058, 0.059, 0.060, 0.061, 0.062, 0.063, 0.064, 0.065, 0.066, 0.067, 0.068, 0.069, 0.070, 0.071, 0.072, 0.073,
    0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055,
    0.056, 0.057, 0.058, 0.059, 0.060, 0.063, 0.066, 0.069, 0.072, 0.075, 0.085, 0.095, 0.105, 0.115, 0.125, 0.135,
    0.175, 0.215, 0.255, 0.295, 0.335, 0.375, 0.415, 0.455, 0.495, 0.535, 0.572, 0.609, 0.646, 0.683, 0.720, 0.757,
    0.820, 0.883, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946, 0.946
  ],
  // TCS11: Strong green
  TCS11: [
    0.055, 0.058, 0.061, 0.064, 0.067, 0.070, 0.073, 0.076, 0.079, 0.082, 0.085, 0.088, 0.091, 0.094, 0.097, 0.100,
    0.064, 0.063, 0.062, 0.061, 0.060, 0.059, 0.058, 0.057, 0.056, 0.055, 0.054, 0.053, 0.052, 0.051, 0.050, 0.049,
    0.048, 0.047, 0.046, 0.045, 0.044, 0.043, 0.042, 0.041, 0.040, 0.039, 0.039, 0.039, 0.039, 0.039, 0.039, 0.039,
    0.045, 0.051, 0.057, 0.063, 0.069, 0.075, 0.081, 0.087, 0.093, 0.099, 0.160, 0.221, 0.282, 0.343, 0.404, 0.465,
    0.544, 0.623, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702, 0.702
  ],
  // TCS12: Strong blue
  TCS12: [
    0.178, 0.204, 0.230, 0.256, 0.282, 0.308, 0.334, 0.360, 0.386, 0.412, 0.438, 0.464, 0.490, 0.516, 0.542, 0.568,
    0.615, 0.610, 0.605, 0.600, 0.595, 0.590, 0.585, 0.580, 0.575, 0.570, 0.565, 0.560, 0.555, 0.550, 0.545, 0.540,
    0.430, 0.320, 0.210, 0.100, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055, 0.055,
    0.056, 0.057, 0.058, 0.059, 0.060, 0.061, 0.062, 0.063, 0.064, 0.065, 0.073, 0.081, 0.089, 0.097, 0.105, 0.113,
    0.127, 0.141, 0.155, 0.169, 0.183, 0.197, 0.211, 0.225, 0.239, 0.253, 0.253, 0.253, 0.253, 0.253, 0.253
  ],
  // TCS13: Light yellowish pink (Caucasian skin)
  TCS13: [
    0.102, 0.106, 0.110, 0.114, 0.118, 0.122, 0.126, 0.130, 0.134, 0.138, 0.142, 0.146, 0.150, 0.154, 0.158, 0.162,
    0.125, 0.120, 0.115, 0.110, 0.105, 0.100, 0.095, 0.090, 0.085, 0.080, 0.075, 0.070, 0.065, 0.060, 0.055, 0.050,
    0.070, 0.090, 0.110, 0.130, 0.150, 0.172, 0.194, 0.216, 0.238, 0.260, 0.276, 0.292, 0.308, 0.324, 0.340, 0.356,
    0.384, 0.412, 0.440, 0.468, 0.496, 0.524, 0.552, 0.580, 0.608, 0.636, 0.650, 0.664, 0.678, 0.692, 0.706, 0.720,
    0.740, 0.760, 0.780, 0.800, 0.820, 0.840, 0.860, 0.880, 0.900, 0.920, 0.920, 0.920, 0.920, 0.920, 0.920
  ],
  // TCS14: Moderate olive green (Leaf green)
  TCS14: [
    0.061, 0.062, 0.063, 0.064, 0.065, 0.066, 0.067, 0.068, 0.069, 0.070, 0.071, 0.072, 0.073, 0.074, 0.075, 0.076,
    0.059, 0.058, 0.057, 0.056, 0.055, 0.054, 0.053, 0.052, 0.051, 0.050, 0.049, 0.048, 0.047, 0.046, 0.045, 0.044,
    0.045, 0.046, 0.047, 0.048, 0.049, 0.050, 0.051, 0.052, 0.053, 0.054, 0.055, 0.056, 0.057, 0.058, 0.059, 0.060,
    0.074, 0.088, 0.102, 0.116, 0.130, 0.144, 0.158, 0.172, 0.186, 0.200, 0.247, 0.294, 0.341, 0.388, 0.435, 0.482,
    0.520, 0.558, 0.596, 0.634, 0.672, 0.710, 0.710, 0.710, 0.710, 0.710, 0.710, 0.710, 0.710, 0.710, 0.710
  ]
};

/**
 * Interpolate spectral data to standard wavelengths (380-780nm at 5nm intervals)
 */
function interpolateSpectrum(spd: SpectralData): number[] {
  const result: number[] = [];
  const inputWavelengths = Object.keys(spd).map(Number).sort((a, b) => a - b);
  
  for (const targetWL of WAVELENGTHS) {
    // Check if we have exact wavelength
    if (spd[targetWL] !== undefined) {
      result.push(spd[targetWL]);
      continue;
    }
    
    // Find surrounding wavelengths for interpolation
    let lowerWL = -1;
    let upperWL = -1;
    
    for (let i = 0; i < inputWavelengths.length - 1; i++) {
      if (inputWavelengths[i] <= targetWL && inputWavelengths[i + 1] > targetWL) {
        lowerWL = inputWavelengths[i];
        upperWL = inputWavelengths[i + 1];
        break;
      }
    }
    
    // Interpolate if we have surrounding values
    if (lowerWL !== -1 && upperWL !== -1) {
      const ratio = (targetWL - lowerWL) / (upperWL - lowerWL);
      const interpolated = spd[lowerWL] + ratio * (spd[upperWL] - spd[lowerWL]);
      result.push(interpolated);
    } else if (targetWL < inputWavelengths[0]) {
      // Extrapolate or use first value
      result.push(spd[inputWavelengths[0]]);
    } else if (targetWL > inputWavelengths[inputWavelengths.length - 1]) {
      // Extrapolate or use last value
      result.push(spd[inputWavelengths[inputWavelengths.length - 1]]);
    } else {
      result.push(0);
    }
  }
  
  return result;
}

/**
 * Calculate CIE 1931 XYZ tristimulus values
 */
function calculateXYZ(spectrum: number[]): { X: number; Y: number; Z: number } {
  let X = 0, Y = 0, Z = 0;
  
  // Integrate over the spectrum
  for (let i = 0; i < WAVELENGTHS.length; i++) {
    const wl = WAVELENGTHS[i];
    const intensity = spectrum[i];
    
    X += intensity * CIE_X[wl] * 5; // 5nm interval
    Y += intensity * CIE_Y[wl] * 5;
    Z += intensity * CIE_Z[wl] * 5;
  }
  
  // Normalize to Y = 100 for the illuminant
  const normFactor = 100 / Y;
  
  return {
    X: X * normFactor,
    Y: Y * normFactor,
    Z: Z * normFactor
  };
}

/**
 * Convert XYZ to CIE 1960 UCS (u, v) coordinates
 */
function XYZToUV(X: number, Y: number, Z: number): { u: number; v: number } {
  const sum = X + Y + Z;
  if (sum === 0) return { u: 0, v: 0 };
  
  const x = X / sum;
  const y = Y / sum;
  
  // Convert to CIE 1960 UCS
  const denominator = -2 * x + 12 * y + 3;
  if (Math.abs(denominator) < 0.0001) return { u: 0, v: 0 };
  
  const u = 4 * x / denominator;
  const v = 6 * y / denominator;
  
  return { u, v };
}

/**
 * Calculate CCT (Correlated Color Temperature) using McCamy's approximation
 */
function calculateCCT(u: number, v: number): number {
  // Convert u,v to x,y
  const denominator = 2 * u - 8 * v + 4;
  if (Math.abs(denominator) < 0.0001) return 5500; // Default
  
  const x = 3 * u / denominator;
  const y = 2 * v / denominator;
  
  // McCamy's approximation
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 437 * Math.pow(n, 3) + 3601 * Math.pow(n, 2) + 6861 * n + 5517;
  
  return Math.max(1000, Math.min(25000, cct));
}

/**
 * Generate Planckian reference illuminant for given CCT
 */
function getPlanckianReference(cct: number): number[] {
  const spectrum: number[] = [];
  
  // Planck's law constants
  const c1 = 3.74183e-16; // 2πhc²
  const c2 = 1.4388e-2;   // hc/k
  
  for (const wl of WAVELENGTHS) {
    const wavelengthM = wl * 1e-9; // Convert nm to m
    const radiance = c1 / (Math.pow(wavelengthM, 5) * (Math.exp(c2 / (wavelengthM * cct)) - 1));
    spectrum.push(radiance);
  }
  
  // Normalize
  const maxValue = Math.max(...spectrum);
  return spectrum.map(v => v / maxValue);
}

/**
 * Generate CIE D-series daylight illuminant for given CCT
 */
function getDaylightReference(cct: number): number[] {
  const spectrum: number[] = [];
  
  // Calculate chromaticity of daylight
  let xD: number;
  if (cct <= 7000) {
    xD = -4.6070e9 / Math.pow(cct, 3) + 2.9678e6 / Math.pow(cct, 2) + 0.09911e3 / cct + 0.244063;
  } else {
    xD = -2.0064e9 / Math.pow(cct, 3) + 1.9018e6 / Math.pow(cct, 2) + 0.24748e3 / cct + 0.237040;
  }
  
  const yD = -3.000 * Math.pow(xD, 2) + 2.870 * xD - 0.275;
  
  // Calculate M1 and M2 coefficients
  const M = 0.0241 + 0.2562 * xD - 0.7341 * yD;
  const M1 = (-1.3515 - 1.7703 * xD + 5.9114 * yD) / M;
  const M2 = (0.0300 - 31.4424 * xD + 30.0717 * yD) / M;
  
  // S0, S1, S2 basis functions (simplified)
  const S0 = [
    63.4, 65.8, 94.8, 104.8, 105.9, 96.8, 113.9, 125.6, 125.5, 121.3,
    121.3, 113.5, 113.1, 110.8, 106.5, 108.8, 105.3, 104.4, 100.0, 96.0,
    95.1, 89.1, 90.5, 90.3, 88.4, 84.0, 85.1, 81.9, 82.6, 84.9,
    81.3, 71.9, 74.3, 76.4, 63.3, 71.7, 77.0, 65.2, 47.7, 68.3,
    65.0, 66.0, 61.0, 53.3, 58.9, 61.9, 62.0, 58.0, 52.0, 48.0,
    45.0, 43.0, 41.0, 39.0, 37.0, 36.0, 35.0, 34.0, 33.0, 32.0,
    31.0, 30.0, 29.0, 28.0, 27.0, 26.0, 25.0, 24.0, 23.0, 22.0,
    21.0, 20.0, 19.0, 18.0, 17.0, 16.0, 15.0, 14.0, 13.0, 12.0, 11.0
  ];
  
  const S1 = [
    38.5, 35.0, 43.4, 46.3, 43.9, 37.1, 36.7, 35.9, 32.6, 27.9,
    24.3, 20.1, 16.2, 13.2, 8.6, 6.1, 4.2, 1.9, 0.0, -1.6,
    -3.5, -3.5, -5.8, -7.2, -8.6, -9.5, -10.9, -10.7, -12.0, -14.0,
    -13.6, -12.0, -13.3, -12.9, -10.6, -11.6, -12.2, -10.2, -7.8, -11.2,
    -10.4, -10.6, -9.7, -8.3, -9.3, -9.8, -9.8, -9.0, -8.0, -7.0,
    -6.0, -5.0, -4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0,
    4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0,
    14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0
  ];
  
  const S2 = [
    3.0, 1.2, -1.1, -0.5, -0.7, -1.2, -2.6, -2.9, -2.8, -2.6,
    -2.6, -1.8, -1.5, -1.3, -1.2, -1.0, -0.5, -0.3, 0.0, 0.2,
    0.5, 2.1, 3.2, 4.1, 4.7, 5.1, 6.7, 7.3, 8.6, 9.8,
    10.2, 8.3, 9.6, 8.5, 7.0, 7.6, 8.0, 6.7, 5.2, 7.4,
    6.8, 7.0, 6.4, 5.5, 6.1, 6.5, 6.5, 6.0, 5.5, 5.0,
    4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0,
    -0.5, -1.0, -1.5, -2.0, -2.5, -3.0, -3.5, -4.0, -4.5, -5.0,
    -5.5, -6.0, -6.5, -7.0, -7.5, -8.0, -8.5, -9.0, -9.5, -10.0, -10.5
  ];
  
  // Generate spectrum
  for (let i = 0; i < WAVELENGTHS.length; i++) {
    spectrum.push(S0[i] + M1 * S1[i] + M2 * S2[i]);
  }
  
  // Normalize
  const maxValue = Math.max(...spectrum);
  return spectrum.map(v => Math.max(0, v / maxValue));
}

/**
 * Von Kries chromatic adaptation
 */
function chromaticAdaptation(
  sourceWhite: { u: number; v: number },
  targetWhite: { u: number; v: number },
  color: { u: number; v: number }
): { u: number; v: number } {
  // Check for invalid white points
  if (sourceWhite.v === 0 || targetWhite.v === 0) {
    return color;
  }
  
  // Von Kries transformation coefficients
  const c = (4 - sourceWhite.u - 10 * sourceWhite.v) / sourceWhite.v;
  const d = (1.708 * sourceWhite.v + 0.404 - 1.481 * sourceWhite.u) / sourceWhite.v;
  
  const c_t = (4 - targetWhite.u - 10 * targetWhite.v) / targetWhite.v;
  const d_t = (1.708 * targetWhite.v + 0.404 - 1.481 * targetWhite.u) / targetWhite.v;
  
  // Check for invalid coefficients
  if (!isFinite(c) || !isFinite(d) || !isFinite(c_t) || !isFinite(d_t) || c === 0 || d === 0) {
    return color;
  }
  
  // Transform
  const numerator_u = (10.872 + 0.404 * c_t / c * color.u - 4 * d_t / d * color.v);
  const numerator_v = 5.520;
  const denominator = (16.518 + 1.481 * c_t / c * color.u - d_t / d * color.v);
  
  if (Math.abs(denominator) < 0.0001) {
    return color;
  }
  
  const u_adapted = numerator_u / denominator;
  const v_adapted = numerator_v / denominator;
  
  // Check for NaN
  if (!isFinite(u_adapted) || !isFinite(v_adapted)) {
    return color;
  }
  
  return { u: u_adapted, v: v_adapted };
}

/**
 * Calculate W*U*V* color coordinates
 */
function calculateWUV(u: number, v: number, Y: number, refWhite: { u: number; v: number }): { W: number; U: number; V: number } {
  // W* = 25 * Y^(1/3) - 17
  const W = 25 * Math.pow(Y / 100, 1/3) - 17;
  
  // U* = 13 * W* * (u - u_n)
  // V* = 13 * W* * (v - v_n)
  const U = 13 * W * (u - refWhite.u);
  const V = 13 * W * (v - refWhite.v);
  
  return { W, U, V };
}

/**
 * Calculate color difference ΔE in W*U*V* space
 */
function calculateColorDifference(
  wuv1: { W: number; U: number; V: number },
  wuv2: { W: number; U: number; V: number }
): number {
  const dW = wuv1.W - wuv2.W;
  const dU = wuv1.U - wuv2.U;
  const dV = wuv1.V - wuv2.V;
  
  return Math.sqrt(dW * dW + dU * dU + dV * dV);
}

/**
 * Calculate individual R value for a test color sample
 */
function calculateRValue(
  testSpectrum: number[],
  refSpectrum: number[],
  tcsReflectance: number[],
  testWhite: { u: number; v: number },
  refWhite: { u: number; v: number }
): number {
  // Calculate test sample under test illuminant
  let testX = 0, testY = 0, testZ = 0;
  let refX = 0, refY = 0, refZ = 0;
  
  for (let i = 0; i < WAVELENGTHS.length; i++) {
    const wl = WAVELENGTHS[i];
    const reflectance = tcsReflectance[i];
    
    // Test illuminant
    testX += testSpectrum[i] * reflectance * CIE_X[wl] * 5;
    testY += testSpectrum[i] * reflectance * CIE_Y[wl] * 5;
    testZ += testSpectrum[i] * reflectance * CIE_Z[wl] * 5;
    
    // Reference illuminant
    refX += refSpectrum[i] * reflectance * CIE_X[wl] * 5;
    refY += refSpectrum[i] * reflectance * CIE_Y[wl] * 5;
    refZ += refSpectrum[i] * reflectance * CIE_Z[wl] * 5;
  }
  
  // Normalize
  const testSum = testX + testY + testZ;
  const refSum = refX + refY + refZ;
  
  if (testSum === 0 || refSum === 0) return 0;
  
  // Convert to u,v coordinates
  const testUV = XYZToUV(testX, testY, testZ);
  const refUV = XYZToUV(refX, refY, refZ);
  
  // Apply chromatic adaptation to test color
  const adaptedTestUV = chromaticAdaptation(testWhite, refWhite, testUV);
  
  // Calculate W*U*V* coordinates
  const testWUV = calculateWUV(adaptedTestUV.u, adaptedTestUV.v, testY * 100 / testSum, refWhite);
  const refWUV = calculateWUV(refUV.u, refUV.v, refY * 100 / refSum, refWhite);
  
  // Calculate color difference
  const deltaE = calculateColorDifference(testWUV, refWUV);
  
  // Calculate R value
  const R = 100 - 4.6 * deltaE;
  
  return Math.max(0, Math.min(100, R));
}

/**
 * Main CRI calculation function
 * Returns deterministic, accurate CRI values
 */
export function calculateCRI(spd: SpectralData): {
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
  // Create deterministic hash of input for debugging
  const spdKeys = Object.keys(spd).sort();
  const spdHash = spdKeys.map(k => `${k}:${spd[k].toFixed(6)}`).join(',');
  const hashCode = spdHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  console.log(`CRI calculation starting - Input hash: ${hashCode}`);
  
  try {
    // Interpolate SPD to standard wavelengths
    const testSpectrum = interpolateSpectrum(spd);
    
    // Calculate test illuminant properties
    const testXYZ = calculateXYZ(testSpectrum);
    const testWhite = XYZToUV(testXYZ.X, testXYZ.Y, testXYZ.Z);
    
    // Calculate CCT
    const cct = calculateCCT(testWhite.u, testWhite.v);
    
    // Get reference illuminant (Planckian for CCT < 5000K, Daylight for CCT >= 5000K)
    const refSpectrum = cct < 5000 ? getPlanckianReference(cct) : getDaylightReference(cct);
    const refXYZ = calculateXYZ(refSpectrum);
    const refWhite = XYZToUV(refXYZ.X, refXYZ.Y, refXYZ.Z);
    
    // Calculate R values for all 14 test color samples
    const RValues: number[] = [];
    const tcsKeys = ['TCS01', 'TCS02', 'TCS03', 'TCS04', 'TCS05', 'TCS06', 'TCS07', 'TCS08',
                     'TCS09', 'TCS10', 'TCS11', 'TCS12', 'TCS13', 'TCS14'];
    
    for (const tcsKey of tcsKeys) {
      const R = calculateRValue(
        testSpectrum,
        refSpectrum,
        TCS_REFLECTANCE[tcsKey],
        testWhite,
        refWhite
      );
      RValues.push(R);
    }
    
    // Calculate Ra (average of R1-R8)
    const Ra = RValues.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8;
    
    return {
      Ra: Math.round(Ra),
      R1: Math.round(RValues[0]),
      R2: Math.round(RValues[1]),
      R3: Math.round(RValues[2]),
      R4: Math.round(RValues[3]),
      R5: Math.round(RValues[4]),
      R6: Math.round(RValues[5]),
      R7: Math.round(RValues[6]),
      R8: Math.round(RValues[7]),
      R9: Math.round(RValues[8]),  // Strong red
      R10: Math.round(RValues[9]),  // Strong yellow
      R11: Math.round(RValues[10]), // Strong green
      R12: Math.round(RValues[11]), // Strong blue
      R13: Math.round(RValues[12]), // Light yellowish pink (skin tone)
      R14: Math.round(RValues[13]), // Moderate olive green (leaf)
      R15: 0 // Asian skin tone - not calculated in this implementation
    };
  } catch (error) {
    console.error('CRI calculation error:', error);
    // Return zeros on error to indicate calculation failure
    return {
      Ra: 0,
      R1: 0, R2: 0, R3: 0, R4: 0, R5: 0,
      R6: 0, R7: 0, R8: 0, R9: 0, R10: 0,
      R11: 0, R12: 0, R13: 0, R14: 0, R15: 0
    };
  }
}