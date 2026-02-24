import { createSkillSlot } from './skillbar.slot.js';
import { createScheduler } from './skillbar.scheduler.js';
import { undoManager } from '../undo/undo.manager.js';

export function createSkillbar({
    skills = [],
    mode = 'simulate',
    size = 'normal',
    slots = 8,
    interactive = true,
    dropTarget = true,
    dragSource = 'skillbar'
} = {}) {


    const el = document.createElement('div');
    el.className = `skillbar size-${size}`;

    const scheduler = interactive ? createScheduler() : null;
    const slotObjs = [];
    let currentSkills = Array(slots).fill(null);
    let lastPreviewIndex = null;

    /* =========================
       CREATE SLOTS
    ========================= */

    for (let i = 0; i < slots; i++) {
        const slot = createSkillSlot({
    skill: skills[i] ?? null,
    mode,
    size,
    slotIndex: i,
    interactive,
    dragSource
});




        currentSkills[i] = skills[i] ?? null;

        if (interactive) {
slot.onActivate((slotApi, skill) => {
    if (mode !== 'simulate') return;
    if (!scheduler) return;

    scheduler.enqueue(slotApi, skill);
});

}


        slotObjs.push(slot);
        el.appendChild(slot.el);
    }

    if (!interactive) {
        return {
            el,
            slots: slotObjs,
            getState: () => currentSkills.slice(),
            setState(state) {
                currentSkills = state.slice();
                slotObjs.forEach((slot, i) => {
                    if (currentSkills[i]) slot.setSkill(currentSkills[i]);
                    else slot.clear();
                });
            },
            getSkillIds: () => currentSkills.map(s => (s ? s.id : null)),
            setMode(m) {
                mode = m;
                slotObjs.forEach(s => s.setMode(m));
            }
        };
    }

    /* =========================
       RULE DEFINITIONS
    ========================= */

    const MAX_ELITE = 1;
    const MAX_PVE = 3;
    const MAX_PROF = 2;

function resolveRules(simulated, lockedIndex, replacedProfession = null) {
    const removed = new Set();

    /* =========================
       UNIQUE SKILL RULE
    ========================= */

    const lockedSkill = simulated[lockedIndex];

    if (lockedSkill) {
        simulated.forEach((s, i) => {
            if (i === lockedIndex) return;
            if (s && s.id === lockedSkill.id) {
                removed.add(i);
                simulated[i] = null;
            }
        });
    }

    /* =========================
       ELITE RULE (max 1)
    ========================= */

    let elites = simulated
        .map((s, i) => s && s.elite ? i : -1)
        .filter(i => i !== -1);

    while (elites.length > MAX_ELITE) {
        const idx = elites.find(i => i !== lockedIndex);
        if (idx == null) break;
        removed.add(idx);
        simulated[idx] = null;
        elites = elites.filter(i => i !== idx);
    }

    /* =========================
       PvE RULE (max 3)
    ========================= */

    let pves = simulated
        .map((s, i) => s && s.pve_only ? i : -1)
        .filter(i => i !== -1);

    while (pves.length > MAX_PVE) {
        const idx = pves.find(i => i !== lockedIndex);
        if (idx == null) break;
        removed.add(idx);
        simulated[idx] = null;
        pves = pves.filter(i => i !== idx);
    }

    /* =========================
       KURZICK / LUXON EXCLUSION
       attribute: -4 vs -5
    ========================= */

    const attr = lockedSkill?.attribute;

    if (attr === -4 || attr === -5) {
        const forbidden = attr === -4 ? -5 : -4;

        simulated.forEach((s, i) => {
            if (i === lockedIndex) return;
            if (s && s.attribute === forbidden) {
                removed.add(i);
                simulated[i] = null;
            }
        });
    }

    /* =========================
       PROFESSION RULE (max 2)
    ========================= */

    function getDistinctProfessions(list) {
        const set = new Set();
        list.forEach(s => {
            if (!s || !s.profession || s.profession === 'none') return;
            set.add(s.profession);
        });
        return set;
    }

    let professions = getDistinctProfessions(simulated);

    while (professions.size > MAX_PROF) {
        let idx = -1;

        if (replacedProfession) {
            idx = simulated.findIndex(
                (s, i) =>
                    i !== lockedIndex &&
                    s &&
                    s.profession === replacedProfession
            );
        }

        if (idx === -1) {
            idx = simulated.findIndex(
                (s, i) =>
                    i !== lockedIndex &&
                    s &&
                    s.profession &&
                    s.profession !== 'none'
            );
        }

        if (idx === -1) break;

        removed.add(idx);
        simulated[idx] = null;
        professions = getDistinctProfessions(simulated);
    }

    return removed;
}

    /* =========================
       PREVIEW (HOISTED)
    ========================= */

    function clearPreview() {
        slotObjs.forEach(s => s.clearPreview());
        lastPreviewIndex = null;
    }

function isSwapPreview() {
    // desktop drag from skillbar
    if (DragState?.source === 'skillbar') return true;

    // mobile touch drag from skillbar (slotIndex is set on touchstart)
    if (window.TouchDragState?.active && TouchDragState.fromIndex != null) return true;

    return false;
}

function previewDrop(skill, index) {
    if (lastPreviewIndex !== null && lastPreviewIndex !== index) {
        slotObjs[lastPreviewIndex].clearPreview();
    }

    // If we are swapping (skillbar -> skillbar), do NOT run rule previews.
    // Rule preview assumes "replace", but swap does not violate rules in-preview.
    if (isSwapPreview()) {
        // clear any stale remove overlays from previous previews
        slotObjs.forEach(s => s.clearPreview());

        slotObjs[index].setPreviewSkill(skill);
        lastPreviewIndex = index;
        return;
    }

    const simulated = currentSkills.slice();
    const replaced = currentSkills[index];
    const replacedProfession =
        replaced && replaced.profession && replaced.profession !== 'none'
            ? replaced.profession
            : null;

    simulated[index] = skill;

    const removed = resolveRules(simulated, index, replacedProfession);

    slotObjs[index].setPreviewSkill(skill);
    removed.forEach(i => slotObjs[i].markWouldRemove());

    lastPreviewIndex = index;
}



    /* =========================
       DRAG & DROP
    ========================= */
if (dropTarget) {

    slotObjs.forEach((slot, index) => {
        const slotEl = slot.el;

slotEl.addEventListener('dragover', e => {
    if (!window.DragState?.skill) return;
    e.preventDefault();

    // if we are over a slot, it's NOT a delete scenario
    if (DragState?.source === 'skillbar' && DragState.fromIndex != null) {
        slotObjs[DragState.fromIndex].clearPreview();
    }

    if (lastPreviewIndex !== null && lastPreviewIndex !== index) {
        slotObjs[lastPreviewIndex].clearPreview();
    }

    previewDrop(window.DragState.skill, index);
    lastPreviewIndex = index;
});


slotEl.addEventListener('dragleave', e => {
    if (!slotEl.contains(e.relatedTarget)) {
        clearPreview();

        // dragging from skillbar → show delete preview
        // ONLY if we're NOT currently over another skillbar slot
        if (DragState?.source === 'skillbar') {
            const under = document.elementFromPoint(e.clientX, e.clientY);
            const overSlot = under?.closest?.('.skillbar-slot');

            if (!overSlot) {
                const from = DragState.fromIndex;
                if (from != null) {
                    slotObjs[from].markWouldRemove();
                }
            }
        }
    }
});



        slotEl.addEventListener('drop', e => {
    if (!DragState.skill) return;
    e.preventDefault();

    const from = DragState.fromIndex;
    const to = index;

    // CASE 1: same slot → NO-OP
    if (DragState.source === 'skillbar' && from === to) {
	DragState.handled = true
        clearPreview();

        return;
    }

    // CASE 2: skillbar → skillbar (SWAP)
    if (DragState.source === 'skillbar') {
	DragState.handled = true
        const a = currentSkills[from];
        const b = currentSkills[to];

        currentSkills[from] = b;
        currentSkills[to] = a;

        slotObjs[from].setSkill(b);
        slotObjs[to].setSkill(a);


        return;
    }

    // CASE 3: list → skillbar (existing logic)
    DragState.handled = true
    applyDrop(DragState.skill, index);

});


slotEl.addEventListener('touchmove', e => {
    if (!TouchDragState.active || !TouchDragState.skill) return;

    const touch = e.touches[0];
    const elUnderFinger = document.elementFromPoint(
        touch.clientX,
        touch.clientY
    );

    const slotIndex = slotObjs.findIndex(
        s => s.el === elUnderFinger || s.el.contains(elUnderFinger)
    );

    if (slotIndex !== -1) {
        // We are over a slot → NOT a delete
        clearPreview();

        // if dragging from skillbar, also clear any stale delete overlay on origin
        if (TouchDragState.fromIndex != null) {
            slotObjs[TouchDragState.fromIndex].clearPreview();
        }

        previewDrop(TouchDragState.skill, slotIndex);
        lastPreviewIndex = slotIndex;

    } else {
        // Outside any slot → show delete overlay (only if dragging from skillbar)
        clearPreview();

        if (TouchDragState.fromIndex != null) {
            slotObjs[TouchDragState.fromIndex].markWouldRemove();
        }

        lastPreviewIndex = null;
    }
}, { passive: false });

    });


}
    /* =========================
       APPLY DROP
    ========================= */

    function getState() {
        return currentSkills.slice();
    }

function getSkillIds() {
    return getState().map(s => (s ? s.id : null));
}



    function setState(state) {
        currentSkills = state.slice();
        slotObjs.forEach((slot, i) => {
            if (currentSkills[i]) slot.setSkill(currentSkills[i]);
            else slot.clear();
        });
    }

function dropFromMobile(fromIndex, toIndex, skill) {
    if (fromIndex != null && fromIndex !== toIndex) {
        // swap
        const a = currentSkills[fromIndex];
        const b = currentSkills[toIndex];
        currentSkills[fromIndex] = b;
        currentSkills[toIndex] = a;
        slotObjs[fromIndex].setSkill(b);
        slotObjs[toIndex].setSkill(a);
        return;
    }

    // list → skillbar
    applyDrop(skill, toIndex);
}


    function applyDrop(skill, index) {
        const before = getState();

        const simulated = currentSkills.slice();
        const replaced = currentSkills[index];
        const replacedProfession =
            replaced && replaced.profession && replaced.profession !== 'none'
                ? replaced.profession
                : null;

        simulated[index] = skill;

        const removed = resolveRules(simulated, index, replacedProfession);
        removed.forEach(i => simulated[i] = null);

        setState(simulated);

        undoManager.push({
            type: 'skillbar-change',
            target: api,
            before,
            after: getState()
        });
    }

    const api = {
        el,
        slots: slotObjs,
        previewDrop,
        clearPreview,
        dropFromMobile,
        applyDrop,
        getState,
        getSkillIds,
        setState,
        setMode(m) {
            mode = m;
            slotObjs.forEach(s => s.setMode(m));
        }
    };

    return api;
}
