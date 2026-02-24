// /js/builds/build.viewer.js

import {
    renderBarChart,
    renderPieChart
} from './build.stats.charts.js';

let attrListener = null;
let attributeBackup = null;
window.BuildViewerActive = false;

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

function getSkillById(id) {
    if (id == null) return null;
    const n = Number(id);
    if (!Number.isFinite(n)) return null;
    return window.SkillStore?.byId?.get?.(n) ?? null; // Map
}

function normalizeIds(skillIds) {
    const ids = Array.isArray(skillIds) ? skillIds.slice(0, 8) : [];
    while (ids.length < 8) ids.push(null);
    return ids;
}

function buildStateFromIds(skillIds) {
    return normalizeIds(skillIds).map(getSkillById);
}

const attributeMap = {};
const attrs = window.Lookups?.attributes || {};

for (const a of Object.values(attrs)) {
    if (!a) continue;
    const id = Number(a.id);
    if (!Number.isFinite(id)) continue;

    const name =
        (a.name?.en ?? a.name ?? '').trim() || 'Other';

    attributeMap[id] = name;
}

/* =========================
   GW template encoder (JS)
   Ported from your PHP createTemplate() pipeline
========================= */

const _B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function _padBits(bin, len) {
    bin = String(bin || '');
    if (bin.length >= len) return bin;
    return '0'.repeat(len - bin.length) + bin;
}

function _decToBin(n, len) {
    n = Number(n) || 0;
    return _padBits(n.toString(2), len);
}

function _flip(s) {
    return String(s).split('').reverse().join('');
}

function _flipAndConcatSegments(binaryStringWithSpaces) {
    const segs = binaryStringWithSpaces.trim().split(/\s+/);
    return segs.map(_flip).join('');
}

function _splitInto6AndFlipEach(bitStream) {
    // pad to multiple of 6 (GW templates are 6-bit base64)
    const pad = (6 - (bitStream.length % 6)) % 6;
    if (pad) bitStream = bitStream + '0'.repeat(pad);

    const chunks = bitStream.match(/.{1,6}/g) || [];
    return chunks.map(_flip); // returns array of flipped 6-bit strings
}

function _bin6ToBase64(chunksFlipped6) {
    let out = '';
    for (const b of chunksFlipped6) {
        const dec = parseInt(b, 2) || 0;
        out += _B64[dec] || 'A';
    }
    return out;
}

function createTemplate(professions, attributes, skills) {
    // professions: [primaryId, secondaryId]
    // attributes: object map { attributeId: points(0..12) }
    // skills: [8 ids] (0 allowed for empty)

    const primary = Number(professions?.[0] ?? 0) || 0;
    const secondary = Number(professions?.[1] ?? 0) || 0;

    // Header (matches your PHP createBinary hardcode):
    // '1110 0000 00 '  => TemplateType=14, Version=0, ProfessionCode=0 (=> 4 bits/prof)
    let bin = '1110 0000 00 ';

    // Professions (4 bits each because professionCode=0)
    bin += _decToBin(primary, 4) + ' ';
    bin += _decToBin(secondary, 4) + ' ';

    // Attributes
    const attrEntries = [];
    if (attributes && typeof attributes === 'object') {
        for (const [idRaw, ptsRaw] of Object.entries(attributes)) {
            const id = Number(idRaw);
            let pts = Number(ptsRaw) || 0;
            if (!Number.isFinite(id)) continue;
            if (pts < 0) pts = 0;
            if (pts > 12) pts = 12;       // BUILD CAP
            if (pts === 0) continue;      // do not encode zeros
            attrEntries.push([id, pts]);
        }
    }

    const attributeCount = attrEntries.length;
    bin += _decToBin(attributeCount, 4) + ' ';

    let bitsPerAttrId = 4;
    if (attributeCount) {
        const maxId = Math.max(...attrEntries.map(x => x[0]));
        bitsPerAttrId = Math.max(4, maxId.toString(2).length);
    }
    const attrCode = bitsPerAttrId - 4; // 4-bit code
    bin += _decToBin(attrCode, 4) + ' ';

    for (const [id, pts] of attrEntries) {
        bin += _decToBin(id, bitsPerAttrId) + ' ';
        bin += _decToBin(pts, 4) + ' ';
    }

    // Skills
    const skills8 = Array.isArray(skills) ? skills.slice(0, 8) : [];
    while (skills8.length < 8) skills8.push(0);

    const maxSkillId = Math.max(...skills8.map(x => Number(x) || 0));
    const bitsPerSkillId = Math.max(8, maxSkillId.toString(2).length);
    const skillCode = bitsPerSkillId - 8;

    bin += _decToBin(skillCode, 4) + ' ';
    for (const sid of skills8) {
        bin += _decToBin(Number(sid) || 0, bitsPerSkillId) + ' ';
    }

    // Tail (your decoder expects 1 bit)
    bin += '0';

    // Pipeline steps (matches your PHP):
    // 1) flip each segment and concatenate
    const flippedStream = _flipAndConcatSegments(bin);

    // 2) split into 6-bit chunks and flip each chunk
    const chunksFlipped6 = _splitInto6AndFlipEach(flippedStream);

    // 3) map to base64 chars
    return _bin6ToBase64(chunksFlipped6);
}

