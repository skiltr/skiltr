// /js/builds/builds.panel.js
import { createSkillbar } from '../skillbar/skillbar.js';
import { PROFESSION_COLORS, PROFESSION_EN } from '../constants/ui.js';

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
    return window.SkillStore?.byId?.get?.(n) ?? null; // Map lookup
}


let _buildCodeReady = false;

async function ensureBuildCodeReady() {
    if (_buildCodeReady) return;

    if (typeof window.createGWBuildCode !== 'function') {
        await import('./build.viewer.js');
    }

    _buildCodeReady = (typeof window.createGWBuildCode === 'function');
}


function buildStateFromIds(skillIds) {
    const ids = Array.isArray(skillIds) ? skillIds.slice(0, 8) : [];
    while (ids.length < 8) ids.push(null);
    return ids.map(getSkillById);
}

function getProfessionIconUrlById(id) {
    const en = PROFESSION_EN?.[Number(id)];
    return en
        ? `https://guildwars.magical.ch/img/icons/${en}-tango-icon-200.png`
        : null;
}


function getBuildProfessions(skills) {
    const profs = new Set();

    for (const s of skills) {
        if (!s) {
            continue;
        }


        const pid =
            Number.isFinite(s.profession_id) ? s.profession_id :
            Number.isFinite(s.profession)    ? s.profession :
            null;

        if (pid == null || pid === 0) {
            continue;
        }

        profs.add(pid);

        if (profs.size >= 2) break;
    }

    return [...profs];
}


