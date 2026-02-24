import { skillMetaAction } from './skill.meta.api.js';
import { PROFESSION_COLORS } from '../constants/ui.js';

if (!window.SkillMetaStore) {
    window.SkillMetaStore = {
        bySkillId: new Map()
    };
}

let currentSkillId = null;

function updateMetaCache(skillId, newMeta) {
    if (!window.SkillMetaStore) return;

    window.SkillMetaStore.bySkillId.set(skillId, newMeta);
}

/* ============================================================
   LOAD META
============================================================ */

export async function loadSkillMeta(skillId) {
    currentSkillId = skillId;

    const container = document.getElementById('skillDetailsMeta');
    if (!container) return;

    container.innerHTML = '';

    const meta = await skillMetaAction({
        action: 'get_meta',
        skill_id: skillId
    });

    renderMeta(container, meta);
}

/* ============================================================
   RENDER META
============================================================ */

function renderMeta(container, meta) {

    const bar = document.createElement('div');
    bar.className = 'meta-bar';

/* ================= FAVORITE ================= */

const favWrap = document.createElement('div');
favWrap.className = 'meta-favorite';

const favIcon = document.createElement('i');
favIcon.className = 'fa-solid fa-star';

if (meta.is_favorite) {
    favIcon.classList.add('active');
}

favIcon.onclick = async () => {

    const newValue = meta.is_favorite ? 0 : 1;

    await skillMetaAction({
        action: 'set_favorite',
        skill_id: currentSkillId,
        is_favorite: newValue
    });

    const updated = await skillMetaAction({
        action: 'get_meta',
        skill_id: currentSkillId
    });

    updateMetaCache(currentSkillId, updated);
    loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
};

favWrap.appendChild(favIcon);
bar.appendChild(favWrap);

    /* ================= RATING ================= */

    const ratingWrap = document.createElement('div');
    ratingWrap.className = 'meta-rating';

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = 'fa-solid fa-star';

        if (meta.rating >= i) star.classList.add('active');

        star.onclick = async () => {
            const newRating = (meta.rating === i) ? null : i;

            await skillMetaAction({
                action: 'set_rating',
                skill_id: currentSkillId,
                rating: newRating
            });

            const updated = await skillMetaAction({
    action: 'get_meta',
    skill_id: currentSkillId
});

updateMetaCache(currentSkillId, updated);
loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
        };

        ratingWrap.appendChild(star);
    }

    bar.appendChild(ratingWrap);

    /* ================= LABELS ================= */

    const labelsWrap = document.createElement('div');
    labelsWrap.className = 'meta-labels';

    meta.labels.forEach(label => {

        const icon = document.createElement('i');

        if (label.color_secondary) {
            icon.className = 'fa-duotone fa-solid fa-bookmark meta-label-icon';
            icon.style.setProperty('--fa-primary-color', label.color_primary);
            icon.style.setProperty('--fa-secondary-color', label.color_secondary);
        } else {
            icon.className = 'fa-sharp fa-solid fa-bookmark meta-label-icon';
            icon.style.color = label.color_primary;
        }

        icon.title = label.name;

        icon.onclick = async () => {
            await skillMetaAction({
                action: 'remove_label',
                skill_id: currentSkillId,
                label_id: label.id
            });

            const updated = await skillMetaAction({
    action: 'get_meta',
    skill_id: currentSkillId
});

updateMetaCache(currentSkillId, updated);
loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
        };

        labelsWrap.appendChild(icon);
    });

    const addLabel = document.createElement('i');
    addLabel.className = 'fa-sharp fa-solid fa-bookmark-plus meta-add-label';
    addLabel.title = 'Add label';
    addLabel.onclick = showLabelCreator;

    labelsWrap.appendChild(addLabel);
    bar.appendChild(labelsWrap);

    /* ================= ADD NOTE ================= */

    const addNote = document.createElement('i');
    addNote.className = 'fa-solid fa-note meta-add-note';
    addNote.title = 'Add note';
    addNote.onclick = showNoteInput;

    bar.appendChild(addNote);

    container.appendChild(bar);

    /* ================= NOTES ================= */

    const notesWrap = document.createElement('div');
    notesWrap.className = 'meta-notes';

    meta.notes.forEach(note => {

        const row = document.createElement('div');
        row.className = 'meta-note-row';

        const text = document.createElement('span');
        text.textContent = note.note_text;

        const del = document.createElement('i');
        del.className = 'fa-solid fa-xmark';

        del.onclick = async () => {
            await skillMetaAction({
                action: 'delete_note',
                note_id: note.id
            });

            const updated = await skillMetaAction({
    action: 'get_meta',
    skill_id: currentSkillId
});

updateMetaCache(currentSkillId, updated);
loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
        };

        row.appendChild(text);
        row.appendChild(del);
        notesWrap.appendChild(row);
    });

    container.appendChild(notesWrap);
}