function _b64ToDec(ch) {
    return _B64.indexOf(ch);
}
function _decToBin6(n) {
    n = Number(n) || 0;
    let b = n.toString(2);
    if (b.length < 6) b = '0'.repeat(6 - b.length) + b;
    return b.slice(-6);
}
function _getBits(streamObj, count) {
    const bits = streamObj.s.slice(0, count);
    streamObj.s = streamObj.s.slice(count);
    return _flip(bits); // IMPORTANT: matches your PHP getBits() behavior
}

function decodeTemplate(template) {
    if (!template || typeof template !== 'string') return null;

    // 1) base64 chars -> 6-bit -> flip each 6-bit -> concat
    const vals = template.trim().split('').map(_b64ToDec);
    if (vals.some(v => v < 0)) return null;

    const bin6 = vals.map(_decToBin6).map(_flip); // flip each 6-bit
    const bitStream = bin6.join('');              // concatenated

    const streamObj = { s: bitStream };
    const out = {
        templateType: 0,
        version: 0,
        profBits: 0,
        primary: 0,
        secondary: 0,
        attributes: [], // [{ id, points }]
        skills: []      // [8 ids]
    };

    // Header
    out.templateType = parseInt(_getBits(streamObj, 4), 2) || 0;
    out.version      = parseInt(_getBits(streamObj, 4), 2) || 0;

    // Professions
    const bitsPerProf = (parseInt(_getBits(streamObj, 2), 2) || 0) * 2 + 4;
    out.profBits = bitsPerProf;

    out.primary   = parseInt(_getBits(streamObj, bitsPerProf), 2) || 0;
    out.secondary = parseInt(_getBits(streamObj, bitsPerProf), 2) || 0;

    // Attributes
    const attrCount = parseInt(_getBits(streamObj, 4), 2) || 0;
    const bitsPerAttrId = (parseInt(_getBits(streamObj, 4), 2) || 0) + 4;

    for (let i = 0; i < attrCount; i++) {
        const id  = parseInt(_getBits(streamObj, bitsPerAttrId), 2) || 0;
        const pts = parseInt(_getBits(streamObj, 4), 2) || 0;
        out.attributes.push({ id, points: pts });
    }

    // Skills
    const bitsPerSkillId = (parseInt(_getBits(streamObj, 4), 2) || 0) + 8;
    for (let i = 0; i < 8; i++) {
        const sid = parseInt(_getBits(streamObj, bitsPerSkillId), 2) || 0;
        out.skills.push(sid);
    }

    // Tail (ignore)
    _getBits(streamObj, 1);

    return out;
}

function getAttributeEnNameById(id) {
    const attrs = window.Lookups?.attributes;
    if (!attrs) return null;
    const a = attrs[id];
    const nm = (a?.name?.en ?? a?.name ?? '').trim();
    return nm || null;
}

// expose for builds panel + others
window.createGWBuildCode = function ({
    primaryProf,
    secondaryProf,
    skills,
    attributes
}) {
    return createTemplate(
        [Number(primaryProf) || 0, Number(secondaryProf) || 0],
        attributes || {},
        skills || []
    );
};


/* =========================
   Profession helpers
   - Tango icons use EN names
   - Filename: ${ProfessionName}-tango-icon-200.png
========================= */

function capitalizeFirst(str) {
    str = (str ?? '').trim();
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getProfessionNameEnById(id) {
    return window.UI?.PROFESSION_EN?.[Number(id)] ?? null;
}


function getProfessionIconUrlById(id) {
    const en = window.UI?.PROFESSION_EN?.[Number(id)];
    return en
        ? `https://guildwars.magical.ch/img/icons/${en}-tango-icon-200.png`
        : null;
}

function recomputeAndSetTitle(titleEl, primaryProf, secondaryProf) {
    const lang = getLang();
    const p = getProfessionNameById(primaryProf, lang);
    const s = getProfessionNameById(secondaryProf, lang);

    const parts = [];
    if (p) parts.push(p);
    if (s) parts.push(s);
    if (!parts.length) parts.push('—');

    const name = `${parts.join(' ')} Build`.trim();

    titleEl.value = name;
    titleEl.placeholder = name;
}



function inferProfessionsFromSkills(state) {
    // state: [skillObj|null] length 8
    let primary = 0;
    let secondary = 0;

    for (const s of state) {
        const pid = Number(s?.profession ?? 0);
        if (!Number.isFinite(pid) || pid <= 0) continue;

        if (!primary) {
            primary = pid;
            continue;
        }
        if (pid !== primary) {
            secondary = pid;
            break;
        }
    }

    return { primary, secondary };
}

function professionLabel(id) {
    const n = Number(id) || 0;
    if (!n) return '—';
    return getProfessionNameEnById(n) || `#${n}`;
}

function getLang() {
    return (window.APP_LANG === 'de') ? 'de' : 'en';
}

function getProfessionNameById(id, lang = 'en') {
    const n = Number(id) || 0;
    if (!n) return null;

    const profs = window.Lookups?.professions;
    if (!profs) return null;

    const v = profs[n];

    // supports: array of strings OR array/object with {en,de}
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
        return v[lang] ?? v.en ?? v.de ?? null;
    }

    return null;
}

