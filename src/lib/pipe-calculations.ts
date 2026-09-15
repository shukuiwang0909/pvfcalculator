/**
 * Pipe weight calculation engine.
 *
 * Formula: W = (OD - t) × t × 0.02466 × L (kg/m for steel)
 * Where:
 *   OD = outside diameter (mm)
 *   t  = wall thickness (mm)
 *   L  = length (m)
 *   0.02466 = π × 7.85 / 1000 (for steel density 7850 kg/m³)
 *
 * For other materials, multiply by density ratio.
 */

import { getPipeNps, getWallThickness } from '../data/pipe-dimensions';

const PI = Math.PI;
const STEEL_DENSITY = 7850; // kg/m³

export interface PipeResult {
  valid: boolean;
  nps: number;
  npsLabel: string;
  scheduleId: string;
  scheduleLabel: string;
  od: number;
  wallThickness: number;
  id: number; // inside diameter mm
  lengthM: number;
  density: number;
  weightPerMeter: number; // kg/m
  totalWeight: number; // kg
  totalWeightLb: number; // lb
  volumeM3: number; // m³
}

export function computePipeWeight(
  nps: number,
  scheduleId: string,
  lengthM: number,
  density: number
): PipeResult {
  const empty: PipeResult = {
    valid: false,
    nps,
    npsLabel: '',
    scheduleId,
    scheduleLabel: '',
    od: 0,
    wallThickness: 0,
    id: 0,
    lengthM,
    density,
    weightPerMeter: 0,
    totalWeight: 0,
    totalWeightLb: 0,
    volumeM3: 0,
  };

  const pipe = getPipeNps(nps);
  if (!pipe) return empty;

  const t = getWallThickness(nps, scheduleId);
  if (t <= 0) return empty;

  const od = pipe.od;
  const id = od - 2 * t;
  
  // Cross-sectional area of metal (mm²)
  const areaMm2 = (PI / 4) * (od * od - id * id);
  
  // Volume per meter (mm³/m → m³/m)
  const volumePerM = areaMm2 * 1000; // mm³ per meter
  const volumeM3PerM = volumePerM * 1e-9; // m³ per meter
  
  // Weight per meter (kg/m)
  const densityRatio = density / STEEL_DENSITY;
  const weightPerMeter = volumeM3PerM * density;
  
  // Total weight
  const totalWeight = weightPerMeter * lengthM;
  const totalWeightLb = totalWeight * 2.20462;
  
  // Total volume
  const volumeM3 = volumeM3PerM * lengthM;

  const schedule = pipe.schedules.find(s => s.id === scheduleId);

  return {
    valid: true,
    nps,
    npsLabel: pipe.label,
    scheduleId,
    scheduleLabel: schedule ? schedule.label : scheduleId,
    od,
    wallThickness: t,
    id,
    lengthM,
    density,
    weightPerMeter: Math.round(weightPerMeter * 1000) / 1000,
    totalWeight: Math.round(totalWeight * 100) / 100,
    totalWeightLb: Math.round(totalWeightLb * 100) / 100,
    volumeM3: Math.round(volumeM3 * 1e6) / 1e6,
  };
}

/** Calculate weight per meter for display purposes */
export function weightPerMeterKg(od: number, t: number, density: number): number {
  const id = od - 2 * t;
  const areaMm2 = (PI / 4) * (od * od - id * id);
  const volumeM3PerM = areaMm2 * 1000 * 1e-9;
  return Math.round(volumeM3PerM * density * 1000) / 1000;
}
