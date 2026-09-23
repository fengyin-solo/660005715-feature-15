import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { VolumeData, ROIResult, WindowPreset, SharedMarker, ShareSnapshot, ShareInfo, CreateSharePayload } from '@/types'

export const useImagingStore = defineStore('imaging', () => {
  const loading = ref(false)
  const volumeData = ref<VolumeData | null>(null)
  const preset = ref('brain')
  const windowVal = ref(80)
  const levelVal = ref(40)
  const roiResults = ref<ROIResult[]>([])
  const mprSlice = ref({ axial: 32, coronal: 32, sagittal: 32 })

  // 只读共享模式：查看他人共享的标记快照时，标记与测量参数锁定
  const readonly = ref(false)
  const shareMeta = ref<ShareSnapshot | null>(null)
  const myShares = ref<ShareInfo[]>([])

  // 叠加在MPR上的标记：共享模式=共享快照标记，本地模式=已分析的ROI
  const overlayMarkers = computed<SharedMarker[]>(() =>
    shareMeta.value
      ? shareMeta.value.markers
      : roiResults.value.map(r => ({ label: r.label, center: r.center, radius: r.radius }))
  )

  async function loadVolume() {
    loading.value = true
    try {
      const { data } = await axios.post('/api/volume', {
        preset: preset.value, width: 64, height: 64, depth: 64
      })
      volumeData.value = data
      mprSlice.value = { axial: 32, coronal: 32, sagittal: 32 }
    } finally { loading.value = false }
  }

  async function analyzeROI(rois: any[]) {
    loading.value = true
    try {
      const { data } = await axios.post('/api/roi', { volume: volumeData.value?.volume, rois })
      roiResults.value = data.rois
    } finally { loading.value = false }
  }

  function applyWindow(w: number, l: number) { windowVal.value = w; levelVal.value = l }

  // 定位标记：MPR三视图跳转到标记中心所在层面
  function locateMarker(center: number[]) {
    mprSlice.value = {
      axial: Math.round(center[2]),
      coronal: Math.round(center[1]),
      sagittal: Math.round(center[0])
    }
  }

  async function createShare(payload: CreateSharePayload): Promise<string> {
    const { data } = await axios.post('/api/shares', payload)
    return data.token as string
  }

  async function fetchShare(token: string, viewer: string): Promise<ShareSnapshot> {
    const { data } = await axios.get(`/api/shares/${token}`, { params: { viewer } })
    shareMeta.value = data
    readonly.value = true
    return data
  }

  async function listShares(owner: string) {
    const { data } = await axios.get('/api/shares', { params: { owner } })
    myShares.value = data.shares
  }

  async function revokeShare(token: string, owner: string) {
    await axios.post(`/api/shares/${token}/revoke`, null, { params: { owner } })
    await listShares(owner)
  }

  return { loading, volumeData, preset, windowVal, levelVal, roiResults, mprSlice,
    readonly, shareMeta, myShares, overlayMarkers,
    loadVolume, analyzeROI, applyWindow, locateMarker,
    createShare, fetchShare, listShares, revokeShare }
})