function getAttributeProfessionId(attr) {
    if (!attr) return 0;

    // 1) preferred: numeric profession_id
    if (Number.isFinite(Number(attr.profession_id))) {
        return Number(attr.profession_id);
    }

    // 2) fallback: string profession name ("Monk", "Warrior", ...)
    const p = attr.profession;
    if (typeof p === 'string' && p) {
        // reverse lookup via canonical EN table
        for (const [id, name] of Object.entries(window.UI?.PROFESSION_EN || {})) {
            if (name === p) return Number(id);
        }
    }

    return 0;
}


function renderProfessionIcons(container, primaryId, secondaryId, onSwap) {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.gap = '6px';
    container.style.alignItems = 'center';

    const canSwap = !!(primaryId && secondaryId);

    function makeIcon(pid, title) {
        const url = getProfessionIconUrlById(pid);

        const img = document.createElement('img');
        img.className = 'bv-prof-icon';
        img.style.width = '26px';
        img.style.height = '26px';
        img.style.borderRadius = '6px';
        img.style.objectFit = 'cover';
        img.style.opacity = url ? '1' : '0.35';
        img.style.cursor = canSwap ? 'pointer' : 'default';
        img.title = title;

        img.src = url || 'img/blank.png';

        if (canSwap) {
            img.addEventListener('click', () => onSwap?.());
        }

        return img;
    }

    container.appendChild(makeIcon(primaryId, 'Primary profession (click to swap)'));
    container.appendChild(makeIcon(secondaryId, 'Secondary profession (click to swap)'));
}

/* =========================
   Viewer mounting / toggles
========================= */

function ensureViewerHost() {

    const panel = document.querySelector('.panel.skill-list-panel');
    if (!panel) return null;

    let host = document.getElementById('buildViewerHost');
    if (host) return host;

host = document.createElement('div');
host.id = 'buildViewerHost';
host.classList.add('scrollable');
host.style.display = 'none';
host.style.height = '100%';
host.style.overflow = 'auto';
host.style.padding = '10px';

    panel.appendChild(host);
    return host;
}

function getSkillListRoot() {
    return document.querySelector('.panel.skill-list-panel .skill-list');
}

function showViewer() {
    const skillList = getSkillListRoot();
    const host = ensureViewerHost();
    if (!host) return null;

    if (skillList) skillList.style.display = 'none';
    host.style.display = '';
    return host;
}

export function closeBuildViewer() {
    const skillList = getSkillListRoot();
    const host = ensureViewerHost();
    if (!host) return;

    if (attrListener) {
        document.removeEventListener('attributes:changed', attrListener);
        attrListener = null;
    }

    host.innerHTML = '';
    host.style.display = 'none';

    if (skillList) skillList.style.display = '';

    // ===== RESTORE GLOBAL ATTRIBUTE STATE =====
    if (attributeBackup) {
        window.AttributeValues = { ...attributeBackup };
        attributeBackup = null;
    }

    window.BuildViewerActive = false;

    document.dispatchEvent(new Event('attributes:changed'));
}



/* =========================
   API
========================= */

