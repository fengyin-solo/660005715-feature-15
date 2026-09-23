import { defineStore } from 'pinia'
import axios from 'axios'
import type { ROIMarker, SharedContent, ShareSummary } from '@/types'

export interface CreateSharePayload {
  owner: string
  viewers: string[]
  preset: string
  window: number
  level: number
  rois: ROIMarker[]
}

function errMsg(e: any): string {
  return e?.response?.data?.detail || e?.message || '网络错误'
}

export const useShareStore = defineStore('share', () => {
  async function createShare(p: CreateSharePayload): Promise<ShareSummary> {
    try {
      const { data } = await axios.post('/api/shares', p)
      return data
    } catch (e) { throw new Error(errMsg(e)) }
  }

  async function fetchShare(id: string, viewer: string): Promise<SharedContent> {
    try {
      const { data } = await axios.get(`/api/shares/${id}`, { params: { viewer } })
      return data
    } catch (e) { throw new Error(errMsg(e)) }
  }

  async function listShares(owner: string): Promise<ShareSummary[]> {
    const { data } = await axios.get('/api/shares', { params: { owner } })
    return data.shares
  }

  async function revokeShare(id: string, owner: string): Promise<void> {
    try {
      await axios.post(`/api/shares/${id}/revoke`, { owner })
    } catch (e) { throw new Error(errMsg(e)) }
  }

  return { createShare, fetchShare, listShares, revokeShare }
})