/* ============================================================
   LABEL CREATOR
============================================================ */

async function showLabelCreator() {

    const container = document.getElementById('skillDetailsMeta');
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = 'meta-label-creator';

    container.appendChild(wrap);

    /* =====================================
       LOAD EXISTING LABELS (FAST ASSIGN)
    ===================================== */

    const existingWrap = document.createElement('div');
    existingWrap.className = 'meta-existing-labels';
    wrap.appendChild(existingWrap);

    try {
        const res = await skillMetaAction({
            action: 'get_all_labels'
        });

        const labels = res;

        labels.forEach(label => {

            const icon = document.createElement('i');

            if (label.color_secondary) {
                icon.className = 'fa-duotone fa-solid fa-bookmark';
                icon.style.setProperty('--fa-primary-color', label.color_primary);
                icon.style.setProperty('--fa-secondary-color', label.color_secondary);
            } else {
                icon.className = 'fa-sharp fa-solid fa-bookmark';
                icon.style.color = label.color_primary;
            }

            icon.title = label.name;

            icon.onclick = async () => {
                await skillMetaAction({
                    action: 'assign_label',
                    skill_id: currentSkillId,
                    label_id: label.id
                });

                const updated = await skillMetaAction({
                    action: 'get_meta',
                    skill_id: currentSkillId
                });

                updateMetaCache(currentSkillId, updated);
                loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
            };

            existingWrap.appendChild(icon);
        });

    } catch (e) {
        console.error('Failed loading labels', e);
    }

/* =====================================
   CREATION UI
===================================== */

const createRow = document.createElement('div');
createRow.className = 'meta-label-create-row';
wrap.appendChild(createRow);

const preview = document.createElement('i');
preview.className = 'fa-sharp fa-solid fa-bookmark meta-label-preview';

const nameInput = document.createElement('input');
nameInput.type = 'text';
nameInput.placeholder = 'Label name';
nameInput.className = 'form-control';

createRow.appendChild(preview);
createRow.appendChild(nameInput);

/* =====================================
   COLOR PICKERS + ACTIONS (ONE ROW)
===================================== */

const controlRow = document.createElement('div');
controlRow.className = 'meta-label-control-row';
wrap.appendChild(controlRow);

const color1 = document.createElement('input');
color1.type = 'color';


const color2 = document.createElement('input');
color2.type = 'color';

const saveBtn = document.createElement('button');
saveBtn.className = 'meta-save-label';
saveBtn.disabled = true;
saveBtn.innerHTML = `
    <i class="fa-sharp fa-solid fa-bookmark-plus"></i>
    <span>Save</span>
`;

const cancelBtn = document.createElement('button');
cancelBtn.className = 'meta-cancel-label';
cancelBtn.innerHTML = `<i class="fa-solid fa-ban"></i>`;

controlRow.appendChild(color1);
controlRow.appendChild(color2);
controlRow.appendChild(saveBtn);
controlRow.appendChild(cancelBtn);

    let primary = null;
    let secondary = null;

function updatePreview() {

    primary = color1.value;
    secondary = color2.value;

    preview.style.removeProperty('--fa-primary-color');
    preview.style.removeProperty('--fa-secondary-color');
    preview.style.color = '';

    if (secondary) {
        preview.className = 'fa-duotone fa-solid fa-bookmark meta-label-preview';
        preview.style.setProperty('--fa-primary-color', primary);
        preview.style.setProperty('--fa-secondary-color', secondary);
    } else {
        preview.className = 'fa-sharp fa-solid fa-bookmark meta-label-preview';
        preview.style.color = primary;
    }

    saveBtn.disabled = !nameInput.value.trim() || !primary;
}


    nameInput.addEventListener('input', updatePreview);
    color1.addEventListener('input', updatePreview);
    color2.addEventListener('input', updatePreview);

    updatePreview();

    /* =====================================
       SAVE
    ===================================== */

    saveBtn.onclick = async () => {

        const name = nameInput.value.trim();
        if (!name || !primary) return;

        const label = await skillMetaAction({
            action: 'create_label',
            name: name,
            color_primary: primary,
            color_secondary: secondary || null,
            icon: 'fa-bookmark'
        });

        await skillMetaAction({
            action: 'assign_label',
            skill_id: currentSkillId,
            label_id: label.id
        });

        const updated = await skillMetaAction({
            action: 'get_meta',
            skill_id: currentSkillId
        });

        updateMetaCache(currentSkillId, updated);
        loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
    };

    cancelBtn.onclick = () => wrap.remove();
}