export function openBuildViewer(build) {
window.BuildViewerActive = true;
// ===== BACKUP GLOBAL ATTRIBUTE STATE =====
attributeBackup = { ...(window.AttributeValues || {}) };

// ensure bag exists
if (!window.AttributeValues) window.AttributeValues = {};

// zero EVERYTHING
for (const key of Object.keys(window.AttributeValues)) {
    window.AttributeValues[key] = 0;
}

    const host = showViewer();
    if (!host) return;

    host.innerHTML = '';

    const b = build || {};
// ===== APPLY BUILD ATTRIBUTE VALUES =====
if (!window.AttributeValues) window.AttributeValues = {};

if (b.attributes && typeof b.attributes === 'object') {
    for (const [idRaw, valRaw] of Object.entries(b.attributes)) {
        const id = Number(idRaw);
        let val = Number(valRaw) || 0;
        if (!Number.isFinite(id)) continue;

        if (val < 0) val = 0;
        if (val > 12) val = 12;

        window.AttributeValues[id] = val;
    }
}

document.dispatchEvent(new Event('attributes:changed'));

    const skillIds = normalizeIds(b.skills);
    const state = buildStateFromIds(skillIds);

let ActiveAttrKeys = new Set();

let skillsListEl = null;

function renderViewerSkillRows() {
    if (!skillsListEl) return;

    skillsListEl.innerHTML = '';
    for (const s of state) {
        if (!s) continue;
        const rowEl = window.renderSkillRowDetailed?.(s);
        if (rowEl) skillsListEl.appendChild(rowEl);
    }
}

const bcUI = {
  inputEl: null,
  btnEl: null
};


    // Professions: passed-in OR inferred (from skills left->right)
    let primaryProf = Number(b.primary_prof_id ?? 0) || 0;
    let secondaryProf = Number(b.secondary_prof_id ?? 0) || 0;

    if (!primaryProf && !secondaryProf) {
        const inferred = inferProfessionsFromSkills(state);
        primaryProf = inferred.primary;
        secondaryProf = inferred.secondary;
    }

const lang = getLang();
const pName = getProfessionNameById(primaryProf, lang);
const sName = getProfessionNameById(secondaryProf, lang);
const buildWord = (lang === 'de') ? 'Build' : 'Build';

const parts = [];
if (pName) parts.push(pName);
if (sName) parts.push(sName);
if (!parts.length) parts.push('—');

const defaultName = `${parts.join(' ')} ${buildWord}`.trim();
const initialName = (b.name && String(b.name).trim())
    ? String(b.name).trim()
    : defaultName;



    /* ---------- Header ---------- */
    const top = el('div', 'bv-top');
    top.style.display = 'flex';
    top.style.gap = '8px';
    top.style.alignItems = 'center';
    top.style.justifyContent = 'space-between';

const title = document.createElement('input');
title.className = 'bv-title bv-title-input';
title.type = 'text';

title.style.fontSize = '18px';
title.style.fontWeight = '600';
title.style.width = '100%';
title.style.background = 'transparent';
title.style.border = '1px solid rgba(255,255,255,0.10)';
title.style.borderRadius = '10px';
title.style.padding = '8px 10px';
title.style.color = 'inherit';

title.value = initialName;
title.placeholder = defaultName;

title.addEventListener('input', () => {
    b.name = title.value;
});


const btnClose = document.createElement('button');
btnClose.className = 'bv-btn bv-icon-btn bv-close';
btnClose.innerHTML = '<i class="fa-solid fa-down-from-line"></i>';
btnClose.title = 'Close';
btnClose.addEventListener('click', closeBuildViewer);

const headerActions = el('div', 'bv-header-actions');

const btnLoad = document.createElement('button');
btnLoad.className = 'bv-btn bv-icon-btn bv-load';
btnLoad.innerHTML = '<i class="fa-solid fa-arrow-turn-down-left"></i>';
btnLoad.title = 'Load into Skillbar';
btnLoad.addEventListener('click', () => {
    window.ActiveSkillbar?.setState?.(state);
    window.showSkillbarPanel?.();
});

const btnSave = document.createElement('button');
btnSave.className = 'bv-btn bv-icon-btn bv-save';
btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
btnSave.title = 'Save Build';
btnSave.addEventListener('click', async () => {
    const payload = getCurrentPayload();

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

    if (data.user_build_id) b.user_build_id = data.user_build_id;

    try {
        const m = await import('./builds.panel.js');
        await m.refreshBuildsPanel?.();
    } catch {}

    alert('Saved.');
});

headerActions.appendChild(btnLoad);
headerActions.appendChild(btnSave);
headerActions.appendChild(btnClose);

    const titleWrap = el('div', 'bv-title-wrap');
    titleWrap.style.display = 'flex';
    titleWrap.style.gap = '10px';
    titleWrap.style.alignItems = 'center';

    const profIcons = el('div', 'bv-prof-icons');

    let line2 = null;

    function swapProfessions() {
    const a = primaryProf;
    primaryProf = secondaryProf;
    secondaryProf = a;

    // force new secondary primary attribute to 0
    const sAttrs = listAttributesForProfessionId(secondaryProf);
    const sPrimary = sAttrs.find(a =>
        String(a.type || '').toLowerCase() === 'primary'
    );

    if (sPrimary) {
        const k = Number(sPrimary.id);
        if (Number.isFinite(k)) {
            window.setAttributeValue(k, 0);
        }
    }

    renderProfessionIcons(profIcons, primaryProf, secondaryProf, swapProfessions);
    renderAttrs();

    if (!String(b.name || '').trim()) {
        const lang2 = getLang();
        const p2 = getProfessionNameById(primaryProf, lang2);
        const s2 = getProfessionNameById(secondaryProf, lang2);

        const parts2 = [];
        if (p2) parts2.push(p2);
        if (s2) parts2.push(s2);
        if (!parts2.length) parts2.push('—');

        const def2 = `${parts2.join(' ')} ${lang2 === 'de' ? 'Build' : 'Build'}`.trim();
        title.value = def2;
        title.placeholder = def2;
    }

    if (line2) {
        line2.textContent =
            `Professions: ${professionLabel(primaryProf)} / ${professionLabel(secondaryProf)}`;
    }
}


    renderProfessionIcons(profIcons, primaryProf, secondaryProf, swapProfessions);

function getAttrValue(attrName) {
    const bag = window.AttributeValues;
    if (!bag) return 0;
    const v = Number(bag[attrName]);
    return Number.isFinite(v) ? v : 0;
}

function setAttrValue(attrName, v) {
    if (!window.AttributeValues) window.AttributeValues = {};
    window.AttributeValues[attrName] = v;
}



function getProfessionColorById(profId) {
    const id = Number(profId) || 0;
    return window.UI?.PROFESSION_COLORS?.[id] ?? '#777';
}


function listAttributesForProfessionId(profId) {
    const attrs = window.Lookups?.attributes;
    if (!attrs || !profId) return [];

    const pid = Number(profId);

    const out = Object.values(attrs)
        .filter(a => getAttributeProfessionId(a) === pid);



    // Primary attribute first, then alphabetical by EN name
    out.sort((a, b) => {
        const ap = String(a.type || '').toLowerCase() === 'primary';
        const bp = String(b.type || '').toLowerCase() === 'primary';
        if (ap !== bp) return ap ? -1 : 1;

        const an = a?.name?.en ?? String(a?.name ?? '');
        const bn = b?.name?.en ?? String(b?.name ?? '');
        return an.localeCompare(bn);
    });

    return out;
}

function getAttributeIdByEnName(enName) {
    const attrs = window.Lookups?.attributes;
    if (!attrs || !enName) return null;

    for (const a of Object.values(attrs)) {
        const nm = (a?.name?.en ?? a?.name ?? '').trim();
        if (nm === enName) return Number(a.id);
    }
    return null;
}


function renderAttributeColumn({
    host,
    profId,
    sideLabel,
    isSecondary = false,
    onAnyChange
}) {
    host.innerHTML = '';

    const profName = getProfessionNameEnById(profId);
    const color = getProfessionColorById(profId);

    const header = el('div', 'bv-attr-header');
    header.style.borderBottom = `1px solid ${color}33`;
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '8px';
    header.style.marginBottom = '8px';

    const iconUrl = getProfessionIconUrlById(profId);
    const img = document.createElement('img');
    img.className = 'bv-attr-prof-icon';
    img.style.width = '28px';
    img.style.height = '28px';
    img.style.borderRadius = '6px';
    img.style.objectFit = 'cover';
    img.src = iconUrl || 'img/blank.png';

    const title = el(
        'div',
        'bv-attr-title',
        profName ? `${sideLabel}: ${profName}` : `${sideLabel}: —`
    );
    title.style.fontWeight = '600';

    header.appendChild(img);
    header.appendChild(title);
    host.appendChild(header);

    if (!profName) return;

    const attrs = listAttributesForProfessionId(profId);
    if (!attrs.length) return;

    const list = el('div', 'bv-attr-list');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    attrs.forEach(attr => {
        const key = Number(attr.id);
if (!Number.isFinite(key)) return;


        const isPrimary = String(attr.type || '').toLowerCase() === 'primary';
        const lockedPrimary = isSecondary && isPrimary;

        // Ensure state exists (but do NOT overwrite)
        if (!window.AttributeValues) window.AttributeValues = {};
        if (window.AttributeValues[key] == null) {
            window.AttributeValues[key] = 0;
        }

        const row = el('div', 'bv-attr-row');
        row.style.padding = '8px';
        row.style.borderRadius = '10px';
        row.style.background = 'rgba(255,255,255,0.04)';

        const top = el('div', 'bv-attr-row-top');
        top.style.display = 'flex';
        top.style.justifyContent = 'space-between';
        top.style.alignItems = 'center';

        const n = el('div', 'bv-attr-name', attributeMap[key] ?? key);
        n.style.fontWeight = '600';
        n.style.color = color;

        const v = el(
            'div',
            'bv-attr-value',
            String(window.AttributeValues[key] ?? 0)
        );
        v.style.color = color;

        top.appendChild(n);
        top.appendChild(v);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '12';
        slider.value = String(window.AttributeValues[key] ?? 0);
        slider.style.width = '100%';
        slider.style.marginTop = '6px';
        slider.style.accentColor = color;

        if (lockedPrimary) {
            slider.disabled = true;
        }

slider.addEventListener('input', () => {
    if (lockedPrimary) return;

    const want = parseInt(slider.value, 10) || 0;
    const old  = window.AttributeValues?.[key] ?? 0;

    const usedBefore = usedForActiveKeys();
    const usedAfter =
        usedBefore
        - rankCost(old)
        + rankCost(want);

    if (usedAfter > 200) {
        slider.value = String(old); // revert
        return;
    }

    window.setAttributeValue(key, want);
});

        const sync = () => {
            const current = window.AttributeValues?.[key] ?? 0;
            slider.value = String(current);
            v.textContent = String(current);
        };

        document.addEventListener('attributes:changed', sync);

        row.appendChild(top);
        row.appendChild(slider);
        list.appendChild(row);
    });

    host.appendChild(list);
}

    titleWrap.appendChild(profIcons);
    titleWrap.appendChild(title);

    top.appendChild(titleWrap);
top.appendChild(headerActions);
    host.appendChild(top);

    /* ---------- Info block (editable later) ---------- */
    const meta = el('div', 'bv-meta');
    meta.style.marginTop = '10px';
    meta.style.opacity = '0.95';

    const line1 = el(
        'div',
        'bv-line',
        `Build ID: ${b.user_build_id ?? '—'}  |  GW Build: ${b.gw_build_id ?? '—'}`
    );

    line2 = el(
        'div',
        'bv-line',
        `Professions: ${professionLabel(primaryProf)} / ${professionLabel(secondaryProf)}`
    );

   // meta.appendChild(line1);
   // meta.appendChild(line2);
    host.appendChild(meta);

/* ---------- Buildcode (encode + decode) ---------- */

function refreshBuildCode() {
    if (!bcUI.inputEl) return;

    const skillIds = [];
    for (let i = 0; i < 8; i++) {
        const s = state[i] ?? null;
        skillIds.push(Number(s?.id ?? 0) || 0);
    }

    const attrObj = {};
    const keys = (ActiveAttrKeys instanceof Set)
        ? Array.from(ActiveAttrKeys)
: Object.keys(window.AttributeValues || {});

    for (const key of keys) {
let lvl = Number(window.AttributeValues?.[key] ?? 0) || 0;
        if (lvl < 0) lvl = 0;
        if (lvl > 12) lvl = 12;
        if (lvl === 0) continue;

        attrObj[key] = lvl;

    }

    const code = createTemplate(
        [Number(primaryProf) || 0, Number(secondaryProf) || 0],
        attrObj,
        skillIds
    );

    bcUI.inputEl.value = code;
}


function applyDecodedToViewer(decoded) {
    if (!decoded) return;

    // professions
    primaryProf = Number(decoded.primary) || 0;
    secondaryProf = Number(decoded.secondary) || 0;

    renderProfessionIcons(profIcons, primaryProf, secondaryProf, swapProfessions);
    if (line2) {
        line2.textContent = `Professions: ${professionLabel(primaryProf)} / ${professionLabel(secondaryProf)}`;
    }

    // skills (update state in place)
    for (let i = 0; i < 8; i++) {
        const sid = Number(decoded.skills?.[i] ?? 0) || 0;
        state[i] = sid ? getSkillById(sid) : null;
    }


    for (const a of (decoded.attributes || [])) {
        const id = Number(a.id) || 0;
        let pts = Number(a.points) || 0;
        if (pts < 0) pts = 0;
        if (pts > 12) pts = 12;

        window.setAttributeValue(id, pts);


    }

    // rerender attrs (enforces secondary primary=0 + budget)
    renderAttrs();

renderViewerSkillRows();

recomputeAndSetTitle(title, primaryProf, secondaryProf);


    // show normalized code
    refreshBuildCode();
}

function runDecodeFromInput() {
    const code = (bcUI.inputEl?.value || '').trim();

    if (!code) return;

    const decoded = decodeTemplate(code);
    if (!decoded) {
        alert('Invalid buildcode');
        return;
    }

    applyDecodedToViewer(decoded);
}

// UI container
const bcBox = el('div', 'bv-buildcode');
bcBox.style.marginTop = '14px';

const bcTitle = el('div', 'bv-subtitle', 'Buildcode');
bcTitle.style.fontWeight = '600';
bcTitle.style.marginBottom = '8px';
// bcBox.appendChild(bcTitle);

// input + button row
const bcRow = el('div', 'bv-buildcode-row');
bcRow.style.display = 'flex';
bcRow.style.gap = '8px';
bcRow.style.alignItems = 'center';

bcUI.inputEl = document.createElement('input');
bcUI.inputEl.type = 'text';
bcUI.inputEl.className = 'bv-buildcode-input';
bcUI.inputEl.placeholder = '';
bcUI.inputEl.style.flex = '1 1 auto';
bcUI.inputEl.style.padding = '10px';
bcUI.inputEl.style.borderRadius = '10px';
bcUI.inputEl.style.border = '1px solid rgba(255,255,255,0.12)';
bcUI.inputEl.style.background = 'rgba(0,0,0,0.25)';
bcUI.inputEl.style.color = 'inherit';

bcUI.btnEl = document.createElement('button');
bcUI.btnEl.className = 'bv-btn bv-icon-btn bv-decode';
bcUI.btnEl.innerHTML = '<i class="fa-solid fa-code"></i>';
bcUI.btnEl.title = 'Decode buildcode';
bcUI.btnEl.addEventListener('click', runDecodeFromInput);

bcUI.inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        runDecodeFromInput();
    }
});

