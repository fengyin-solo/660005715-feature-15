<template>
  <div class="shared-root">
    <header class="top-bar">
      <h1>🩻 共享标记查看 <span class="ro-badge">只读</span></h1>
      <div v-if="content" class="share-meta">
        <span>来源：<b>{{ content.owner }}</b></span>
        <span>共享时间：<b>{{ formatTime(content.createdAt) }}</b></span>
      </div>
    </header>

    <!-- 身份确认：只有名单内的人能看到标记细节 -->
    <div v-if="stage === 'identify'" class="center-box">
      <div class="card">
        <h3>请输入您的姓名以查看共享标记</h3>
        <p class="hint">仅被加入允许名单的查看者可以看到标记细节</p>
        <el-input v-model="viewer" placeholder="您的姓名" style="margin:12px 0" @keyup.enter="load" />
        <el-button type="primary" @click="load" :loading="loading" :disabled="!viewer.trim()">查看共享内容</el-button>
      </div>
    </div>

    <!-- 拒绝访问：不展示任何标记细节，只说明原因 -->
    <div v-else-if="stage === 'denied'" class="center-box">
      <div class="card denied">
        <div class="denied-icon">🚫</div>
        <h3>无法查看共享标记</h3>
        <p class="reason">{{ denyReason }}</p>
        <el-button v-if="canRetry" size="small" @click="stage = 'identify'">换个身份重试</el-button>
      </div>
    </div>

    <!-- 只读内容 -->
    <div v-else-if="stage === 'ready' && content" class="shared-grid">
      <div class="slices">
        <div v-for="p in planes" :key="p.key" class="slice-panel">
          <div class="slice-title">{{ p.title }}</div>
          <canvas :ref="setCanvas(p.key)" width="220" height="220" class="slice-canvas"></canvas>
        </div>
        <div class="params">
          <h4>📏 测量参数（只读）</h4>
          <div class="param-row"><span>影像预设</span><b>{{ presetLabel }}</b></div>
          <div class="param-row"><span>窗宽</span><b>{{ content.window }}</b></div>
          <div class="param-row"><span>窗位</span><b>{{ content.level }}</b></div>
        </div>
      </div>
      <div class="markers">
        <h4>📍 共享标记（{{ content.rois.length }}）</h4>
        <div v-for="(m, i) in content.rois" :key="i" class="marker-row" :class="{ active: i === activeIdx }">
          <div class="m-info">
            <b>{{ m.label }}</b>
            <span>中心 ({{ m.center.join(', ') }}) · 半径 {{ m.radius }}</span>
          </div>
          <el-button size="small" :type="i === activeIdx ? 'primary' : ''" @click="locate(i)">定位</el-button>
        </div>
        <div class="readonly-note">🔒 此内容为只读共享，标记与测量参数不可修改</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import { useShareStore } from '../store/share'
import type { SharedContent } from '../types'

const props = defineProps<{ shareId: string }>()
const shareStore = useShareStore()

type Stage = 'identify' | 'denied' | 'ready'
const stage = ref<Stage>('identify')
const viewer = ref('')
const loading = ref(false)
const denyReason = ref('')
const canRetry = ref(true)
const content = ref<SharedContent | null>(null)
const volume = ref<number[][][] | null>(null)
const activeIdx = ref(0)

const planes = [
  { key: 'axial', title: '横断面 (轴位)' },
  { key: 'coronal', title: '冠状面' },
  { key: 'sagittal', title: '矢状面' },
] as const
type PlaneKey = typeof planes[number]['key']
const canvases: Partial<Record<PlaneKey, HTMLCanvasElement>> = {}
function setCanvas(key: PlaneKey) {
  return (el: any) => { if (el) canvases[key] = el as HTMLCanvasElement }
}

const presetLabels: Record<string, string> = { brain: '头部CT', chest: '胸部CT', abdomen: '腹部CT' }
const presetLabel = computed(() => presetLabels[content.value?.preset || ''] || content.value?.preset)

function formatTime(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    content.value = await shareStore.fetchShare(props.shareId, viewer.value.trim())
    const { data } = await axios.post('/api/volume', {
      preset: content.value.preset, width: 64, height: 64, depth: 64
    })
    volume.value = data.volume
    stage.value = 'ready'
    activeIdx.value = 0
    // 等 canvas 渲染到 DOM 后再绘制
    requestAnimationFrame(() => drawAll())
  } catch (e: any) {
    denyReason.value = e.message
    // 404/410 没有重试意义；403 可以换身份重试
    canRetry.value = !/不存在|撤回/.test(e.message)
    stage.value = 'denied'
  } finally { loading.value = false }
}

