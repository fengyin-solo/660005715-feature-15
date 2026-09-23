<template>
  <div class="panel">
    <h4>📐 ROI感兴趣区域分析</h4>
    <el-button size="small" @click="addROI" style="margin-bottom:8px">+ 添加ROI</el-button>
    <div v-for="(roi,i) in rois" :key="i" class="roi-config">
      <div class="roi-row">
        <span>ROI #{{ i+1 }}</span>
        <el-input v-model="roi.label" size="small" placeholder="标签" style="width:80px"/>
        <el-input-number v-model="roi.center[0]" size="small" :min="0" :max="63" style="width:65px" controls-position="right"/>
        <el-input-number v-model="roi.center[1]" size="small" :min="0" :max="63" style="width:65px" controls-position="right"/>
        <el-input-number v-model="roi.center[2]" size="small" :min="0" :max="63" style="width:65px" controls-position="right"/>
        <el-input-number v-model="roi.radius" size="small" :min="2" :max="20" style="width:60px" controls-position="right"/>
        <el-button size="small" type="danger" @click="removeROI(i)" circle>×</el-button>
      </div>
    </div>
    <div class="btn-row">
      <el-button type="success" size="small" @click="analyze" :loading="store.loading" :disabled="!rois.length">📊 分析ROI</el-button>
      <el-button size="small" @click="shareDialog = true" :disabled="!rois.length">🔗 只读共享标记</el-button>
    </div>

    <div v-if="store.roiResults.length" class="results">
      <div v-for="r in store.roiResults" :key="r.label" class="roi-result">
        <div class="r-label">{{ r.label }}</div>
        <div class="r-stats">
          <div class="stat"><span>均值</span><b>{{ r.mean }}</b> HU</div>
          <div class="stat"><span>标准差</span><b>{{ r.std }}</b></div>
          <div class="stat"><span>范围</span><b>{{ r.min }}~{{ r.max }}</b></div>
          <div class="stat"><span>体素</span><b>{{ r.voxelCount }}</b></div>
        </div>
        <div ref="histCharts" class="mini-hist"></div>
      </div>
    </div>

    <div v-if="shareLink" class="share-link">
      <div class="sl-tip">✅ 只读共享已创建，将链接发给允许查看者（对方只能查看与定位，不能修改）：</div>
      <el-input v-model="shareLink" size="small" readonly>
        <template #append><el-button @click="copyLink">复制</el-button></template>
      </el-input>
    </div>

    <div v-if="store.myShares.length" class="my-shares">
      <div class="ms-title">我发出的共享</div>
      <div v-for="s in store.myShares" :key="s.token" class="ms-row">
        <span class="ms-info">
          {{ s.marker_count }}个标记 · {{ fmtTime(s.created_at) }}
          <em v-if="s.revoked" class="revoked">已撤回</em>
          <em v-else class="active">生效中</em>
        </span>
        <el-button v-if="!s.revoked" size="small" type="danger" text @click="doRevoke(s.token)">撤回</el-button>
      </div>
    </div>

    <el-dialog v-model="shareDialog" title="只读共享当前标记" width="420px">
      <div class="share-form">
        <label>来源（您的姓名/标识，将展示给查看者）</label>
        <el-input v-model="shareOwner" size="small" placeholder="如：张医生"/>
        <label>允许查看者（逗号分隔，仅名单内的人可查看标记细节）</label>
        <el-input v-model="shareViewers" size="small" placeholder="如：李医生, 王主任"/>
        <label>备注（可选）</label>
        <el-input v-model="shareNote" size="small" placeholder="如：术前讨论用"/>
        <div class="sf-tip">共享内容：{{ rois.length }} 个标记 + 当前测量参数（窗宽 {{ store.windowVal }} / 窗位 {{ store.levelVal }}，{{ store.preset }}）。共享后本地标记与测量流程不受影响。</div>
      </div>
      <template #footer>
        <el-button size="small" @click="shareDialog = false">取消</el-button>
        <el-button size="small" type="primary" :loading="sharing" @click="doShare">创建共享链接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useImagingStore } from '../store/imaging'