bcRow.appendChild(bcUI.inputEl);
bcRow.appendChild(bcUI.btnEl);
bcBox.appendChild(bcRow);
host.appendChild(bcBox);


// initial
refreshBuildCode();

/* ---------- Attributes (collapsible + two columns) ---------- */




// which attribute keys are currently relevant (only the two shown professions)


function usedForActiveKeys() {
    let used = 0;
for (const k of ActiveAttrKeys) used += rankCost(window.AttributeValues?.[k] ?? 0);
    return used;
}

// Cost curve: rank r costs 1+2+...+r
function rankCost(r) {
    r = Number(r) || 0;
    if (r <= 0) return 0;
    return (r * (r + 1)) / 2;
}
function totalUsed() {
    let used = 0;
for (const v of Object.values(window.AttributeValues || {})) used += rankCost(v);
    return used;
}

// Clamp initial values to 200 in DISPLAY ORDER (top to bottom, left to right)
function clampToBudget(primaryProfId, secondaryProfId) {

    const pAttrs = listAttributesForProfessionId(primaryProfId);
    const sAttrs = listAttributesForProfessionId(secondaryProfId);

    // secondary primary must be 0
    const sPrimary = sAttrs.find(a => String(a.type || '').toLowerCase() === 'primary');
    if (sPrimary) {
        const k = Number(sPrimary.id);
        if (k) window.setAttributeValue(k, 0);
    }

    const order = [...pAttrs, ...sAttrs];

    // ensure keys exist
    for (const a of order) {
    const k = Number(a.id);
    if (!Number.isFinite(k)) continue;

    if (window.AttributeValues[k] == null) {
        window.setAttributeValue(k, 0);
    }
}


    let used = usedForActiveKeys();
    if (used <= 200) return;

    for (let i = order.length - 1; i >= 0 && used > 200; i--) {

        const k = Number(order[i].id);
if (!Number.isFinite(k)) continue;
if (!ActiveAttrKeys.has(k)) continue;


        const isLocked = (sPrimary && k === Number(sPrimary.id));
        if (isLocked) continue;

        let r = Number(window.AttributeValues[k]) || 0;

        while (r > 0 && used > 200) {
            r--;
            used = used - rankCost(r + 1) + rankCost(r);
        }

        window.setAttributeValue(k, r);
    }
}

