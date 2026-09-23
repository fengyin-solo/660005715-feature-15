<template>
  <canvas ref="cvs" width="160" height="160" class="mpr-canvas"></canvas>
  <input type="range" class="slider" :min="0" :max="maxSlice" v-model.number="sliceIdx"/>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useImagingStore } from '../store/imaging'
const props = defineProps<{ plane: 'axial' | 'coronal' | 'sagittal' }>()
const store = useImagingStore()
const cvs = ref<HTMLCanvasElement>()

// 层面索引与store联动：本地滑块拖动与"定位标记"跳转都走这里
const sliceIdx = computed({
  get: () => store.mprSlice[props.plane],
  set: (v: number) => { store.mprSlice[props.plane] = v }
})

const maxSlice = computed(() => {
  const dims = store.volumeData?.dimensions || [64, 64, 64]
  return props.plane === 'axial' ? dims[0]-1 : props.plane === 'coronal' ? dims[1]-1 : dims[2]-1
})

// 从完整体数据提取当前层面（axial=[y][x], coronal=[z][x], sagittal=[z][y]）
function currentSlice(): number[][] | null {
  const vd = store.volumeData
  if (!vd) return null
  const vol = vd.volume
  const i = Math.max(0, Math.min(maxSlice.value, sliceIdx.value))
  if (props.plane === 'axial') return vol[i]
  if (props.plane === 'coronal') return vol.map(zRow => zRow[i])
  return vol.map(zRow => zRow.map(yRow => yRow[i]))
}

// 标记投影到当前平面：返回圆心(平面坐标)与深度(法向坐标)
function project(center: number[]): [number, number, number] {
  if (props.plane === 'axial') return [center[0], center[1], center[2]]
  if (props.plane === 'coronal') return [center[0], center[2], center[1]]
  return [center[1], center[2], center[0]]
}

function draw() {
  const c = cvs.value!; const ctx = c.getContext('2d')!; const W = c.width, H = c.height
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H)

  const sliceData = currentSlice()
  if (!sliceData || !sliceData.length) return

  const wl = store.windowVal, ww = store.levelVal
  const lower = wl - ww / 2, upper = wl + ww / 2

  const rows = sliceData.length, cols = sliceData[0].length
  const cellW = W / cols, cellH = H / rows

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let val = sliceData[y][x]
      let t = (val - lower) / (upper - lower)
      t = Math.max(0, Math.min(1, t))
      const gray = Math.floor(t * 255)
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`
      ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5)
    }
  }

  // 叠加标记投影（标记中心落在当前层±半径范围内时显示）
  for (const m of store.overlayMarkers) {
    const [cx, cy, depth] = project(m.center)
    if (Math.abs(depth - sliceIdx.value) > m.radius) continue
    const x = (cx + 0.5) * cellW, y = (cy + 0.5) * cellH
    const r = Math.max(3, m.radius * cellW)
    ctx.strokeStyle = '#f0883e'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y)
    ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4)
    ctx.stroke()
    ctx.fillStyle = '#f0883e'; ctx.font = '9px monospace'
    ctx.fillText(m.label, Math.min(x + r + 2, W - 30), Math.max(y, 9))
  }
}

watch(() => [store.volumeData, store.windowVal, store.levelVal, store.mprSlice, store.overlayMarkers], draw, { deep: true })
onMounted(draw)
</script>

<style scoped>
.mpr-canvas { display: block; width: 100%; aspect-ratio: 1; border-radius: 4px; }
.slider { width: 100%; margin: 4px 0; accent-color: #58a6ff; height: 4px; }
</style>
