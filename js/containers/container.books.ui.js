import { containerAction } from './container.api.js';

if (!window.BookStore) {
    window.BookStore = {
        all: [],
        byId: new Map(),
        sectionsByBookId: new Map(),
        itemsBySectionId: new Map(),
        loaded: false
    };
}


async function syncBooksFromDB() {

    const data = await containerAction({ action: 'list' });

    const books = (data.containers ?? []).filter(c =>
        c.type === 'skill_book' ||
        c.type === 'note_book' ||
        c.type === 'address_book'
    );

    window.BookStore.all = books;
    window.BookStore.byId.clear();

    books.forEach(b => {
        window.BookStore.byId.set(b.id, b);
    });

    window.BookStore.loaded = true;
}

const BOOK_ICONS = {
skill_book: [

    // ---------- SINGLE COLOR (SOLID) ----------
    'fa-regular fa-book-blank',
    'fa-solid fa-book-blank',
    'fa-duotone fa-solid fa-book-blank',
    'fa-duotone fa-regular fa-book-blank',

    'fa-regular fa-book-spine',
    'fa-solid fa-book-spine',
    'fa-duotone fa-solid fa-book-spine',
    'fa-duotone fa-regular fa-book-spine',

    'fa-regular fa-book',
    'fa-solid fa-book',
    'fa-duotone fa-solid fa-book',
    'fa-duotone fa-regular fa-book',

   /* =========================
    'fa-regular fa-book-arrow-right',
    'fa-solid fa-book-arrow-right',
    'fa-duotone fa-solid fa-book-arrow-right',
    'fa-duotone fa-regular fa-book-arrow-right',

    'fa-regular fa-book-arrow-up',
    'fa-solid fa-book-arrow-up',
    'fa-duotone fa-solid fa-book-arrow-up',
    'fa-duotone fa-regular fa-book-arrow-up',
   ========================= */

    'fa-regular fa-book-atlas',
    'fa-solid fa-book-atlas',
    'fa-duotone fa-solid fa-book-atlas',
    'fa-duotone fa-regular fa-book-atlas',

    'fa-regular fa-book-bible',
    'fa-solid fa-book-bible',
    'fa-duotone fa-solid fa-book-bible',
    'fa-duotone fa-regular fa-book-bible',

    'fa-regular fa-book-font',
    'fa-solid fa-book-font',
    'fa-duotone fa-solid fa-book-font',
    'fa-duotone fa-regular fa-book-font',

    'fa-regular fa-book-heart',
    'fa-solid fa-book-heart',
    'fa-duotone fa-solid fa-book-heart',
    'fa-duotone fa-regular fa-book-heart',

    'fa-regular fa-book-journal-whills',
    'fa-solid fa-book-journal-whills',
    'fa-duotone fa-solid fa-book-journal-whills',
    'fa-duotone fa-regular fa-book-journal-whills',

    'fa-regular fa-book-medical',
    'fa-solid fa-book-medical',
    'fa-duotone fa-solid fa-book-medical',
    'fa-duotone fa-regular fa-book-medical',

   /* =========================
    'fa-regular fa-book-quran fa-flip-horizontal',
    'fa-solid fa-book-quran fa-flip-horizontal',
    'fa-duotone fa-solid fa-book-quran fa-flip-horizontal',
    'fa-duotone fa-regular fa-book-quran fa-flip-horizontal',
   ========================= */

    'fa-regular fa-book-section',
    'fa-solid fa-book-section',
    'fa-duotone fa-solid fa-book-section',
    'fa-duotone fa-regular fa-book-section',

    'fa-regular fa-book-skull',
    'fa-solid fa-book-skull',
    'fa-duotone fa-solid fa-book-skull',
    'fa-duotone fa-regular fa-book-skull',

    'fa-regular fa-book-sparkles',
    'fa-solid fa-book-sparkles',
    'fa-duotone fa-solid fa-book-sparkles',
    'fa-duotone fa-regular fa-book-sparkles',

    'fa-regular fa-book-tanakh fa-flip-horizontal',
    'fa-solid fa-book-tanakh fa-flip-horizontal',
    'fa-duotone fa-solid fa-book-tanakh fa-flip-horizontal',
    'fa-duotone fa-regular fa-book-tanakh fa-flip-horizontal'
],


    note_book: [
        'fa-regular fa-book-bookmark',
        'fa-solid fa-book-bookmark',
        'fa-duotone fa-solid fa-book-bookmark',
        'fa-duotone fa-regular fa-book-bookmark'
    ],

    address_book: [
        'fa-regular fa-book-user',
        'fa-solid fa-book-user',
        'fa-duotone fa-solid fa-book-user',
        'fa-duotone fa-regular fa-book-user'
    ]
};

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