// --- Collapsible section ---
const attrSection = el('div', 'bv-attrs-section');
attrSection.style.marginTop = '12px';

const attrHeader = el('div', 'bv-attrs-header');

const headLeft = el('div', 'bv-attrs-head-left');
headLeft.style.display = 'flex';
headLeft.style.alignItems = 'center';
headLeft.style.gap = '10px';

const caret = el('div', 'bv-attrs-caret', '▾');
caret.style.opacity = '0.9';

const headLabel = el('div', 'bv-attrs-label', 'Attribute Points');
headLabel.style.fontWeight = '700';

headLeft.appendChild(caret);
headLeft.appendChild(headLabel);

const budget = el('div', 'bv-attrs-budget', '');
budget.style.opacity = '0.9';

attrHeader.appendChild(headLeft);
attrHeader.appendChild(budget);

const attrBody = el('div', 'bv-attrs-body');
attrBody.style.marginTop = '10px';

const attrWrap = el('div', 'bv-attrs-wrap');
attrWrap.style.display = 'grid';
attrWrap.style.gap = '12px';
attrWrap.style.alignItems = 'start';

const left = el('div', 'bv-attrs-col bv-attrs-primary');
left.style.padding = '10px';
left.style.borderRadius = '12px';
left.style.background = 'rgba(255,255,255,0.03)';

