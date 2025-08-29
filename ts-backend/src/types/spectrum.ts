export interface SpectralData {
  [wavelength: string]: number;
}

export interface SPD {
  id: string;
  name: string;
  data: SpectralData;
}

export interface CRIValues {
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
}

export interface Metrics {
  name: string;
  cct?: number | string;
  duv?: number;
  cri?: number;
  criValues?: CRIValues;
  r9?: number;
  rf?: number;
  rg?: number;
  melanopicRatio?: number;
  melanopicResponse?: number;
  scotopicPhotopicRatio?: number;
  melanopicPhotopicRatio?: number;
  bluePercentage?: number;
  peakWavelength?: number;
  dominantWavelength?: number;
  purity?: number;
  lumens?: number;
}