export async function refreshBuildsPanel() {
    await ensureBuildCodeReady();

    const host = document.getElementById('panel-builds');
    if (!host) return;

    host.innerHTML = '';

    const res = await fetch('/api/build_list.php', { method: 'GET' });

    let data = {};
    try { data = await res.json(); } catch {}

    if (!res.ok) {
        host.appendChild(el('div', 'builds-empty', data.error || 'Failed to load builds'));
        return;
    }

    const builds = data.builds ?? [];
    if (!builds.length) {
        host.appendChild(el('div', 'builds-empty', 'No saved builds yet.'));
        return;
    }

    const list = el('div', 'builds-list');
    host.appendChild(list);

    builds.forEach(b => {
        const row = el('div', 'build-row');
        row.classList.add('card');
// mini bar state (needs to exist early)
const state = buildStateFromIds(b.skills);
// profession tint (viewer-style, subtle)
const profs = getBuildProfessions(state);
const colors = PROFESSION_COLORS;

if (profs[0] && colors[profs[0]]) {
    row.style.setProperty('--build-prof-a', `${colors[profs[0]]}25`);
    row.style.borderColor = `${colors[profs[0]]}45`;
}

if (profs[1] && colors[profs[1]]) {
    row.dataset.dual = '1';
    row.style.setProperty('--build-prof-b', `${colors[profs[1]]}25`);
}


const header = el('div', 'build-row-header');

const title = el('div', 'build-title');
title.style.display = 'flex';
title.style.alignItems = 'center';
title.style.gap = '6px';

// profession icons (max 2)
profs.slice(0, 2).forEach(pid => {
    const url = getProfessionIconUrlById(pid);
    if (!url) return;

    const img = document.createElement('img');
    img.src = url;
    img.alt = PROFESSION_EN?.[pid] ?? '';
    img.title = PROFESSION_EN?.[pid] ?? '';
    img.style.width = '18px';
    img.style.height = '18px';
    img.style.borderRadius = '4px';
    img.style.objectFit = 'cover';
    img.style.opacity = '0.9';
    img.style.flex = '0 0 auto';

    title.appendChild(img);
});

// build name text
const nameEl = document.createElement('span');
nameEl.textContent = b.name || 'Unnamed Build';
nameEl.style.whiteSpace = 'nowrap';
nameEl.style.overflow = 'hidden';
nameEl.style.textOverflow = 'ellipsis';

title.appendChild(nameEl);
header.appendChild(title);

// DELETE (top right)
const btnDelete = el('button', 'build-btn build-delete');
btnDelete.innerHTML = '<i class="fa-solid fa-square-x"></i>';
btnDelete.title = 'Delete build';
btnDelete.addEventListener('click', () => {
    // prevent multiple confirm bars
    if (row.querySelector('.build-delete-confirm')) return;

    const confirmBar = el('div', 'build-delete-confirm');
    confirmBar.style.display = 'flex';
    confirmBar.style.alignItems = 'center';
    confirmBar.style.justifyContent = 'space-between';
    confirmBar.style.gap = '8px';
    confirmBar.style.padding = '6px 8px';
    confirmBar.style.marginTop = '6px';
    confirmBar.style.borderRadius = '6px';
    confirmBar.style.background = 'rgba(229,57,53,0.12)';
    confirmBar.style.border = '1px solid rgba(229,57,53,0.35)';
    confirmBar.style.fontSize = '12px';

    const text = document.createElement('span');
    text.textContent = 'Delete this build?';
    text.style.color = '#e53935';
    text.style.fontWeight = '600';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const btnYes = el('button', 'build-btn build-delete-confirm-yes');
    btnYes.innerHTML = '<i class="fa-solid fa-check"></i>';
    btnYes.title = 'Confirm delete';
    btnYes.style.color = '#e53935';

    const btnNo = el('button', 'build-btn build-delete-confirm-no');
    btnNo.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    btnNo.title = 'Cancel';

    btnNo.addEventListener('click', () => {
        confirmBar.remove();
    });

    btnYes.addEventListener('click', async () => {
        const res = await fetch('/api/build_delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_build_id: b.user_build_id })
        });

        let out = {};
        try { out = await res.json(); } catch {}

        if (!res.ok) {
            alert(out.error || 'Delete failed');
            return;
        }

        refreshBuildsPanel();
    });

    actions.appendChild(btnYes);
    actions.appendChild(btnNo);

    confirmBar.appendChild(text);
    confirmBar.appendChild(actions);

    row.appendChild(confirmBar);
});


header.appendChild(btnDelete);
row.appendChild(header);


        // mini bar (display only)
const mini = createSkillbar({
    skills: state,
    mode: 'inspect',      // or 'view', doesn't matter much if you don't click-activate
    size: 'small',
    interactive: true,    // needed so slots can start drag/touch
    dropTarget: false,    // important: don't accept drops / previews
    dragSource: 'builds'  // important: treat as list-like source
});

        mini.el.classList.add('build-mini-skillbar');
        row.appendChild(mini.el);

        // actions
        const actions = el('div', 'build-actions');

let restoreActionsTimeout = null;

function swapActionsWithMessage(text, confirmicon = 'fa-solid fa-clipboard-check', color = '#6bdc6b') {
    // prevent stacking
    if (restoreActionsTimeout) {
        clearTimeout(restoreActionsTimeout);
        restoreActionsTimeout = null;
    }

    const originalNodes = Array.from(actions.childNodes);

    actions.innerHTML = '';

    const msg = document.createElement('div');
    msg.style.display = 'flex';
    msg.style.alignItems = 'center';
    msg.style.gap = '6px';
    msg.style.marginTop = '4px';

    msg.style.fontSize = '12px';
    msg.style.fontWeight = '600';
    msg.style.color = color;

    const icon = document.createElement('i');
    icon.className = confirmicon;

    const span = document.createElement('span');
    span.textContent = text;

    msg.appendChild(icon);
    msg.appendChild(span);
    actions.appendChild(msg);

    restoreActionsTimeout = setTimeout(() => {
        actions.innerHTML = '';
        originalNodes.forEach(n => actions.appendChild(n));
        restoreActionsTimeout = null;
    }, 2000);
}


// INFO
const btnInfo = el('button', 'build-btn build-info');
btnInfo.innerHTML = '<i class="fa-solid fa-square-info"></i>';
btnInfo.title = 'View Build Details';
btnInfo.addEventListener('click', async () => {
    const m = await import('./build.viewer.js');
    m.openBuildViewer({
        ...b,
        skills: b.skills ?? [],
        attributes: b.attributes ?? {}
    });
    swapActionsWithMessage('Build loaded in Buildviewer', 'fa-solid fa-circle-check');

});
actions.appendChild(btnInfo);

// COPY BUILDCODE
const btnCode = el('button', 'build-btn build-code');
btnCode.innerHTML = '<i class="fa-solid fa-square-code"></i>';
const skillIds = state.map(s => Number(s?.id ?? 0) || 0);

const buildCode =
    typeof window.createGWBuildCode === 'function'
        ? window.createGWBuildCode({
              primaryProf: b.primary_prof_id ?? 0,
              secondaryProf: b.secondary_prof_id ?? 0,
              skills: skillIds,
              attributes: b.attributes ?? {}
          })
        : 'Buildcode unavailable';

btnCode.title = buildCode;

btnCode.addEventListener('click', async () => {
    if (typeof window.createGWBuildCode !== 'function') {
        await import('./build.viewer.js');
    }

    if (typeof window.createGWBuildCode !== 'function') {
        console.error('createGWBuildCode still not available');
        return;
    }

    const skillIds = state.map(s => Number(s?.id ?? 0) || 0);

    const buildCode = window.createGWBuildCode({
        primaryProf: b.primary_prof_id ?? 0,
        secondaryProf: b.secondary_prof_id ?? 0,
        skills: skillIds,
        attributes: b.attributes ?? {}
    });

    await navigator.clipboard.writeText(buildCode);

    swapActionsWithMessage('Buildcode copied to clipboard');
});



actions.appendChild(btnCode);


// LOAD
const btnLoad = el('button', 'build-btn build-load');
btnLoad.innerHTML = '<i class="fa-solid fa-arrow-turn-down-left"></i>';
btnLoad.title = 'Load Skills into Skillbar';
btnLoad.addEventListener('click', () => {
    window.ActiveSkillbar?.setState?.(state);
    window.showSkillbarPanel?.();
    swapActionsWithMessage('Skills loaded to active Skillbar', 'fa-solid fa-circle-check');

});

actions.appendChild(btnLoad);

// End Buttons

        row.appendChild(actions);
        list.appendChild(row);
    });
}
