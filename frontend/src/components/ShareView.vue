<template>
  <div class="share-view">
    <!-- 身份验证入口 -->
    <div v-if="!snapshot && !error" class="gate">
      <div class="gate-card">
        <h3>🔒 只读共享标记</h3>
        <p>该链接包含一组共享的影像标记。请输入您的姓名以验证查看权限。</p>
        <el-input v-model="viewer" size="small" placeholder="您的姓名" style="margin:10px 0" @keyup.enter="open"/>
        <el-button type="primary" size="small" :loading="loading" @click="open">打开共享</el-button>
      </div>
    </div>

    <!-- 无权查看 / 已撤回 / 链接失效：只说明原因，不展示任何标记细节 -->
    <div v-else-if="error" class="gate">
      <div class="gate-card error">
        <h3>⛔ 无法查看共享标记</h3>
        <p class="reason">{{ error }}</p>
        <el-button v-if="canRetry" size="small" style="margin-top:10px" @click="retry">更换身份重试</el-button>
      </div>
    </div>

    <!-- 只读共享视图 -->
    <template v-else-if="snapshot">
      <div class="share-banner">
        <span>🔒 只读共享 · 来源：<b>{{ snapshot.owner }}</b> · 共享时间：<b>{{ fmtTime(snapshot.created_at) }}</b></span>
        <span v-if="snapshot.note" class="note">备注：{{ snapshot.note }}</span>
        <span class="lock-tag">标记与测量参数已锁定，仅可查看与定位</span>
      </div>
      <div class="main-grid">
        <div class="render-area"><VolumeRenderer /></div>
        <div class="mpr-area">
          <div class="mpr-row">
            <div class="mpr-panel"><div class="mpr-title">横断面 (轴位)</div><MPRView plane="axial" /></div>
            <div class="mpr-panel"><div class="mpr-title">冠状面</div><MPRView plane="coronal" /></div>
            <div class="mpr-panel"><div class="mpr-title">矢状面</div><MPRView plane="sagittal" /></div>
          </div>
          <WindowControl />
          <div class="panel markers">
            <h4>📍 共享标记（{{ snapshot.markers.length }}）</h4>
            <div v-for="(m, i) in snapshot.markers" :key="i" class="marker-row">
              <span class="m-label">{{ m.label }}</span>
              <span class="m-pos">中心 ({{ m.center.join(', ') }}) · 半径 {{ m.radius }}</span>
              <el-button size="small" @click="locate(m)">定位</el-button>
            </div>
            <div class="m-params">测量参数（共享时锁定）：窗宽 {{ snapshot.window }} / 窗位 {{ snapshot.level }} · 影像 {{ snapshot.preset }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VolumeRenderer from './VolumeRenderer.vue'
import MPRView from './MPRView.vue'
import WindowControl from './WindowControl.vue'
import { useImagingStore } from '../store/imaging'
import type { ShareSnapshot, SharedMarker } from '../types'

const props = defineProps<{ token: string }>()
const store = useImagingStore()

const viewer = ref(
  new URLSearchParams(location.search).get('viewer') ||
  localStorage.getItem('share-viewer') || ''
)
const snapshot = ref<ShareSnapshot | null>(null)
const error = ref('')
const canRetry = ref(false)
const loading = ref(false)

async function open() {
  if (!viewer.value.trim() || loading.value) return
  loading.value = true
  error.value = ''
  try {
    localStorage.setItem('share-viewer', viewer.value.trim())
    const snap = await store.fetchShare(props.token, viewer.value.trim())
    snapshot.value = snap
    // 加载共享时的影像并套用共享时的测量参数（只读锁定）
    store.preset = snap.preset
    await store.loadVolume()
    store.applyWindow(snap.window, snap.level)
  } catch (e: any) {
    error.value = e?.response?.data?.detail || '共享内容加载失败，请稍后重试'
    canRetry.value = e?.response?.status === 403
  } finally { loading.value = false }
}

function retry() { error.value = ''; canRetry.value = false }
function locate(m: SharedMarker) { store.locateMarker(m.center) }
function fmtTime(iso: string) { return new Date(iso).toLocaleString('zh-CN') }

onMounted(() => { if (viewer.value.trim()) open() })
</script>

<style scoped>
.share-view { padding: 0 20px 12px }
.gate { display:flex; align-items:center; justify-content:center; min-height:60vh }
.gate-card { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:24px 28px; width:360px; text-align:center }
.gate-card h3 { color:#58a6ff; font-size:14px; margin-bottom:8px }
.gate-card p { font-size:12px; color:#8b949e; line-height:1.6 }
.gate-card.error h3 { color:#f85149 }
.gate-card .reason { color:#d29922 }
.share-banner { display:flex; gap:14px; align-items:center; flex-wrap:wrap; background:#1c2128; border:1px solid #d29922; border-radius:6px; padding:8px 14px; margin:12px 0; font-size:12px; color:#c9d1d9 }
.share-banner b { color:#e6edf3 }
.share-banner .note { color:#8b949e }
.share-banner .lock-tag { margin-left:auto; color:#d29922; font-size:11px }
.main-grid { display:grid; grid-template-columns:1fr 480px; gap:12px; min-height:75vh }
.render-area { background:#0d1117; border-radius:8px; border:1px solid #30363d; overflow:hidden }
.mpr-area { display:flex; flex-direction:column; gap:12px; overflow-y:auto }
.mpr-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px }
.mpr-panel { background:#161b22; border-radius:6px; border:1px solid #30363d; overflow:hidden }
.mpr-title { font-size:10px; color:#8b949e; padding:4px 6px; background:#0d1117; text-align:center }
.panel { background:#161b22; border-radius:6px; padding:10px; border:1px solid #30363d }
.panel h4 { color:#58a6ff; font-size:12px; margin-bottom:8px }
.marker-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid #21262d; font-size:11px }
.m-label { color:#e6edf3; font-weight:600; min-width:70px }
.m-pos { color:#8b949e; font-family:monospace; flex:1 }
.m-params { margin-top:8px; font-size:10px; color:#8b949e }
</style>
