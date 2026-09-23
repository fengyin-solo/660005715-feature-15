export interface WindowPreset { window: number; level: number; desc: string }
export interface VolumeData {
  volume: number[][][]
  dimensions: [number, number, number]
  mpr: { axial: number[][]; coronal: number[][]; sagittal: number[][] }
  preset: string
  windowPresets: Record<string, WindowPreset>
}

export interface ROIResult {
  label: string; center: number[]; radius: number
  mean: number; std: number; min: number; max: number; voxelCount: number
  histogram: number[]
}

export interface ROIMarker { label: string; center: number[]; radius: number }

export interface ShareSummary {
  id: string; owner: string; createdAt: string
  revoked: boolean; viewers: string[]; roiCount: number
}

export interface SharedContent {
  id: string; owner: string; createdAt: string
  preset: string; window: number; level: number
  viewers: string[]; rois: ROIMarker[]
}