let booksContainer = null;

export async function initBooksPanel() {

    booksContainer = document.getElementById('booksContainer');
    if (!booksContainer) return;

    const btnShow   = document.getElementById('btnShowCreateBook');
    const form      = document.getElementById('createBookForm');
    const btnOk     = document.getElementById('btnCreateBookConfirm');
    const btnCancel = document.getElementById('btnCreateBookCancel');
    const input     = document.getElementById('newBookName');
    const select    = document.getElementById('newBookType');

    const iconGrid = document.getElementById('bookIconGrid');
    const preview  = document.getElementById('bookPreviewIcon');
const colorPrimary   = document.getElementById('newBookColorPrimary');
const colorSecondary = document.getElementById('newBookColorSecondary');
// FORCE WHITE DEFAULTS
colorPrimary.value = '#ffffff';
colorSecondary.value = '#959595';

function updatePreviewColor() {

    if (!preview) return;

    preview.style.color = colorPrimary.value;

    preview.style.setProperty('--fa-primary-color', colorPrimary.value);
    preview.style.setProperty('--fa-secondary-color', colorSecondary.value);
preview.style.setProperty('--fa-secondary-opacity', '1');

}

colorPrimary.addEventListener('input', updatePreviewColor);
colorSecondary.addEventListener('input', updatePreviewColor);

    let selectedIcon = 'fa-solid fa-book';

    function renderIconGrid(type) {

        iconGrid.innerHTML = '';

        const icons = BOOK_ICONS[type] || [];

        icons.forEach(cls => {

    const wrapper = document.createElement('div');
    wrapper.className = 'book-icon-wrapper';

    const i = document.createElement('i');
    i.className = cls;

    wrapper.appendChild(i);

    wrapper.addEventListener('click', () => {

        selectedIcon = cls;

        iconGrid.querySelectorAll('.book-icon-wrapper')
            .forEach(x => x.classList.remove('active'));

        wrapper.classList.add('active');

        preview.className = `book-preview-icon ${cls}`;
        updatePreviewColor();
    });

    iconGrid.appendChild(wrapper);
});


        if (icons.length) {

    // if current selected icon not in this type, reset
    if (!icons.includes(selectedIcon)) {
        selectedIcon = icons[0];
    }

    preview.className = `book-preview-icon ${selectedIcon}`;

    const activeWrapper = [...iconGrid.children].find(w =>
        w.querySelector('i')?.className === selectedIcon
    );

    if (activeWrapper) {
        activeWrapper.classList.add('active');
    }

    updatePreviewColor();
}

    }

    renderIconGrid(select.value);
// ---- FORCE DEFAULT PREVIEW INIT ----
preview.className = `book-preview-icon ${selectedIcon}`;

preview.style.setProperty('--fa-primary-color', colorPrimary.value || '#ffffff');
preview.style.setProperty('--fa-secondary-color', colorSecondary.value || '#ffffff');
preview.style.setProperty('--fa-secondary-opacity', '1');
preview.style.color = colorPrimary.value || '#8b4a8f';

    select.addEventListener('change', () => {
        renderIconGrid(select.value);
    });

    await renderBooks();

    if (btnShow && !btnShow.dataset.bound) {

        btnShow.dataset.bound = '1';

        btnShow.addEventListener('click', () => {
            form.style.display = 'flex';
            input.focus();
        });

        btnCancel.addEventListener('click', () => {
            form.style.display = 'none';
            input.value = '';
        });

        btnOk.addEventListener('click', async () => {

            const name  = input.value.trim();
            const type  = select.value;

            const colorPrimary   = document.getElementById('newBookColorPrimary').value;
            const colorSecondary = document.getElementById('newBookColorSecondary').value;

            if (!name) return;

const activeWrapper = iconGrid.querySelector('.book-icon-wrapper.active');
const icon = activeWrapper
    ? activeWrapper.querySelector('i').className
    : selectedIcon;

const editingId = form.dataset.editingId;

if (editingId) {

    await containerAction({
        action: 'rename',
        container_id: editingId,
        name,
        icon,
        color_primary: colorPrimary || null,
        color_secondary: colorSecondary || null
    });

await syncBooksFromDB();
await renderBooks();


    delete form.dataset.editingId;

} else {

const created = await containerAction({
    action: 'create',
    name,
    type,
    icon,
    color_primary: colorPrimary || null,
    color_secondary: colorSecondary || null
});

await syncBooksFromDB();
await renderBooks();


}


            form.style.display = 'none';
            input.value = '';

            renderBooks();
        });
    }
}

