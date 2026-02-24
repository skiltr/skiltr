/* =========================
         UI commands
   ========================= */

import { createFilterEngine } from './filters/filter.engine.js';
import { initFilterUI } from './filters/filter.ui.js';
import { renderFilterPanel } from './filters/filter.panel.js';
import { undoManager } from './undo/undo.manager.js';
import { createSkillbar } from './skillbar/skillbar.js';
import { refreshBuildsPanel } from './builds/builds.panel.js';
import {
    openSkillDetails,
    refreshSkillDetails,
    closeSkillDetails
} from './skills/skill.details.controller.js';
import { preloadAllSkillMeta } from './skills/skill.details.meta.js';
import { preloadBooksDeep } from './containers/container.books.ui.js';

window.closeSkillDetails = closeSkillDetails;
window.openSkillDetails = openSkillDetails; // optional for debugging


const filterEngine = createFilterEngine();
window.FilterEngine = filterEngine;

let filterUI = null;

const onFilterChange = () => {

    console.log("FILTER CHANGE TRIGGERED");

    localStorage.setItem(
        'skilter_filters',
        JSON.stringify(filterEngine.getState())
    );

    SkillListView.updateItems();
    SkillListView.render();
    renderFilterPanel(filterEngine, filterUI);
};




filterUI = initFilterUI(filterEngine, onFilterChange);
// RESTORE SAVED FILTERS
const saved = localStorage.getItem('skilter_filters');

if (saved) {

    console.log("RESTORE RUNNING");

    try {

        const parsed = JSON.parse(saved);

        filterEngine.loadState(parsed);

        // rebuild functions safely
        filterEngine.loadState(parsed, (key, values) => {

    const meta = FILTER_META[key];
    if (!meta) return null;

    // delegate to UI matcher builder
    return filterUI.createMatcher?.(key, values);
});

    } catch (e) {
        console.warn('Invalid saved filter state');
    }
}

renderFilterPanel(filterEngine, filterUI);

/* ---------- Language Toggle ---------- */

function setLang(lang) {
    if (!['en', 'de'].includes(lang)) return;

    window.APP_LANG = lang;

    // rerender everything that uses labels
    renderToolbarExtension();
    SkillListView.updateItems();
    SkillListView.render();

    // optional
    refreshSkillDetails();

}

window.setLang = setLang;
window._skillSearchUpdatePlaceholder?.();

let langHoldActive = false;
let previousLang = null;

window.addEventListener('keydown', e => {
    const isAltGr = e.key === 'AltGraph' || (e.ctrlKey && e.altKey);

    if (!isAltGr || langHoldActive) return;

    langHoldActive = true;
    previousLang = window.APP_LANG;

    setLang(previousLang === 'en' ? 'de' : 'en');
});

window.addEventListener('keyup', e => {
    const isAltGr = e.key === 'AltGraph' || (e.ctrlKey && e.altKey);

    if (!isAltGr || !langHoldActive) return;

    langHoldActive = false;

    if (previousLang) {
        setLang(previousLang);
        previousLang = null;
    }
});

/* ---------- Attribute Control ---------- */

window.refreshSkillDetails = function () {
    if (!window._lastSkill) return;
    if (typeof renderSkillDetails === 'function') {
        renderSkillDetails(window._lastSkill);
    }
};


window.setAttributeValue = function(id, value) {
    id = Number(id);
    if (!Number.isFinite(id)) return;

    value = Math.max(0, Math.min(21, Number(value) || 0));

    if (!window.AttributeValues) window.AttributeValues = {};

    const old = window.AttributeValues[id] ?? 0;
    if (old === value) return;

    window.AttributeValues[id] = value;

    document.dispatchEvent(new Event('attributes:changed'));
};

document.addEventListener('attributes:changed', () => {
    SkillListView.render();
    refreshSkillDetails();
});



/* ---------- Active Skillbar ---------- */

let activeSkillbar = null;

function initActiveSkillbar() {
    const host = document.getElementById('skillbarHost');
    if (!host) return;

    activeSkillbar = createSkillbar({
        skills: Array(8).fill(null),
        mode: 'simulate'
    });

    host.appendChild(activeSkillbar.el);

window.ActiveSkillbar = activeSkillbar;
    window.getActiveSkillbarSkillIds = () => activeSkillbar?.getSkillIds?.() ?? Array(8).fill(null);
}

document.addEventListener('DOMContentLoaded', () => {
    if (SkillStore.ready) {
        initActiveSkillbar();
    } else {
        document.addEventListener('skills:ready', initActiveSkillbar, { once: true });
    }
});

