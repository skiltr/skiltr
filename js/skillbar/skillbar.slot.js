export function createSkillSlot({
    skill = null,
    mode = 'inspect',
    size = 'normal',
    slotIndex = null,
    interactive = true,
    dragSource = 'skillbar' // 'skillbar' | 'builds' | 'list' etc.
} = {}) {



    /* =========================
       State
    ========================= */

    let busy = false;
    let recharging = false;
    let onActivate = null;

    const BLANK_ICON = 'img/blank.png';

    /* =========================
       Root
    ========================= */

    const el = document.createElement('div');
    el.className = `skillbar-slot size-${size}`;

    // REAL icon (persistent)
const iconWrapper = document.createElement('div');
iconWrapper.className = 'skillbar-icon-wrapper';

const img = document.createElement('img');
img.className = 'skillbar-icon';
img.src = BLANK_ICON;

iconWrapper.appendChild(img);
el.appendChild(iconWrapper);


    // PREVIEW icon (overlay only)
    const previewImg = document.createElement('img');
    previewImg.className = 'skillbar-preview-icon';
    previewImg.style.display = 'none';
    el.appendChild(previewImg);

    /* =========================
       Layers
    ========================= */

    const castDark = div('cast-dark');
    const flash = div('flash');
    const cast = div('cast');
    const recharge = div('recharge');
    const rechargeMask = div('recharge-mask');

    recharge.appendChild(rechargeMask);
    cast.append(ring(), ring(), ring(), tri('tr'), tri('tl'), tri('br'), tri('bl'));
    el.append(castDark, flash, cast, recharge);

    if (skill) setSkill(skill);

/* =========================
   Interaction
========================= */

if (interactive) {

    el.addEventListener('click', () => {
        if (!skill) return;
        if (recharging) return;
        if (mode === 'simulate' && onActivate) {
            onActivate(slotApi, skill);
        }
    });

    el.draggable = true;

    let dragCandidate = false;
    let startX = 0;
    let startY = 0;

    el.addEventListener('mousedown', e => {
        if (!skill) return;

        dragCandidate = true;
        startX = e.clientX;
        startY = e.clientY;
    });

    el.addEventListener('mousemove', e => {
        if (!dragCandidate || !skill) return;

        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);

        if (dx + dy > 6) {
            el.draggable = true;
        }
    });

    el.addEventListener('mouseup', () => {
        dragCandidate = false;
        el.draggable = false;
    });

el.addEventListener('touchstart', e => {
    if (!skill) return;

    const t = e.touches[0];

    TouchDragState.active = true;
    TouchDragState.confirmed = false;
    TouchDragState.skill = skill;

    TouchDragState.fromIndex = (dragSource === 'skillbar') ? slotIndex : null;
    TouchDragState.lastSlot = null;

    TouchDragState.startX = t.clientX;
    TouchDragState.startY = t.clientY;
});


el.addEventListener('dragstart', e => {
    if (!skill) return;

    DragState.skill = skill;
    DragState.source = dragSource;
    DragState.fromIndex = (dragSource === 'skillbar') ? slotIndex : null;
    DragState.handled = false;

    e.dataTransfer.setData('text/plain', skill.id);
    e.dataTransfer.effectAllowed = 'copy';
});


} else {
    // make sure it never initiates drag in passive mode
    el.draggable = false;
}

    /* =========================
       Core API
    ========================= */

function setSkill(s) {
    skill = s;

    // clear previous overlay
    const oldOverlay = iconWrapper.querySelector('.skilltype-overlay-icon');
    if (oldOverlay) oldOverlay.remove();

    if (!s) {
        img.src = BLANK_ICON;
        return;
    }

    const name = s.name_en.replace(/[ "]/g, '_');
    img.src = `https://guildwars.magical.ch/img/skill_icons/${name}.jpg`;

    // ==== SKILLTYPE OVERLAY ====
    const type = Lookups.skillTypes?.[s.type];

    if (type?.icon) {
        const overlay = document.createElement('img');
        overlay.className = 'skilltype-overlay-icon';
        overlay.src = `https://skiltr.magical.ch/img/icons/${type.icon}.png`;
        overlay.alt = '';
        overlay.draggable = false;

        iconWrapper.appendChild(overlay);
    }
}


function clear() {
    skill = null;
    img.src = BLANK_ICON;

    const oldOverlay = iconWrapper.querySelector('.skilltype-overlay-icon');
    if (oldOverlay) oldOverlay.remove();
}


    function beginActivation() {
        if (recharging) return;
        busy = true;
        cast.style.opacity = 1;
        castDark.style.opacity = 1;
    }

    function finishActivation() {
        cast.style.opacity = 0;
        castDark.style.opacity = 0.4;

        flash.style.transition = 'none';
        flash.style.opacity = 0.5;
        requestAnimationFrame(() => {
            flash.style.transition = 'opacity 80ms linear';
            flash.style.opacity = 0;
        });
    }

    function playRecharge(rechargeMs) {
        return new Promise(resolve => {
            recharging = true;
            recharge.style.opacity = 1;
            animateRecharge(rechargeMask, rechargeMs);

            setTimeout(() => {
                recharge.style.opacity = 0;
                castDark.style.opacity = 0;
                busy = false;
                recharging = false;
                resolve();
            }, rechargeMs);
        });
    }

    function cancel() {
        cast.style.opacity = 0;
        recharge.style.opacity = 0;
        flash.style.opacity = 0;
        castDark.style.opacity = 0;
        busy = false;
        recharging = false;
    }

    function isRecharging() {
        return recharging;
    }

    /* =========================
       PREVIEW (PURE VISUAL)
    ========================= */

    function setPreviewSkill(s) {
        const name = s.name_en.replace(/[ "]/g, '_');
        previewImg.src = `https://guildwars.magical.ch/img/skill_icons/${name}.jpg`;
        previewImg.style.display = '';
        el.classList.add('preview-add');
    }

    function markWouldRemove() {
        el.classList.add('preview-remove');
    }

    function clearPreview() {
        previewImg.style.display = 'none';
        previewImg.src = '';
        el.classList.remove('preview-add', 'preview-remove');
    }

    /* =========================
       Public API
    ========================= */

    const slotApi = {
        el,
        setSkill,
        clear,
        setMode: m => mode = m,
        beginActivation,
        finishActivation,
        playRecharge,
        cancel,
        isRecharging,
        onActivate: fn => onActivate = fn,
        setPreviewSkill,
        markWouldRemove,
        clearPreview
    };

    return slotApi;
}

/* =========================
   Helpers
========================= */

function div(cls) {
    const d = document.createElement('div');
    d.className = cls;
    return d;
}
function ring() { return div('ring'); }
function tri(pos) { return div(`triangle ${pos}`); }

function animateRecharge(mask, dur) {
    const start = performance.now();

    function frame(t) {
        const p = Math.min((t - start) / dur, 1);
        const angle = (1 - p) * 360;
        mask.style.clipPath = clockClipMirrored(angle);
        if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function clockClipMirrored(angle) {
    const pts = ["50% 50%", "50% 0%"];

    for (let a = 0; a <= angle; a += 4) {
        const r = (-a - 90) * Math.PI / 180;
        pts.push(
            `${50 + Math.cos(r) * 100}% ${50 + Math.sin(r) * 100}%`
        );
    }

    return `polygon(${pts.join(",")})`;
}