function openEditBookForm(book) {

    const form = document.getElementById('createBookForm');
    const input = document.getElementById('newBookName');
    const select = document.getElementById('newBookType');
    const colorPrimary = document.getElementById('newBookColorPrimary');
    const colorSecondary = document.getElementById('newBookColorSecondary');
    const iconGrid = document.getElementById('bookIconGrid');

    form.style.display = 'flex';

    input.value = book.name;
    select.value = book.type;

    colorPrimary.value = book.color_primary || '#ffffff';
    colorSecondary.value = book.color_secondary || '#959595';

    // activate correct icon visually
    const wrappers = iconGrid.querySelectorAll('.book-icon-wrapper');
    wrappers.forEach(w => {
        const cls = w.querySelector('i')?.className;
        w.classList.toggle('active', cls === book.icon);
    });

    form.dataset.editingId = book.id;
}


async function ensureBooksLoaded() {
    if (!window.BookStore.loaded) {
        await syncBooksFromDB();
    }
}


async function renderBooks() {

    booksContainer.innerHTML = '';

    await ensureBooksLoaded();

    const books = window.BookStore.all;

    if (!books.length) {
        booksContainer.appendChild(
            el('div', 'books-empty', 'No books yet.')
        );
        return;
    }

    books.forEach(book => {
        booksContainer.appendChild(createBook(book));
    });
}

