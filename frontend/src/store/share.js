import { defineStore } from 'pinia';
import axios from 'axios';
function errMsg(e) {
    return e?.response?.data?.detail || e?.message || '网络错误';
}
export const useShareStore = defineStore('share', () => {
    async function createShare(p) {
        try {
            const { data } = await axios.post('/api/shares', p);
            return data;
        }
        catch (e) {
            throw new Error(errMsg(e));
        }
    }
    async function fetchShare(id, viewer) {
        try {
            const { data } = await axios.get(`/api/shares/${id}`, { params: { viewer } });
            return data;
        }
        catch (e) {
            throw new Error(errMsg(e));
        }
    }
    async function listShares(owner) {
        const { data } = await axios.get('/api/shares', { params: { owner } });
        return data.shares;
    }
    async function revokeShare(id, owner) {
        try {
            await axios.post(`/api/shares/${id}/revoke`, { owner });
        }
        catch (e) {
            throw new Error(errMsg(e));
        }
    }
    return { createShare, fetchShare, listShares, revokeShare };
});