/* ============================================================
   NOTE INPUT
============================================================ */

function showNoteInput() {

    const container = document.getElementById('skillDetailsMeta');
    if (!container) return;

    const wrap = document.createElement('div');
    wrap.className = 'meta-note-input';

    wrap.innerHTML = `
        <textarea placeholder="Write note..."></textarea>
        <div class="meta-inline-actions">
            <button class="save-note">Save</button>
            <button class="cancel-note">Cancel</button>
        </div>
    `;

    container.appendChild(wrap);

    wrap.querySelector('.cancel-note').onclick = () => wrap.remove();

    wrap.querySelector('.save-note').onclick = async () => {

        const text = wrap.querySelector('textarea').value.trim();
        if (!text) return;

        await skillMetaAction({
            action: 'add_note',
            skill_id: currentSkillId,
            note_text: text
        });

        const updated = await skillMetaAction({
    action: 'get_meta',
    skill_id: currentSkillId
});

updateMetaCache(currentSkillId, updated);
loadSkillMeta(currentSkillId);
if (window.SkillListView) {
    window.SkillListView.updateItems();
    window.SkillListView.render();
}
    };
}

/* ============================================================
   META PRELOADER
============================================================ */

export async function preloadAllSkillMeta() {

    if (!window.SkillMetaStore) {
        window.SkillMetaStore = {
            bySkillId: new Map(),
            loaded: new Set()
        };
    }

    const store = window.SkillMetaStore;

    // reset
    store.bySkillId.clear();
    store.loaded.clear();

    const data = await skillMetaAction({
        action: 'get_all_meta'
    });

    /* ===============================
       FAVORITES + RATING
    =============================== */

    data.meta.forEach(row => {
        store.bySkillId.set(row.skill_id, {
            is_favorite: row.is_favorite,
            rating: row.rating,
            labels: [],
            label_ids: [],
            book_ids: [],
            books: []
        });
    });

    /* ===============================
       LABELS
    =============================== */

data.labels.forEach(row => {

    const entry = store.bySkillId.get(row.skill_id) ?? {
        is_favorite: 0,
        rating: null,
        labels: [],
        book_ids: [],
        books: []
    };

    entry.labels.push({
        id: row.label_id,
        name: row.name,
        icon: row.icon,
        color_primary: row.color_primary,
        color_secondary: row.color_secondary
    });

    store.bySkillId.set(row.skill_id, entry);
});

    /* ===============================
       BOOKS
    =============================== */

    data.books.forEach(row => {

        const entry = store.bySkillId.get(row.skill_id) ?? {
            is_favorite: 0,
            rating: null,
            labels: [],
            label_ids: [],
            book_ids: [],
            books: []
        };

        entry.book_ids.push(row.container_id);
        entry.books.push({
            id: row.container_id,
            name: row.container_name
        });

        store.bySkillId.set(row.skill_id, entry);
    });
}