const right = el('div', 'bv-attrs-col bv-attrs-secondary');
right.style.padding = '10px';
right.style.borderRadius = '12px';
right.style.background = 'rgba(255,255,255,0.03)';

// === profession color tint (panels) ===
function applyProfessionPanelColors() {
    const pc = getProfessionColorById(primaryProf);
    const sc = getProfessionColorById(secondaryProf);

    left.style.border = `1px solid ${pc}33`;
    left.style.background =
        `linear-gradient(180deg, ${pc}14, rgba(255,255,255,0.03))`;

    right.style.border = `1px solid ${sc}33`;
    right.style.background =
        `linear-gradient(180deg, ${sc}14, rgba(255,255,255,0.03))`;
}

function updateBudget() {
    const used = usedForActiveKeys();
    const leftPts = Math.max(0, 200 - used);
    budget.textContent = `${used} used | ${leftPts} left`;
refreshBuildCode();
    renderViewerSkillRows();
}


function renderAttrs() {
applyProfessionPanelColors();

    // rebuild which keys are currently relevant
    ActiveAttrKeys = new Set();

    const pName = getProfessionNameEnById(primaryProf);
    const sName = getProfessionNameEnById(secondaryProf);

const pAttrs = listAttributesForProfessionId(primaryProf);
const sAttrs = listAttributesForProfessionId(secondaryProf);


for (const a of pAttrs) {
    const id = Number(a.id);
    if (Number.isFinite(id)) ActiveAttrKeys.add(id);
}

for (const a of sAttrs) {
    const id = Number(a.id);
    if (id) ActiveAttrKeys.add(id);
}


    // enforce: secondary primary attribute = 0
    const sPrimary = sAttrs.find(a => String(a.type || '').toLowerCase() === 'primary');
    if (sPrimary) {
const k = Number(sPrimary.id);
if (k) window.setAttributeValue(k, 0);

    }


    // render BOTH columns
renderAttributeColumn({
    host: left,
    profId: primaryProf,
    sideLabel: 'Primary',
    isSecondary: false,
    onAnyChange: updateBudget
});

renderAttributeColumn({
    host: right,
    profId: secondaryProf,
    sideLabel: 'Secondary',
    isSecondary: true,
    onAnyChange: updateBudget
});


    updateBudget();
}

function getCurrentPayload() {
    const skillIds = [];
    for (let i = 0; i < 8; i++) {
        const s = state[i] ?? null;
        skillIds.push(Number(s?.id ?? 0) || 0);
    }

    const attrObj = {};
    const keys = (ActiveAttrKeys instanceof Set)
        ? Array.from(ActiveAttrKeys)
: Object.keys(window.AttributeValues || {});

    for (const key of keys) {
let lvl = Number(window.AttributeValues?.[key] ?? 0) || 0;
        if (lvl <= 0) continue;
        if (lvl > 12) lvl = 12;

        attrObj[key] = lvl;

    }

    return {
        user_build_id: b.user_build_id ?? null,    // update vs insert
        name: (title.value || '').trim(),          // your default (or db name)
        description: b.description ?? '',
        primary_prof_id: Number(primaryProf) || 0,
        secondary_prof_id: Number(secondaryProf) || 0,
        skills: skillIds,
        attributes: attrObj,
	buildcode: (bcUI.inputEl?.value || '').trim()
    };
}


