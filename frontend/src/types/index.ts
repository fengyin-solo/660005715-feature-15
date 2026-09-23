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

export interface SharedMarker { label: string; center: number[]; radius: number }

export interface CreateSharePayload {
  owner: string; preset: string; window: number; level: number
  markers: SharedMarker[]; allowed_viewers: string[]; note: string
}

export interface ShareSnapshot {
  token: string; owner: string; created_at: string
  preset: string; window: number; level: number
  markers: SharedMarker[]; note: string; readonly: boolean
}

export interface ShareInfo {
  token: string; owner: string; created_at: string; revoked: boolean
  marker_count: number; allowed_viewers: string[]; note: string
}