function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');

    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createBook(book) {

    const wrapper = el('div', 'book');
    wrapper.classList.add('card');

    if (book.color_primary) {
        wrapper.style.setProperty(
            '--book-color',
            hexToRgba(book.color_primary, 0.7)  // Dim level 0: Fully Transparent, 1: Fully Visible
        );
    }

    wrapper.dataset.id = book.id;

    const header = el('div', 'book-header');
header.style.display = 'flex';
header.style.alignItems = 'center';
header.style.gap = '8px';


    // ---------------------------
    // ICON SELECTION
    // ---------------------------

    let closedClass = book.icon
        ? book.icon
        : 'fa-solid fa-book';

    let openClass = 'fa-duotone fa-solid fa-book-open-cover';

    const iconClosed = el('i', `book-icon closed ${closedClass}`);
    const iconOpen   = el('i', `book-icon open ${openClass}`);

// ---------------------------
// COLOR SUPPORT (FIXED)
// ---------------------------

[iconClosed, iconOpen].forEach(icon => {

    if (book.color_primary) {
        icon.style.setProperty('--fa-primary-color', book.color_primary);
        icon.style.setProperty('--fa-primary-opacity', '1');

        // fallback for non-duotone
        icon.style.color = book.color_primary;
    }

    if (book.color_secondary) {
        icon.style.setProperty('--fa-secondary-color', book.color_secondary);
        icon.style.setProperty('--fa-secondary-opacity', '1');
    }

});



const left = document.createElement('div');
left.style.display = 'flex';
left.style.alignItems = 'center';
left.style.gap = '8px';

const title = el('span', '', book.name);
title.style.flex = '0 1 auto';

left.appendChild(iconClosed);
left.appendChild(iconOpen);
left.appendChild(title);

const spacer = document.createElement('div');
spacer.style.flex = '1';

const actions = document.createElement('div');
actions.style.display = 'flex';
actions.style.alignItems = 'center';
actions.style.gap = '0px';
actions.style.opacity = '1';

header.appendChild(left);
header.appendChild(spacer);
header.appendChild(actions);

const btnEdit = document.createElement('button');
btnEdit.className = 'build-btn';
btnEdit.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
btnEdit.title = 'Edit book';

btnEdit.addEventListener('click', e => {
    e.stopPropagation();
    openEditBookForm(book);
});

actions.appendChild(btnEdit);
const btnDelete = document.createElement('button');
btnDelete.className = 'build-btn build-delete';
btnDelete.innerHTML = '<i class="fa-solid fa-square-x"></i>';
btnDelete.title = 'Delete book';

    const content = el('div', 'book-content');
    content.style.display = 'none';

btnDelete.addEventListener('click', e => {
    e.stopPropagation();

    if (wrapper.querySelector('.book-delete-confirm')) return;

    const confirmBar = document.createElement('div');
    confirmBar.className = 'book-delete-confirm';
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
    text.textContent = 'Delete this book?';
    text.style.color = '#e53935';
    text.style.fontWeight = '600';

    const actionWrap = document.createElement('div');
    actionWrap.style.display = 'flex';
    actionWrap.style.gap = '6px';

    const btnYes = document.createElement('button');
    btnYes.className = 'build-btn';
    btnYes.innerHTML = '<i class="fa-solid fa-check"></i>';
    btnYes.style.color = '#e53935';

    const btnNo = document.createElement('button');
    btnNo.className = 'build-btn';
    btnNo.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    btnNo.addEventListener('click', () => confirmBar.remove());

    btnYes.addEventListener('click', async () => {
        await containerAction({
            action: 'delete',
            container_id: book.id
        });

await syncBooksFromDB();
await renderBooks();


    });

    actionWrap.appendChild(btnYes);
    actionWrap.appendChild(btnNo);

    confirmBar.appendChild(text);
    confirmBar.appendChild(actionWrap);

    wrapper.insertBefore(confirmBar, content);
});

actions.appendChild(btnDelete);

    header.addEventListener('click', async () => {

        const isOpen = content.style.display === 'block';

        if (isOpen) {
            content.style.display = 'none';
            return;
        }

        content.style.display = 'block';

        if (!content.dataset.loaded) {
            await loadBookSections(book.id, content);
            content.dataset.loaded = '1';
        }
    });

    wrapper.appendChild(header);
    wrapper.appendChild(content);

    return wrapper;
}

async function loadBookSections(containerId, contentEl) {

    contentEl.innerHTML = '';

    let sections = window.BookStore.sectionsByBookId.get(containerId);

    if (!sections) {
        const data = await containerAction({
            action: 'list_sections',
            container_id: containerId
        });

        sections = data.sections ?? [];
        window.BookStore.sectionsByBookId.set(containerId, sections);
    }

    if (!sections.length) {
        contentEl.appendChild(
            el('div', 'book-empty', 'This book has no sections.')
        );
        return;
    }

    for (const section of sections) {
        const sectionEl = await renderSection(section);
        contentEl.appendChild(sectionEl);
    }
}


async function renderSection(section) {

    const wrapper = el('div', 'book-section');
    wrapper.dataset.id = section.user_container_section_id;

    if (section.title) {
        const title = el('div', 'book-section-title', section.title);
        wrapper.appendChild(title);
    }

    const body = el('div', 'book-section-body');
    wrapper.appendChild(body);

    // DROP SUPPORT ONLY FOR manual_skills
    if (section.type === 'manual_skills') {

        body.addEventListener('dragover', e => {
            if (!window.DragState?.skill) return;
            e.preventDefault();
        });

        body.addEventListener('dragenter', e => {
            if (!window.DragState?.skill) return;
            e.preventDefault();
            body.classList.add('drop-active');
        });

        body.addEventListener('dragleave', () => {
            body.classList.remove('drop-active');
        });

        body.addEventListener('drop', async e => {

            body.classList.remove('drop-active');

            const skill =
                window.DragState?.skill ||
                window.TouchDragState?.skill;

            if (!skill) return;

            await containerAction({
                action: 'add_skill_to_section',
                section_id: section.user_container_section_id,
                skill_id: skill.id
            });
window.BookStore.itemsBySectionId
    .delete(section.user_container_section_id);

            await renderSectionItems(section, body);
        });
    }

    await renderSectionItems(section, body);

    return wrapper;
}