// remove old listener if viewer was reopened
if (attrListener) {
    document.removeEventListener('attributes:changed', attrListener);
}

attrListener = () => {
    renderViewerSkillRows();
    refreshBuildCode();
    updateBudget();
};


document.addEventListener('attributes:changed', attrListener);

// single initial render
renderAttrs();


window._BuildViewerRestriction = {
    isActive: () => window.BuildViewerActive,
    getActiveKeys: () => ActiveAttrKeys,
    clamp: () => clampToBudget(primaryProf, secondaryProf),
    used: () => usedForActiveKeys(),
    rankCost
};



attrWrap.appendChild(left);
attrWrap.appendChild(right);
attrBody.appendChild(attrWrap);

let collapsed = false;
attrHeader.addEventListener('click', () => {
    collapsed = !collapsed;
    attrBody.style.display = collapsed ? 'none' : '';
    caret.textContent = collapsed ? '▸' : '▾';
});

attrSection.appendChild(attrHeader);
attrSection.appendChild(attrBody);
host.appendChild(attrSection);



/* ---------- Skills (collapsible) ---------- */

const skillsSection = el('div', 'bv-skills-section');
skillsSection.style.marginTop = '14px';

const skillsHeader = el('div', 'bv-skills-header', '▾ Skills');


const skillsBody = el('div', 'bv-skills-body');
skillsBody.style.marginTop = '10px';

// Create actual skills list container
skillsListEl = el('div', 'bv-skill-list');
skillsListEl.style.display = 'flex';
skillsListEl.style.flexDirection = 'column';
skillsListEl.style.gap = '6px';

// Attach to body
skillsBody.appendChild(skillsListEl);

// Initial render
renderViewerSkillRows();

let skillsCollapsed = false;

skillsHeader.addEventListener('click', () => {
    skillsCollapsed = !skillsCollapsed;
    skillsBody.style.display = skillsCollapsed ? 'none' : '';
    skillsHeader.textContent = skillsCollapsed
        ? '▸ Skills'
        : '▾ Skills';
});

skillsSection.appendChild(skillsHeader);
skillsSection.appendChild(skillsBody);
host.appendChild(skillsSection);


const stats = el('div', 'bv-stats');
stats.style.marginTop = '14px';

const statsHead = el('div', 'bv-stats-header', '▸ Build Statistics');


const statsBody = el('div', 'bv-stats-body');
statsBody.style.display = 'none';

stats.appendChild(statsHead);
stats.appendChild(statsBody);
host.appendChild(stats);

const barWrap = el('div');
barWrap.style.height = '240px';

const barCanvas = document.createElement('canvas');
barWrap.appendChild(barCanvas);

const pieWrap = el('div', 'bv-pie-wrap');


const pieCanvas = document.createElement('canvas');
pieWrap.appendChild(pieCanvas);
statsBody.appendChild(pieWrap);
statsBody.appendChild(barWrap);
/* ---------- Skill Icons Row ---------- */

const iconsWrap = el('div');
iconsWrap.className = 'bv-skill-chart-icons';

statsBody.appendChild(iconsWrap);

const analytics = el('div');
analytics.style.marginTop = '12px';
analytics.style.opacity = '0.9';
statsBody.appendChild(analytics);


let statsOpen = false;

statsHead.addEventListener('click', () => {
    statsOpen = !statsOpen;
    statsBody.style.display = statsOpen ? '' : 'none';
    statsHead.textContent = statsOpen
        ? '▾ Build Statistics'
        : '▸ Build Statistics';

if (statsOpen) {
    const skills = state.filter(Boolean);

    renderPieChart(pieCanvas, skills, attributeMap, primaryProf, secondaryProf);
    renderBarChart(barCanvas, skills);

    // Render skill icons
    iconsWrap.innerHTML = '';

    for (const s of skills) {
        const img = document.createElement('img');
        img.src = s.icon || `https://guildwars.magical.ch/img/skill_icons/${s.name_en.replace(/[ "]/g, '_')}.jpg`;

        iconsWrap.appendChild(img);
    }

// ---------- Analytics ----------
const professionCounts = {};
const attributeCounts = {};

for (const s of skills) {
    const p = window.UI?.PROFESSION_EN?.[s.profession] || 'Other';
    professionCounts[p] = (professionCounts[p] || 0) + 1;

    const attr = attributeMap[s.attribute] || 'Other';
    attributeCounts[attr] = (attributeCounts[attr] || 0) + 1;
}

let text = '';

for (const [p, count] of Object.entries(professionCounts)) {
    text += `${count} ${p} skill${count === 1 ? '' : 's'}, `;
}

for (const [a, count] of Object.entries(attributeCounts)) {
    text += `${count} ${a}, `;
}

analytics.textContent = text.replace(/,\s*$/, '');

}

});

if (statsOpen) {
    renderPieChart(pieCanvas, state.filter(Boolean), attributeMap, primaryProf, secondaryProf);
    renderBarChart(barCanvas, state.filter(Boolean));
}



}
window.decodeGWBuildCode = decodeTemplate;

