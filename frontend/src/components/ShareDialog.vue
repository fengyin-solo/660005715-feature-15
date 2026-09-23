<template>
  <el-dialog :model-value="modelValue" @update:model-value="(v: boolean) => emit('update:modelValue', v)"
             title="🔗 分享标记（只读）" width="560px">
    <el-tabs v-model="tab">
      <el-tab-pane label="创建分享" name="create">
        <div class="form">
          <label>您的姓名（将作为来源标识展示给查看者）</label>
          <el-input v-model="owner" size="small" placeholder="如：张医生" />
          <label>允许查看的人（逗号分隔；不在名单内的人打开链接也看不到标记）</label>
          <el-input v-model="viewersText" size="small" placeholder="如：李医生, 王技师" />
          <div class="hint">
            将快照分享 {{ rois.length }} 个标记及当前测量参数（{{ presetLabel }}，窗宽 {{ windowVal }} / 窗位 {{ levelVal }}）。
            查看者只能查看与定位标记，不能修改；您可随时在"我的分享"中撤回。
          </div>
          <el-button type="primary" size="small" @click="create" :loading="creating"
                     :disabled="!owner.trim() || !rois.length">生成分享链接</el-button>
          <div v-if="createdLink" class="link-box">
            <el-input v-model="createdLink" size="small" readonly />
            <el-button size="small" @click="copy">复制</el-button>
          </div>
          <div v-if="createdLink" class="hint">把链接发给名单中的查看者，对方打开后输入自己的姓名即可查看。</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="我的分享" name="manage">
        <div class="form">
          <label>您的姓名</label>
          <div class="row">
            <el-input v-model="owner" size="small" placeholder="与创建时填写的姓名一致" />
            <el-button size="small" @click="refresh" :loading="loadingList">查询</el-button>
          </div>
          <div v-for="s in myShares" :key="s.id" class="share-row">
            <div class="s-meta">
              <code>{{ s.id }}</code>
              <span>{{ s.roiCount }} 个标记 · 允许：{{ s.viewers.join('、') || '（空名单）' }}</span>
              <span>{{ formatTime(s.createdAt) }}</span>
            </div>
            <el-tag v-if="s.revoked" type="danger" size="small">已撤回</el-tag>
            <el-button v-else size="small" type="danger" @click="revoke(s.id)">撤回</el-button>
          </div>
          <div v-if="!myShares.length" class="hint">暂无分享记录</div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useShareStore } from '../store/share'
import type { ROIMarker, ShareSummary } from '../types'

const props = defineProps<{
  modelValue: boolean
  rois: ROIMarker[]
  preset: string
  windowVal: number
  levelVal: number
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const shareStore = useShareStore()
const tab = ref('create')
const owner = ref('')
const viewersText = ref('')
const creating = ref(false)
const createdLink = ref('')
const myShares = ref<ShareSummary[]>([])
const loadingList = ref(false)

const presetLabels: Record<string, string> = { brain: '头部CT', chest: '胸部CT', abdomen: '腹部CT' }
const presetLabel = computed(() => presetLabels[props.preset] || props.preset)

function formatTime(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN')
}

async function create() {
  creating.value = true
  try {
    const s = await shareStore.createShare({
      owner: owner.value.trim(),
      viewers: viewersText.value.split(/[,，\s]+/).filter(Boolean),
      preset: props.preset,
      window: props.windowVal,
      level: props.levelVal,
      rois: props.rois.map(r => ({ label: r.label, center: [...r.center], radius: r.radius })),
    })
    createdLink.value = `${location.origin}${location.pathname}?share=${s.id}`
    ElMessage.success('分享链接已生成')
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally { creating.value = false }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(createdLink.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.info('请手动复制链接')
  }
}

async function refresh() {
  if (!owner.value.trim()) return
  loadingList.value = true
  try {
    myShares.value = await shareStore.listShares(owner.value.trim())
  } finally { loadingList.value = false }
}

async function revoke(id: string) {
  try {
    await shareStore.revokeShare(id, owner.value.trim())
    ElMessage.success('已撤回，对方再次打开将无法查看标记')
    await refresh()
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 8px }
.form label { font-size: 12px; color: #8b949e }
.hint { font-size: 11px; color: #8b949e; background: #0d1117; border-radius: 4px; padding: 8px; line-height: 1.6 }
.row { display: flex; gap: 6px }
.link-box { display: flex; gap: 6px }
.share-row { display: flex; justify-content: space-between; align-items: center; background: #0d1117; border-radius: 4px; padding: 6px 8px }
.s-meta { display: flex; flex-direction: column; font-size: 11px; color: #8b949e }
.s-meta code { color: #58a6ff; font-size: 12px }
</style>