async function openBuildViewerFromActiveSkillbar() {
    const state  = window.ActiveSkillbar?.getState?.() ?? Array(8).fill(null);
    const skills = state.map(s => (s ? s.id : null));

    const payload = {
        name: '',
        description: '',
        primary_prof_id: 0,
        secondary_prof_id: 0,
        skills,
        attributes: {}
    };

    // viewer is a module (clean + isolated)
    const m = await import('./builds/build.viewer.js');
    m.openBuildViewer(payload);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnViewBuild')
        ?.addEventListener('click', openBuildViewerFromActiveSkillbar);
});


/* ---------- Skillbar Panel Visibility ---------- */

window.showSkillbarPanel = function () {
    document.querySelector('.center')
        ?.classList.add('skillbar-open');
};

window.closeSkillbarPanel = function () {
    document.querySelector('.center')
        ?.classList.remove('skillbar-open');
};

window.toggleSkillbarPanel = function () {
    document.querySelector('.center')
        ?.classList.toggle('skillbar-open');
};


/* ----------
// DEV / DEBUG ONLY

window.filterUI = filterUI;
window.engine = filterEngine;

-----BELOW STILL DEV BUT ACTIVE----- */





/* ---------- Skill list header overflow ---------- */

function initSkillHeaderUI() {
    const toolbar = document.getElementById('skillListToolbar');
    const btn = document.getElementById('skillToolbarMore');

    if (!toolbar || !btn) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        toolbar.classList.toggle('expanded');
        toolbar.classList.toggle('collapsed');
    });
}

/* ---------- Right panel ---------- */

window.showRightPanel = function(name, icon) {
if (name === 'builds') {
    // load when user opens builds panel
    // import('./builds/builds.panel.js').then(m => m.refreshBuildsPanel());
}
if (name === 'bookmarks') {
    import('./containers/container.books.ui.js')
        .then(m => m.initBooksPanel());
}

    document.querySelectorAll('.right-panel')
        .forEach(p => p.classList.remove('active'));

    document.querySelectorAll('.right-menu i')
        .forEach(i => i.classList.remove('active'));

    document.getElementById('panel-' + name)
        ?.classList.add('active');

    icon?.classList.add('active');
};


/* =========================
      Mobile swipe + drag
   ========================= */
function snapPanelsToCenter(app) {
    app.style.transition = 'none';
    app.style.transform = 'translateX(-100vw)';
}

function isInteractiveControl(target) {
    return target.closest(
        'input[type="range"], input, textarea, select, button'
    );
}

function isSkillDragging() {
    return (
        window.TouchDragState?.active === true &&
        window.TouchDragState?.confirmed === true
    ) || window.DragState?.skill !== null;
}


document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('.app');
    if (!app) return;

    let startX = 0;
    let deltaX = 0;
    let swiping = false;
let startY = 0;
let deltaY = 0;
let swipeDirection = null; // 'horizontal' | 'vertical' | null

    /* ---------- TOUCH START ---------- */
app.addEventListener('touchstart', e => {
    if (isSkillDragging()) return;
    if (isInteractiveControl(e.target)) return;

    const t = e.touches[0];

    startX = t.clientX;
    startY = t.clientY;

    deltaX = 0;
    deltaY = 0;

    swipeDirection = null;
    swiping = true;

    app.style.transition = 'none';
}, { passive: true });

    /* ---------- SWIPE MOVE (PANELS) ---------- */
app.addEventListener('touchmove', e => {
    if (isSkillDragging()) return;
    if (!swiping) return;
    if (isInteractiveControl(e.target)) return;

    const t = e.touches[0];

    deltaX = t.clientX - startX;
    deltaY = t.clientY - startY;

    // ---- Direction detection (lock once) ----
    if (!swipeDirection) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX + absY < 10) return; // 10 deadzone

        swipeDirection = absX > absY * 1.5 ? 'horizontal' : 'vertical'; // requires the swipe to be 50% more horizontal than vertical. (1.5)
    }

    // ---- If vertical scroll, DO NOTHING ----
    if (swipeDirection === 'vertical') {
        swiping = false; // give control back to browser scroll
        return;
    }

    // ---- Horizontal swipe only ----
    const offset = -window.innerWidth + deltaX;
    app.style.transform = `translateX(${offset}px)`;

}, { passive: true });

    /* ---------- SKILL DRAG MOVE ---------- */
