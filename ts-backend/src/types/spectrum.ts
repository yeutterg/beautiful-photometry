export interface SpectralData {
  [wavelength: string]: number;
}

export interface SPD {
  id: string;
  name: string;
  data: SpectralData;
}

export interface Metrics {
  name: string;
  cct?: number | string;
  duv?: number;
  cri?: number;
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