function locate(i: number) {
  activeIdx.value = i
  drawAll()
}

// 从体数据中取过标记中心的切片：返回 [像素矩阵, 十字列, 十字行]
function extractSlice(plane: PlaneKey, c: number[]): [number[][], number, number] {
  const vol = volume.value!
  const [cx, cy, cz] = c
  if (plane === 'axial') return [vol[cz], cx, cy]
  if (plane === 'coronal') return [vol.map(row => row[cy]), cx, cz]
  return [vol.map(row => row.map(r => r[cx])), cy, cz]
}

function drawAll() {
  const ct = content.value
  if (!ct || !volume.value || !ct.rois.length) return
  const m = ct.rois[activeIdx.value]
  const lower = ct.level - ct.window / 2
  const upper = ct.level + ct.window / 2

  for (const p of planes) {
    const cvs = canvases[p.key]
    if (!cvs) continue
    const ctx = cvs.getContext('2d')!
    const W = cvs.width, H = cvs.height
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, W, H)

    const [sliceData, markCol, markRow] = extractSlice(p.key, m.center)
    const rows = sliceData.length, cols = sliceData[0].length
    const cellW = W / cols, cellH = H / rows

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let t = (sliceData[y][x] - lower) / (upper - lower)
        t = Math.max(0, Math.min(1, t))
        const g = Math.floor(t * 255)
        ctx.fillStyle = `rgb(${g},${g},${g})`
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5)
      }
    }

    // 标记十字线 + 范围圈
    const px = (markCol + 0.5) * cellW, py = (markRow + 0.5) * cellH
    ctx.strokeStyle = '#f85149'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px, 0); ctx.lineTo(px, H)
    ctx.moveTo(0, py); ctx.lineTo(W, py)
    ctx.stroke()
    ctx.strokeStyle = '#58a6ff'
    ctx.beginPath()
    ctx.arc(px, py, m.radius * (cellW + cellH) / 2, 0, Math.PI * 2)
    ctx.stroke()
  }
}
</script>

<style scoped>
.shared-root { min-height: 100vh }
.top-bar { display:flex; justify-content:space-between; align-items:center; padding:10px 20px; background:#161b22; border-bottom:1px solid #30363d }
.top-bar h1 { font-size:1rem; color:#58a6ff }
.ro-badge { font-size:10px; background:#1f6feb; color:#fff; border-radius:3px; padding:1px 6px; vertical-align:middle; margin-left:6px }
.share-meta { display:flex; gap:16px; font-size:12px; color:#8b949e }
.share-meta b { color:#e6edf3 }
.center-box { display:flex; align-items:center; justify-content:center; height:60vh }
.card { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:28px 32px; width:380px; text-align:center }
.card h3 { font-size:14px; color:#e6edf3; margin-bottom:6px }
.hint { font-size:11px; color:#8b949e }
.denied .denied-icon { font-size:32px; margin-bottom:8px }
.reason { font-size:12px; color:#f0883e; margin:8px 0 14px }
.shared-grid { display:grid; grid-template-columns:1fr 360px; gap:12px; padding:12px 20px }
.slices { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; align-content:start }
.slice-panel { background:#161b22; border:1px solid #30363d; border-radius:6px; overflow:hidden }
.slice-title { font-size:10px; color:#8b949e; padding:4px 6px; background:#0d1117; text-align:center }
.slice-canvas { display:block; width:100%; aspect-ratio:1 }
.params { grid-column:1 / -1; background:#161b22; border:1px solid #30363d; border-radius:6px; padding:10px }
.params h4, .markers h4 { color:#58a6ff; font-size:12px; margin-bottom:8px }
.param-row { display:flex; justify-content:space-between; font-size:11px; color:#8b949e; padding:4px 6px; background:#0d1117; border-radius:3px; margin-bottom:4px }
.param-row b { color:#e6edf3 }
.markers { background:#161b22; border:1px solid #30363d; border-radius:6px; padding:10px; align-self:start }
.marker-row { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-radius:4px; margin-bottom:4px; background:#0d1117 }
.marker-row.active { outline:1px solid #1f6feb }
.m-info { display:flex; flex-direction:column; font-size:11px; color:#8b949e }
.m-info b { color:#e6edf3; font-size:12px }
.readonly-note { margin-top:10px; font-size:11px; color:#8b949e; background:#0d1117; border-radius:4px; padding:8px; text-align:center }
</style>