app.addEventListener('touchmove', e => {
    if (!TouchDragState.active) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = Math.abs(touch.clientX - TouchDragState.startX);
    const dy = Math.abs(touch.clientY - TouchDragState.startY);

    if (!TouchDragState.confirmed) {
        if (dx + dy < 8) return;
        TouchDragState.confirmed = true;
        swiping = false;
        snapPanelsToCenter(app);
    }

    e.preventDefault();

    const ghost = document.getElementById('touch-drag-ghost');
    if (ghost) {
        ghost.style.left = touch.clientX + 'px';
        ghost.style.top  = touch.clientY + 'px';
    }

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotEl = el?.closest('.skillbar-slot');

    if (!slotEl) {
    if (TouchDragState.overSlot) {
        TouchDragState.overSlot = false;
        TouchDragState.lastSlot = null;
        activeSkillbar?.clearPreview();

        // show delete preview on origin slot
        const from = TouchDragState.fromIndex;
        if (from != null) {
            // activeSkillbar.slots[from].markWouldRemove();
        }
    }
    return;
}


    const barEl = slotEl.closest('.skillbar');
    if (!barEl || !activeSkillbar || barEl !== activeSkillbar.el) {
        TouchDragState.overSlot = false;
        TouchDragState.lastSlot = null;
        activeSkillbar?.clearPreview();
        return;
    }

    const index = activeSkillbar.slots.findIndex(s => s.el === slotEl);
    if (index === -1) return;

    TouchDragState.overSlot = true;

    if (TouchDragState.lastSlot === index) return;

    activeSkillbar.previewDrop(TouchDragState.skill, index);
    TouchDragState.lastSlot = index;
}, { passive: false });


    /* ---------- TOUCH END ---------- */
app.addEventListener('touchend', e => {

// === CASE 1: SKILL DRAG END ===
if (TouchDragState.active && TouchDragState.confirmed) {
    e.preventDefault();

    const to = TouchDragState.lastSlot;
    const from = TouchDragState.fromIndex;
    const skill = TouchDragState.skill;

    // dropped ON a slot → normal move / swap
    if (to != null && activeSkillbar && skill) {
        activeSkillbar.dropFromMobile(from, to, skill);
    }
    // dropped OUTSIDE → delete (like desktop)
    else if (from != null && activeSkillbar) {
        const state = activeSkillbar.getState();
        state[from] = null;
        activeSkillbar.setState(state);
    }

    resetTouchDragUI();
    swiping = false;
    return;
}


    // === CASE 2: PANEL SWIPE END ===
    if (!swiping) return;

    swiping = false;

    const threshold = window.innerWidth * 0.25;
    app.style.transition = 'transform 280ms ease';

    if (deltaX < -threshold) {
        app.style.transform = 'translateX(-200vw)';
        rotateLeft(app);
    } else if (deltaX > threshold) {
        app.style.transform = 'translateX(0)';
        rotateRight(app);
    } else {
        app.style.transform = 'translateX(-100vw)';
    }
});


});

function ensureTouchDragGhost() {
    if (document.getElementById('touch-drag-ghost')) return;

    const ghost = document.createElement('img');
    ghost.id = 'touch-drag-ghost';
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.width = '56px';
    ghost.style.height = '56px';
    ghost.style.transform = 'translate(-50%, -50%)';
    ghost.style.display = 'none';
    ghost.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,.5))';

    document.body.appendChild(ghost);
}

ensureTouchDragGhost();


function rotateLeft(app) {
    setTimeout(() => {
        const first = app.firstElementChild;
        app.appendChild(first);

        app.style.transition = 'none';
        app.style.transform = 'translateX(-100vw)';
    }, 280);
}

function rotateRight(app) {
    setTimeout(() => {
        const last = app.lastElementChild;
        app.insertBefore(last, app.firstElementChild);

        app.style.transition = 'none';
        app.style.transform = 'translateX(-100vw)';
    }, 280);
}


/* =========================
      Component behavior
   ========================= */
document.addEventListener('dragend', () => {

    // REMOVE skill if dropped outside skillbar
    if (
        DragState?.source === 'skillbar' &&
        DragState.handled === false &&
        activeSkillbar
    ) {
        const from = DragState.fromIndex;

        if (from != null) {
            const state = activeSkillbar.getState();
            state[from] = null;
            activeSkillbar.setState(state);
        }
    }

    resetDragState();
    activeSkillbar?.clearPreview();

    const ghost = document.getElementById('touch-drag-ghost');
    if (ghost) ghost.style.display = 'none';
});



document.addEventListener('touchcancel', () => {
    TouchDragState.skill = null;
    TouchDragState.active = false;
    TouchDragState.lastSlot = null;

const ghost = document.getElementById('touch-drag-ghost');
ghost.style.display = 'none';

    activeSkillbar?.clearPreview();
});


document.addEventListener("click", e => {
    const header = e.target.closest(".book-header");
    if (!header) return;

    header.parentElement.classList.toggle("open");
});

