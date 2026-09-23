/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useShareStore } from '../store/share';
const props = defineProps();
const emit = defineEmits();
const shareStore = useShareStore();
const tab = ref('create');
const owner = ref('');
const viewersText = ref('');
const creating = ref(false);
const createdLink = ref('');
const myShares = ref([]);
const loadingList = ref(false);
const presetLabels = { brain: '头部CT', chest: '胸部CT', abdomen: '腹部CT' };
const presetLabel = computed(() => presetLabels[props.preset] || props.preset);
function formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN');
}
async function create() {
    creating.value = true;
    try {
        const s = await shareStore.createShare({
            owner: owner.value.trim(),
            viewers: viewersText.value.split(/[,，\s]+/).filter(Boolean),
            preset: props.preset,
            window: props.windowVal,
            level: props.levelVal,
            rois: props.rois.map(r => ({ label: r.label, center: [...r.center], radius: r.radius })),
        });
        createdLink.value = `${location.origin}${location.pathname}?share=${s.id}`;
        ElMessage.success('分享链接已生成');
    }
    catch (e) {
        ElMessage.error(e.message);
    }
    finally {
        creating.value = false;
    }
}
async function copy() {
    try {
        await navigator.clipboard.writeText(createdLink.value);
        ElMessage.success('已复制到剪贴板');
    }
    catch {
        ElMessage.info('请手动复制链接');
    }
}
async function refresh() {
    if (!owner.value.trim())
        return;
    loadingList.value = true;
    try {
        myShares.value = await shareStore.listShares(owner.value.trim());
    }
    finally {
        loadingList.value = false;
    }
}
async function revoke(id) {
    try {
        await shareStore.revokeShare(id, owner.value.trim());
        ElMessage.success('已撤回，对方再次打开将无法查看标记');
        await refresh();
    }
    catch (e) {
        ElMessage.error(e.message);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
/** @type {__VLS_StyleScopedClasses['s-meta']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "🔗 分享标记（只读）",
    width: "560px",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.modelValue),
    title: "🔗 分享标记（只读）",
    width: "560px",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    'onUpdate:modelValue': ((v) => __VLS_ctx.emit('update:modelValue', v))
};
var __VLS_8 = {};
__VLS_3.slots.default;
const __VLS_9 = {}.ElTabs;
/** @type {[typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    modelValue: (__VLS_ctx.tab),
}));
const __VLS_11 = __VLS_10({
    modelValue: (__VLS_ctx.tab),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "创建分享",
    name: "create",
}));
const __VLS_15 = __VLS_14({
    label: "创建分享",
    name: "create",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
const __VLS_17 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.owner),
    size: "small",
    placeholder: "如：张医生",
}));
const __VLS_19 = __VLS_18({
    modelValue: (__VLS_ctx.owner),
    size: "small",
    placeholder: "如：张医生",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
const __VLS_21 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.viewersText),
    size: "small",
    placeholder: "如：李医生, 王技师",
}));
const __VLS_23 = __VLS_22({
    modelValue: (__VLS_ctx.viewersText),
    size: "small",
    placeholder: "如：李医生, 王技师",
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hint" },
});
(__VLS_ctx.rois.length);
(__VLS_ctx.presetLabel);
(__VLS_ctx.windowVal);
(__VLS_ctx.levelVal);
const __VLS_25 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    loading: (__VLS_ctx.creating),
    disabled: (!__VLS_ctx.owner.trim() || !__VLS_ctx.rois.length),
}));
const __VLS_27 = __VLS_26({
    ...{ 'onClick': {} },
    type: "primary",
    size: "small",
    loading: (__VLS_ctx.creating),
    disabled: (!__VLS_ctx.owner.trim() || !__VLS_ctx.rois.length),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
let __VLS_29;
let __VLS_30;
let __VLS_31;
const __VLS_32 = {
    onClick: (__VLS_ctx.create)
};
__VLS_28.slots.default;
var __VLS_28;
if (__VLS_ctx.createdLink) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "link-box" },
    });
    const __VLS_33 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        modelValue: (__VLS_ctx.createdLink),
        size: "small",
        readonly: true,
    }));
    const __VLS_35 = __VLS_34({
        modelValue: (__VLS_ctx.createdLink),
        size: "small",
        readonly: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    const __VLS_37 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_39 = __VLS_38({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    let __VLS_41;
    let __VLS_42;
    let __VLS_43;
    const __VLS_44 = {
        onClick: (__VLS_ctx.copy)
    };
    __VLS_40.slots.default;
    var __VLS_40;
}
if (__VLS_ctx.createdLink) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint" },
    });
}
var __VLS_16;
const __VLS_45 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    label: "我的分享",
    name: "manage",
}));
const __VLS_47 = __VLS_46({
    label: "我的分享",
    name: "manage",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "row" },
});
const __VLS_49 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    modelValue: (__VLS_ctx.owner),
    size: "small",
    placeholder: "与创建时填写的姓名一致",
}));
const __VLS_51 = __VLS_50({
    modelValue: (__VLS_ctx.owner),
    size: "small",
    placeholder: "与创建时填写的姓名一致",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const __VLS_53 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    ...{ 'onClick': {} },
    size: "small",
    loading: (__VLS_ctx.loadingList),
}));
const __VLS_55 = __VLS_54({
    ...{ 'onClick': {} },
    size: "small",
    loading: (__VLS_ctx.loadingList),
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
let __VLS_57;
let __VLS_58;
let __VLS_59;
const __VLS_60 = {
    onClick: (__VLS_ctx.refresh)
};
__VLS_56.slots.default;
var __VLS_56;
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.myShares))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (s.id),
        ...{ class: "share-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "s-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
    (s.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (s.roiCount);
    (s.viewers.join('、') || '（空名单）');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.formatTime(s.createdAt));
    if (s.revoked) {
        const __VLS_61 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
            type: "danger",
            size: "small",
        }));
        const __VLS_63 = __VLS_62({
            type: "danger",
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_62));
        __VLS_64.slots.default;
        var __VLS_64;
    }
    else {
        const __VLS_65 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }));
        const __VLS_67 = __VLS_66({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_66));
        let __VLS_69;
        let __VLS_70;
        let __VLS_71;
        const __VLS_72 = {
            onClick: (...[$event]) => {
                if (!!(s.revoked))
                    return;
                __VLS_ctx.revoke(s.id);
            }
        };
        __VLS_68.slots.default;
        var __VLS_68;
    }
}
if (!__VLS_ctx.myShares.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint" },
    });
}
var __VLS_48;
var __VLS_12;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['link-box']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['share-row']} */ ;
/** @type {__VLS_StyleScopedClasses['s-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            tab: tab,
            owner: owner,
            viewersText: viewersText,
            creating: creating,
            createdLink: createdLink,
            myShares: myShares,
            loadingList: loadingList,
            presetLabel: presetLabel,
            formatTime: formatTime,
            create: create,
            copy: copy,
            refresh: refresh,
            revoke: revoke,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