function attachBookSkillInteractions(img, skill) {

    const skillIconName = skill.name_en.replace(/[ "]/g, '_');

    /* DESKTOP DRAG */
    img.draggable = true;

    img.addEventListener('dragstart', e => {
        e.stopPropagation();

        window.DragState.skill = skill;
        window.DragState.source = 'book';
        window.DragState.handled = false;

        e.dataTransfer.setData('text/plain', skill.id);
        e.dataTransfer.effectAllowed = 'copy';

        showSkillbarPanel();
    });

    /* MOBILE DRAG */
    img.addEventListener('touchstart', e => {
        e.preventDefault();
        e.stopPropagation();

        window.TouchDragState.skill = skill;
        window.TouchDragState.active = true;
        window.TouchDragState.confirmed = false;
        window.TouchDragState.lastSlot = null;

        const ghost = document.getElementById('touch-drag-ghost');
        if (ghost) {
            ghost.src = `https://guildwars.magical.ch/img/skill_icons/${skillIconName}.jpg`;
            ghost.style.display = 'block';
        }

        showSkillbarPanel();
    }, { passive: false });

    /* CLICK */
    img.addEventListener('click', e => {
        e.stopPropagation();
        openSkillDetails(skill);
    });
}

async function renderSectionItems(section, bodyEl) {
console.log('NEW renderSectionItems active');

    bodyEl.innerHTML = '';
bodyEl.classList.remove('skills-grid');

let items = window.BookStore.itemsBySectionId
    .get(section.user_container_section_id);

if (!items) {
    const data = await containerAction({
        action: 'list_section_items',
        section_id: section.user_container_section_id
    });

    items = data.items ?? [];

    window.BookStore.itemsBySectionId
        .set(section.user_container_section_id, items);
}


    if (!items.length) {
        bodyEl.appendChild(
            el('div', 'book-empty', 'Section is empty. Drag and Drop Skills here to add them to this Section')
        );
        return;
    }

    /* ==============================
       MANUAL SKILLS
    ============================== */

    if (section.type === 'manual_skills') {

        items.forEach(item => {

            if (item.type !== 'skill' || !item.skill_id) return;

            const skill = window.SkillStore?.byId?.get?.(item.skill_id);
            if (!skill) return;
bodyEl.classList.add('skills-grid');

const itemWrap = document.createElement('div');
itemWrap.className = 'book-skill-item';

const img = document.createElement('img');
img.src = `https://guildwars.magical.ch/img/skill_icons/${skill.name_en.replace(/[ "]/g, '_')}.jpg`;
img.title = skill.name_en;
img.className = 'book-skill-icon';

attachBookSkillInteractions(img, skill);

const btnRemove = document.createElement('i');
btnRemove.className = 'fa-duotone fa-regular fa-square-x book-skill-remove';
btnRemove.title = 'Remove from section';


btnRemove.addEventListener('click', async e => {
    e.stopPropagation();

    await containerAction({
        action: 'remove_section_item',
        user_section_item_id: item.user_section_item_id
    });
window.BookStore.itemsBySectionId
    .delete(section.user_container_section_id);

    await renderSectionItems(section, bodyEl);
});

itemWrap.appendChild(img);
itemWrap.appendChild(btnRemove);

bodyEl.appendChild(itemWrap);

        });
    }

    /* ==============================
       TEXT SECTIONS
    ============================== */

    if (section.type === 'text') {

        items.forEach(item => {

            if (item.type !== 'text' || !item.text_content) return;

            const text = el('div', 'book-text-block');
            text.textContent = item.text_content;

            bodyEl.appendChild(text);
        });
    }
}

export async function preloadBooks() {
    await syncBooksFromDB();
}

export async function preloadBooksDeep() {

    await syncBooksFromDB();

    for (const book of window.BookStore.all) {

        const sectionData = await containerAction({
            action: 'list_sections',
            container_id: book.id
        });

        const sections = sectionData.sections ?? [];

        window.BookStore.sectionsByBookId.set(book.id, sections);

        for (const section of sections) {

            const itemsData = await containerAction({
                action: 'list_section_items',
                section_id: section.user_container_section_id
            });

            window.BookStore.itemsBySectionId.set(
                section.user_container_section_id,
                itemsData.items ?? []
            );
        }
    }
}