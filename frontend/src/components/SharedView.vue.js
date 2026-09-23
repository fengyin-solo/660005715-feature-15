/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import axios from 'axios';
import { useShareStore } from '../store/share';
const props = defineProps();
const shareStore = useShareStore();
const stage = ref('identify');
const viewer = ref('');
const loading = ref(false);
const denyReason = ref('');
const canRetry = ref(true);
const content = ref(null);
const volume = ref(null);
const activeIdx = ref(0);
const planes = [
    { key: 'axial', title: '横断面 (轴位)' },
    { key: 'coronal', title: '冠状面' },
    { key: 'sagittal', title: '矢状面' },
];
const canvases = {};
function setCanvas(key) {
    return (el) => { if (el)
        canvases[key] = el; };
}
const presetLabels = { brain: '头部CT', chest: '胸部CT', abdomen: '腹部CT' };
const presetLabel = computed(() => presetLabels[content.value?.preset || ''] || content.value?.preset);
function formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN');
}
async function load() {
    loading.value = true;
    try {
        content.value = await shareStore.fetchShare(props.shareId, viewer.value.trim());
        const { data } = await axios.post('/api/volume', {
            preset: content.value.preset, width: 64, height: 64, depth: 64
        });
        volume.value = data.volume;
        stage.value = 'ready';
        activeIdx.value = 0;
        // 等 canvas 渲染到 DOM 后再绘制
        requestAnimationFrame(() => drawAll());
    }
    catch (e) {
        denyReason.value = e.message;
        // 404/410 没有重试意义；403 可以换身份重试
        canRetry.value = !/不存在|撤回/.test(e.message);
        stage.value = 'denied';
    }
    finally {
        loading.value = false;
    }
}
function locate(i) {
    activeIdx.value = i;
    drawAll();
}
// 从体数据中取过标记中心的切片：返回 [像素矩阵, 十字列, 十字行]
function extractSlice(plane, c) {
    const vol = volume.value;
    const [cx, cy, cz] = c;
    if (plane === 'axial')
        return [vol[cz], cx, cy];
    if (plane === 'coronal')
        return [vol.map(row => row[cy]), cx, cz];
    return [vol.map(row => row.map(r => r[cx])), cy, cz];
}
function drawAll() {
    const ct = content.value;
    if (!ct || !volume.value || !ct.rois.length)
        return;
    const m = ct.rois[activeIdx.value];
    const lower = ct.level - ct.window / 2;
    const upper = ct.level + ct.window / 2;
    for (const p of planes) {
        const cvs = canvases[p.key];
        if (!cvs)
            continue;
        const ctx = cvs.getContext('2d');
        const W = cvs.width, H = cvs.height;
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, W, H);
        const [sliceData, markCol, markRow] = extractSlice(p.key, m.center);
        const rows = sliceData.length, cols = sliceData[0].length;
        const cellW = W / cols, cellH = H / rows;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let t = (sliceData[y][x] - lower) / (upper - lower);
                t = Math.max(0, Math.min(1, t));
                const g = Math.floor(t * 255);
                ctx.fillStyle = `rgb(${g},${g},${g})`;
                ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
            }
        }
        // 标记十字线 + 范围圈
        const px = (markCol + 0.5) * cellW, py = (markRow + 0.5) * cellH;
        ctx.strokeStyle = '#f85149';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, H);
        ctx.moveTo(0, py);
        ctx.lineTo(W, py);
        ctx.stroke();
        ctx.strokeStyle = '#58a6ff';
        ctx.beginPath();
        ctx.arc(px, py, m.radius * (cellW + cellH) / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['top-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['share-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['params']} */ ;
/** @type {__VLS_StyleScopedClasses['param-row']} */ ;
/** @type {__VLS_StyleScopedClasses['markers']} */ ;
/** @type {__VLS_StyleScopedClasses['marker-row']} */ ;
/** @type {__VLS_StyleScopedClasses['m-info']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "shared-root" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "top-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ro-badge" },
});
if (__VLS_ctx.content) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "share-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.content.owner);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.formatTime(__VLS_ctx.content.createdAt));
}
if (__VLS_ctx.stage === 'identify') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "center-box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "hint" },
    });
    const __VLS_0 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.viewer),
        placeholder: "您的姓名",
        ...{ style: {} },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onKeyup': {} },
        modelValue: (__VLS_ctx.viewer),
        placeholder: "您的姓名",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onKeyup: (__VLS_ctx.load)
    };
    var __VLS_3;
    const __VLS_8 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
        disabled: (!__VLS_ctx.viewer.trim()),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
        disabled: (!__VLS_ctx.viewer.trim()),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.load)
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
else if (__VLS_ctx.stage === 'denied') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "center-box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card denied" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "denied-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "reason" },
    });
    (__VLS_ctx.denyReason);
    if (__VLS_ctx.canRetry) {
        const __VLS_16 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            ...{ 'onClick': {} },
            size: "small",
        }));
        const __VLS_18 = __VLS_17({
            ...{ 'onClick': {} },
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        let __VLS_20;
        let __VLS_21;
        let __VLS_22;
        const __VLS_23 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.stage === 'identify'))
                    return;
                if (!(__VLS_ctx.stage === 'denied'))
                    return;
                if (!(__VLS_ctx.canRetry))
                    return;
                __VLS_ctx.stage = 'identify';
            }
        };
        __VLS_19.slots.default;
        var __VLS_19;
    }
}
else if (__VLS_ctx.stage === 'ready' && __VLS_ctx.content) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "shared-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "slices" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.planes))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (p.key),
            ...{ class: "slice-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "slice-title" },
        });
        (p.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.canvas, __VLS_intrinsicElements.canvas)({
            ref: (__VLS_ctx.setCanvas(p.key)),
            width: "220",
            height: "220",
            ...{ class: "slice-canvas" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "params" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "param-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.presetLabel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "param-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.content.window);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "param-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.content.level);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "markers" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.content.rois.length);
    for (const [m, i] of __VLS_getVForSourceType((__VLS_ctx.content.rois))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "marker-row" },
            ...{ class: ({ active: i === __VLS_ctx.activeIdx }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "m-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (m.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (m.center.join(', '));
        (m.radius);
        const __VLS_24 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            ...{ 'onClick': {} },
            size: "small",
            type: (i === __VLS_ctx.activeIdx ? 'primary' : ''),
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onClick': {} },
            size: "small",
            type: (i === __VLS_ctx.activeIdx ? 'primary' : ''),
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_28;
        let __VLS_29;
        let __VLS_30;
        const __VLS_31 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.stage === 'identify'))
                    return;
                if (!!(__VLS_ctx.stage === 'denied'))
                    return;
                if (!(__VLS_ctx.stage === 'ready' && __VLS_ctx.content))
                    return;
                __VLS_ctx.locate(i);
            }
        };
        __VLS_27.slots.default;
        var __VLS_27;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "readonly-note" },
    });
}
/** @type {__VLS_StyleScopedClasses['shared-root']} */ ;
/** @type {__VLS_StyleScopedClasses['top-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['ro-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['share-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['center-box']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['center-box']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['denied']} */ ;
/** @type {__VLS_StyleScopedClasses['denied-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['reason']} */ ;
/** @type {__VLS_StyleScopedClasses['shared-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['slices']} */ ;
/** @type {__VLS_StyleScopedClasses['slice-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['slice-title']} */ ;
/** @type {__VLS_StyleScopedClasses['slice-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['params']} */ ;
/** @type {__VLS_StyleScopedClasses['param-row']} */ ;
/** @type {__VLS_StyleScopedClasses['param-row']} */ ;
/** @type {__VLS_StyleScopedClasses['param-row']} */ ;
/** @type {__VLS_StyleScopedClasses['markers']} */ ;
/** @type {__VLS_StyleScopedClasses['marker-row']} */ ;
/** @type {__VLS_StyleScopedClasses['m-info']} */ ;
/** @type {__VLS_StyleScopedClasses['readonly-note']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            stage: stage,
            viewer: viewer,
            loading: loading,
            denyReason: denyReason,
            canRetry: canRetry,
            content: content,
            activeIdx: activeIdx,
            planes: planes,
            setCanvas: setCanvas,
            presetLabel: presetLabel,
            formatTime: formatTime,
            load: load,
            locate: locate,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