document.querySelectorAll('.view-modes button').forEach(btn => {
    btn.onclick = () => {
        SkillViewMode = btn.dataset.mode;
        SkillListView.updateItems();
        SkillListView.render();
    };
});

function resetTouchDragUI() {
    if (window.TouchDragState) {
        TouchDragState.skill = null;
        TouchDragState.active = false;
	TouchDragState.confirmed = false;

        TouchDragState.lastSlot = null;
        TouchDragState.fromIndex = null;
        TouchDragState.overSlot = false;
    }

    const ghost = document.getElementById('touch-drag-ghost');
    if (ghost) ghost.style.display = 'none';

    activeSkillbar?.clearPreview();
}

function resetDragState() {
    if (window.DragState) {
        window.DragState.skill = null;
    }

    if (window.TouchDragState) {
        TouchDragState.skill = null;
        TouchDragState.active = false;
	TouchDragState.confirmed = false;

        TouchDragState.lastSlot = null;
        TouchDragState.overSlot = false;
    }
}

/* ---------- Skill toolbar ---------- */

const panel = document.querySelector('.skill-toolbar-panel');
const btn = document.getElementById('skillToolbarMore');

if (panel && btn) {

    btn.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('expanded');

        if (panel.classList.contains('expanded')) {
            renderToolbarExtension();
        }
    });

    panel.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', e => {
        if (!panel.classList.contains('expanded')) return;

        if (!panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove('expanded');
        }
    });
}

/* ---------- Undo Key for Active Skillbar panel ---------- */
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');

function updateUndoRedoUI() {
    btnUndo.classList.toggle('disabled', !undoManager.canUndo());
    btnRedo.classList.toggle('disabled', !undoManager.canRedo());
}

window.updateUndoRedoUI = updateUndoRedoUI;

// initial paint
updateUndoRedoUI();

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoManager.undo();
    }
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        undoManager.redo();
    }
});

// clicks
btnUndo.addEventListener('click', () => {
    if (!undoManager.canUndo()) return;
    undoManager.undo();
});

btnRedo.addEventListener('click', () => {
    if (!undoManager.canRedo()) return;
    undoManager.redo();
});


/* ---------- Save Build Button for Active Skillbar panel ---------- */


async function saveCurrentBuild() {
    const state  = activeSkillbar?.getState?.() ?? Array(8).fill(null);
    const skills = state.map(s => (s ? s.id : null));

    const payload = {
        name: 'Unnamed Build',
        description: '',
        is_public: 0,
        position: 0,
        primary_prof_id: 0,
        secondary_prof_id: 0,
        skills,
        attributes: {}
    };

    console.log('SAVE ids:', skills);
    console.log('SAVE state:', state);

    const res = await fetch('/api/build_save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    let data = {};
    try { data = await res.json(); } catch {}

    if (!res.ok) {
        alert(data.error || 'Save failed');
        return;
    }

    alert('Build saved');
    refreshBuildsPanel?.();
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnSaveBuild')
        ?.addEventListener('click', saveCurrentBuild);
});

/* =========================
   Attach condition relations
========================= */

function attachRelationsToSkills() {

    if (!window.SkillStore?.ready) return;
    if (!window.RelationStore?.ready) return;

    for (const skill of SkillStore.all) {

        skill.condition_relations =
            RelationStore.bySkill.get(skill.id) ?? [];
    }

    console.log("Condition relations attached to skills.");
}

document.addEventListener('skills:ready', attachRelationsToSkills);
document.addEventListener('relations:ready', attachRelationsToSkills);

/* =========================
      App data → UI
   ========================= */

let skillListInitialized = false;

async function tryInitSkillList() {
    if (skillListInitialized) return;
    if (!window.SkillStore?.ready) return;
    if (!window.Lookups?.ready) return;

    skillListInitialized = true;

    console.log("INIT SKILL LIST");

    SkillListView.init();

await preloadBooksDeep();
await preloadAllSkillMeta();



// ===== DEFAULT FILTERS =====
filterUI.setEquals('profession',[]);

// DEV / DEBUG ONLY
window.filterUI = filterUI;
window.engine = filterEngine;

SkillListView.updateItems();

/* ============= TEST FILTER ===============
    filterUI.setEquals('profession', Object.keys(Lookups.professions).map(Number));
    filterUI.setEquals('profession', [1, 2, 3, 4, 5, 6]);
   ========================================= */


    SkillListView.render();
    renderSkillListHeader();
    renderToolbarExtension();
    refreshBuildsPanel();
    initSkillHeaderUI?.();
    renderAttributeSettings();
}

/* =========================
      Filters → Skill list
   ========================= */

document.addEventListener("skills:ready", tryInitSkillList);
document.addEventListener("lookups:ready", tryInitSkillList);

tryInitSkillList();