const store = useImagingStore()

interface ROIDef { label: string; center: number[]; radius: number }
const rois = ref<ROIDef[]>([
  { label: 'lesion1', center: [30, 28, 32], radius: 6 }
])

function addROI() { rois.value.push({ label: `roi-${rois.value.length+1}`, center: [32, 32, 32], radius: 8 }) }
function removeROI(i: number) { rois.value.splice(i, 1) }
function analyze() { store.analyzeROI(rois.value.map(r => ({...r}))) }

// ---- 只读共享 ----
const shareDialog = ref(false)
const shareOwner = ref(localStorage.getItem('share-owner') || '')
const shareViewers = ref('')
const shareNote = ref('')
const shareLink = ref('')
const sharing = ref(false)

async function doShare() {
  const owner = shareOwner.value.trim()
  if (!owner) { ElMessage.warning('请填写来源（您的姓名/标识）'); return }
  sharing.value = true
  try {
    localStorage.setItem('share-owner', owner)
    const token = await store.createShare({
      owner,
      preset: store.preset,
      window: store.windowVal,
      level: store.levelVal,
      markers: rois.value.map(r => ({ label: r.label, center: [...r.center], radius: r.radius })),
      allowed_viewers: shareViewers.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      note: shareNote.value.trim(),
    })
    shareLink.value = `${location.origin}/?share=${token}`
    shareDialog.value = false
    ElMessage.success('共享链接已创建')
    await store.listShares(owner)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '创建共享失败')
  } finally { sharing.value = false }
}

async function doRevoke(token: string) {
  try {
    await store.revokeShare(token, shareOwner.value.trim())
    ElMessage.success('已撤回，对方再次打开将无法查看标记')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.detail || '撤回失败')
  }
}

function copyLink() {
  navigator.clipboard?.writeText(shareLink.value)
  ElMessage.success('链接已复制')
}

function fmtTime(iso: string) { return new Date(iso).toLocaleString('zh-CN') }

watch(shareOwner, v => { const o = v.trim(); if (o) store.listShares(o) })
onMounted(() => { const o = shareOwner.value.trim(); if (o) store.listShares(o) })
</script>

<style scoped>
.panel { background:#161b22; border-radius:6px; padding:10px; border:1px solid #30363d }
.panel h4 { color:#58a6ff; font-size:12px; margin-bottom:8px }
.roi-row { display:flex; gap:3px; align-items:center; padding:4px 0; font-size:11px; flex-wrap:wrap }
.btn-row { display:flex; gap:6px; margin-top:8px }
.results { margin-top:10px }
.r-label { font-size:12px; color:#e6edf3; font-weight:600; margin-bottom:4px }
.r-stats { display:grid; grid-template-columns:1fr 1fr; gap:4px }
.stat { font-size:10px; color:#8b949e; padding:3px 4px; background:#0d1117; border-radius:3px }
.stat b { color:#e6edf3; margin-left:4px }
.mini-hist { width:100%; height:40px; margin-top:4px; background:#0d1117; border-radius:3px }
.share-link { margin-top:10px }
.sl-tip { font-size:11px; color:#3fb950; margin-bottom:4px }
.my-shares { margin-top:10px; border-top:1px solid #30363d; padding-top:8px }
.ms-title { font-size:11px; color:#8b949e; margin-bottom:4px }
.ms-row { display:flex; justify-content:space-between; align-items:center; padding:3px 0; font-size:11px }
.ms-info { color:#c9d1d9 }
.ms-info em { font-style:normal; margin-left:4px }
.ms-info em.active { color:#3fb950 }
.ms-info em.revoked { color:#f85149 }
.share-form label { display:block; font-size:11px; color:#8b949e; margin:8px 0 3px }
.sf-tip { font-size:10px; color:#8b949e; margin-top:10px; line-height:1.5 }
</style>
