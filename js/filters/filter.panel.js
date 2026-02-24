import { FILTER_META } from './filter.meta.js';
import { PROFESSION_COLORS, PROFESSION_EN } from '../constants/ui.js';
import { t } from '../i18n.js';

const skilltypeExpandState = {};

export function renderFilterPanel(engine, filterUI) {
console.log("ATTRIBUTE META TYPE:", FILTER_META.attribute?.type);

    const host = document.getElementById('filterCapsules');
    if (!host) return;

    host.innerHTML = '';

    const capsules = engine.getCapsules();

    capsules.forEach((capsuleMap, capsuleIndex) => {

        const capsule = document.createElement('div');
        capsule.classList.add('filter-capsule', 'card');

/* =========================
   RENDER ACTIVE PILLS
========================= */

for (const key of capsuleMap.keys()) {

    const meta = FILTER_META[key];
    if (!meta) continue;

    const pill = document.createElement('div');
    pill.classList.add('filter-pill', 'card');

if (meta.type === 'equals') {

    if (key === 'condition') {

        renderConditionEqualsPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );

    } else if (key === 'campaign') {

        renderCampaignPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );

    } else if (key === 'rating') {

        renderRatingPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );

    } else if (key === 'book') {

        renderBookPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );

    } else if (key === 'label') {

        renderLabelPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );

    } else {

        renderEqualsPill(
            pill,
            capsuleIndex,
            key,
            meta,
            engine,
            filterUI
        );
    }


} else if (meta.type === 'range') {

    renderRangePill(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );

} else if (meta.type === 'hierarchy') {

    renderHierarchyPill(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );

} else if (meta.type === 'text') {

    renderTextPill(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );

} else if (meta.type === 'dual') {

    renderConditionPill(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );

} else if (meta.type === 'toggle') {

    renderTogglePill(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );
}
    capsule.appendChild(pill);
}


        /* =========================
           ADD PILL DROPDOWN
        ========================= */

if (capsuleMap.size === 0) {

    // Capsule empty → show full selector
    renderFilterSelector(capsule, capsuleIndex, capsuleMap, engine, filterUI);

} else {

    // Capsule has pills → show Add Filter button

    const addFilterBtn = document.createElement('button');
    addFilterBtn.className = 'capsule-add-filter-btn';

    addFilterBtn.textContent = '+ ' + t('add_filter');
    addFilterBtn.onclick = () => {

        // Remove button
        addFilterBtn.remove();

        // Show selector instead
        renderFilterSelector(capsule, capsuleIndex, capsuleMap, engine, filterUI);
    };

    capsule.appendChild(addFilterBtn);
}

        /* =========================
           REMOVE CAPSULE BUTTON
        ========================= */

if (capsules.length > 1) {

    const header = document.createElement('div');
    header.className = 'capsule-header';

    const removeCapsuleBtn = document.createElement('button');
    removeCapsuleBtn.className = 'capsule-remove-btn';
    removeCapsuleBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';

    removeCapsuleBtn.onclick = () => {
        engine.removeCapsule(capsuleIndex);
        renderFilterPanel(engine, filterUI);
    };

    header.appendChild(removeCapsuleBtn);
    capsule.appendChild(header);
}



        host.appendChild(capsule);
    });

    /* =========================
       ADD CAPSULE BUTTON
    ========================= */

// check if any capsule is empty
const hasEmptyCapsule = capsules.some(c => c.size === 0);

// only show add capsule if no empty capsule exists
if (!hasEmptyCapsule) {

    const addCapsuleBtn = document.createElement('button');
    addCapsuleBtn.className = 'capsule-add-btn';
    addCapsuleBtn.textContent = '+ ' + t('add_filter_group');

    addCapsuleBtn.onclick = () => {
        engine.addCapsule();
        renderFilterPanel(engine, filterUI);
    };

    host.appendChild(addCapsuleBtn);
}
}


/* =========================
   EQUALS PILL
========================= */

function renderEqualsPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    const header = document.createElement('div');
    header.className = 'pill-header';

    const title = document.createElement('div');
    title.className = 'pill-title';
    title.style.flex = '1';

    const icon = document.createElement('i');
    icon.className = 'fa-duotone fa-solid fa-helmet-battle skill-header-icon gold-bronze';
    icon.style.marginRight = '6px';

    title.appendChild(icon);
    title.appendChild(document.createTextNode(meta.label));

    const invertBtn = document.createElement('button');
    invertBtn.className = 'pill-invert';
    invertBtn.title = 'Invert filter';

    const negated = engine.get(capsuleIndex, key)?.negated === true;

    invertBtn.innerHTML = negated
        ? '<i class="fa-duotone fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    if (negated) invertBtn.classList.add('negated');

    invertBtn.onclick = () => {
        filterUI.toggleNegated(capsuleIndex, key);
    };

const removeBtn = document.createElement('button');
removeBtn.className = 'pill-remove';
removeBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';

removeBtn.onclick = () => {
    filterUI.clear(capsuleIndex, key);
    renderFilterPanel(engine, filterUI);
};


    header.appendChild(title);
    header.appendChild(invertBtn);
    header.appendChild(removeBtn);

    pill.appendChild(header);

    const buttons = document.createElement('div');
    buttons.className = 'pill-buttons';

const values = typeof meta.values === 'function'
    ? meta.values()
    : meta.values;

if (!Array.isArray(values)) {
    console.warn('Equals filter without values:', key, meta);
    return;
}

values.forEach(v => {

        const btn = document.createElement('button');
        btn.className = 'pill-btn';
        btn.title = v.label;

        const img = document.createElement('img');

        if (v.id === 0) {
            img.src = 'https://guildwars.magical.ch/img/icons/None-tango-icon-200.png';
            img.alt = v.label;
        } else {
            img.src = v.icon;
            img.alt = v.label;
            img.onerror = () => img.remove();
        }

        btn.appendChild(img);

        if (active.has(v.id)) {
            btn.classList.add('active');
        }

        btn.onclick = () => {
            if (active.has(v.id)) active.delete(v.id);
            else active.add(v.id);

            filterUI.setEquals(capsuleIndex, key, [...active]);
        };

        buttons.appendChild(btn);
    });

    pill.appendChild(buttons);
}

/* =========================
   HIERARCHY PILL
========================= */

function renderHierarchyPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const state = engine.get(capsuleIndex, key);
    const selected = new Set(state?.values ?? []);
    const lang = window.APP_LANG ?? 'en';

    /* ================= HEADER ================= */

    const header = document.createElement('div');
    header.className = 'pill-header';

    const title = document.createElement('div');
    title.className = 'pill-title';
    title.style.flex = '1';

    const iconMeta = window.HEADER_ICON_MAP?.[key];
    if (iconMeta?.render === 'fa') {
        const icon = document.createElement('i');
        icon.className = iconMeta.icon + ' skill-header-icon';
        if (iconMeta.class) icon.classList.add(iconMeta.class);
        title.appendChild(icon);
    }

    const text = document.createElement('span');
    text.textContent = meta.label ?? key;
    title.appendChild(text);

    const invertBtn = document.createElement('button');
    invertBtn.className = 'pill-invert';

    const negated = state?.negated === true;

    invertBtn.innerHTML = negated
        ? '<i class="fa-duotone fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    if (negated) invertBtn.classList.add('negated');

    invertBtn.onclick = () => {
        filterUI.toggleNegated(capsuleIndex, key);
    };

    const removeBtn = document.createElement('button');
    removeBtn.className = 'pill-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';
    removeBtn.onclick = () => {
        filterUI.clear(capsuleIndex, key);
        renderFilterPanel(engine, filterUI);
    };

    header.append(title, invertBtn, removeBtn);
    pill.appendChild(header);

    const treeWrap = document.createElement('div');
    treeWrap.className = 'skilltype-tree';

    /* =========================================================
       ATTRIBUTE HIERARCHY
    ========================================================== */

    if (key === 'attribute') {

        const attributes = window.Lookups?.attributes ?? {};
        const professions = window.Lookups?.professions ?? {};

        // base English array (you already have this globally)
        const baseProfessions = window.BASE_PROFESSIONS ?? [
            "None","Warrior","Ranger","Monk","Necromancer",
            "Mesmer","Elementalist","Assassin",
            "Ritualist","Paragon","Dervish"
        ];

        const grouped = {};

        Object.values(attributes).forEach(attr => {
            if (attr.prof_id == null) return;

            if (!grouped[attr.prof_id]) {
                grouped[attr.prof_id] = [];
            }

            grouped[attr.prof_id].push(attr);
        });

        Object.entries(grouped).forEach(([profIdRaw, attrs]) => {

            const profId = Number(profIdRaw);
            const profLocalized =
                typeof professions[profId] === 'string'
                    ? professions[profId]
                    : professions[profId]?.name?.[lang] ??
                      professions[profId]?.name?.en ??
                      '';

            const profNameEn = baseProfessions[profId];

            const node = document.createElement('div');
            node.className = 'skilltype-node';

            const row = document.createElement('div');
            row.className = 'skilltype-row';

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'skilltype-children';

            const stateKey = 'attr_' + profId;
            let expanded = skilltypeExpandState[stateKey] ?? false;

            const toggle = document.createElement('i');
            toggle.className = expanded
                ? 'fa-solid fa-chevron-down skilltype-toggle'
                : 'fa-solid fa-chevron-right skilltype-toggle';

            row.appendChild(toggle);

            const profCheckbox = document.createElement('input');
            profCheckbox.type = 'checkbox';
            row.appendChild(profCheckbox);

            // profession icon via English base array
            if (profId !== 0 && profNameEn) {
                const img = document.createElement('img');
                img.src =
                    `https://guildwars.magical.ch/img/icons/` +
                    profNameEn.replace(/\s+/g, '_') +
                    `-tango-icon-200.png`;
                img.className = 'pill-prof-icon';
                row.appendChild(img);
            }

            const label = document.createElement('span');
            label.textContent = profLocalized;
            row.appendChild(label);

            node.appendChild(row);
            node.appendChild(childrenContainer);
            treeWrap.appendChild(node);

            childrenContainer.style.display = expanded ? 'block' : 'none';

            toggle.onclick = () => {
                expanded = !expanded;
                skilltypeExpandState[stateKey] = expanded;

                childrenContainer.style.display = expanded ? 'block' : 'none';
                toggle.className = expanded
                    ? 'fa-solid fa-chevron-down skilltype-toggle'
                    : 'fa-solid fa-chevron-right skilltype-toggle';
            };

            /* ---------- CHILD ATTRIBUTES ---------- */

attrs.forEach(attr => {

    const childRow = document.createElement('div');
    childRow.className = 'skilltype-row';

    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = '14px';
    childRow.appendChild(spacer);

    const childCheckbox = document.createElement('input');
    childCheckbox.type = 'checkbox';
    childCheckbox.checked = selected.has(attr.id);
    childRow.appendChild(childCheckbox);

    // -------------------------
    // ATTRIBUTE ICON
    // -------------------------

    const iconClass =
        attr.faicon && attr.faicon.trim() !== ''
            ? attr.faicon
            : 'fa-etch fa-regular fa-star';

    const attrIcon = document.createElement('i');
    attrIcon.className = iconClass;

    const profId = Number(attr.prof_id);

    const profColor =
    PROFESSION_COLORS[profId] ?? '#888';

    attrIcon.style.color = profColor;
    attrIcon.style.marginRight = '6px';

    childRow.appendChild(attrIcon);

    // -------------------------
    // ATTRIBUTE LABEL
    // -------------------------

    const childLabel = document.createElement('span');
    childLabel.textContent =
        typeof attr.name === 'object'
            ? attr.name[lang] ?? attr.name.en
            : attr.name;

    childRow.appendChild(childLabel);

    childrenContainer.appendChild(childRow);

    // -------------------------
    // CHECKBOX LOGIC
    // -------------------------

    childCheckbox.onchange = () => {

        if (childCheckbox.checked) {
            selected.add(attr.id);
        } else {
            selected.delete(attr.id);
        }

        profCheckbox.checked =
            attrs.every(a => selected.has(a.id));

        filterUI.setEquals(
            capsuleIndex,
            key,
            [...selected]
        );
    };
});

            profCheckbox.checked =
                attrs.length > 0 &&
                attrs.every(a => selected.has(a.id));

            profCheckbox.onchange = () => {

                if (profCheckbox.checked) {
                    attrs.forEach(a => selected.add(a.id));
                } else {
                    attrs.forEach(a => selected.delete(a.id));
                }

                filterUI.setEquals(
                    capsuleIndex,
                    key,
                    [...selected]
                );
            };
        });

        pill.appendChild(treeWrap);
        return;
    }

    /* =========================================================
       ORIGINAL SKILLTYPE TREE (UNCHANGED)
    ========================================================== */

    const skillTypes = window.Lookups?.skillTypes ?? {};
    const childrenMap = {};

    Object.values(skillTypes).forEach(type => {
        if (!childrenMap[type.parent]) {
            childrenMap[type.parent] = [];
        }
        childrenMap[type.parent].push(type);
    });

    function getAllDescendants(id) {
        let result = [];
        const children = childrenMap[id] ?? [];
        children.forEach(child => {
            result.push(child.id);
            result = result.concat(getAllDescendants(child.id));
        });
        return result;
    }

    function renderNode(type, depth = 0, parentEl = treeWrap) {

        const node = document.createElement('div');
        node.className = 'skilltype-node';
        node.style.paddingLeft = (depth * 4) + 'px';

        const row = document.createElement('div');
        row.className = 'skilltype-row';

        const hasChildren = (childrenMap[type.id]?.length ?? 0) > 0;
        let expanded = skilltypeExpandState[type.id] ?? false;

        let toggleBtn = null;

        if (hasChildren) {
            toggleBtn = document.createElement('i');
            toggleBtn.className = expanded
                ? 'fa-solid fa-chevron-down skilltype-toggle'
                : 'fa-solid fa-chevron-right skilltype-toggle';
            row.appendChild(toggleBtn);
        } else {
            const spacer = document.createElement('span');
            spacer.style.display = 'inline-block';
            spacer.style.width = '14px';
            row.appendChild(spacer);
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selected.has(type.id);
        row.appendChild(checkbox);

        const label = document.createElement('span');
        label.textContent = type.name;
        row.appendChild(label);

        node.appendChild(row);

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'skilltype-children';
        childrenContainer.style.display = expanded ? 'block' : 'none';

        node.appendChild(childrenContainer);
        parentEl.appendChild(node);

        if (hasChildren) {
            childrenMap[type.id].forEach(child => {
                renderNode(child, depth + 1, childrenContainer);
            });

            toggleBtn.onclick = () => {
                expanded = !expanded;
                skilltypeExpandState[type.id] = expanded;

                childrenContainer.style.display = expanded ? 'block' : 'none';
                toggleBtn.className = expanded
                    ? 'fa-solid fa-chevron-down skilltype-toggle'
                    : 'fa-solid fa-chevron-right skilltype-toggle';
            };
        }

        checkbox.onchange = () => {

            const descendants = getAllDescendants(type.id);

            if (checkbox.checked) {
                selected.add(type.id);
                descendants.forEach(id => selected.add(id));
            } else {
                selected.delete(type.id);
                descendants.forEach(id => selected.delete(id));
            }

            filterUI.setEquals(
                capsuleIndex,
                key,
                [...selected]
            );
        };
    }

    const topLevel = childrenMap[0] ?? [];
    topLevel.forEach(root => renderNode(root, 0));

    pill.appendChild(treeWrap);
}


/* =========================
   TOGGLE PILL
========================= */

function renderTogglePill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const state = engine.get(capsuleIndex, key);

    const header = document.createElement('div');
    header.className = 'pill-header';

    const title = document.createElement('div');
    title.className = 'pill-title';
    title.style.flex = '1';

    const iconMeta = window.HEADER_ICON_MAP?.[key];
    if (iconMeta?.render === 'fa') {
        const icon = document.createElement('i');
        icon.className = iconMeta.icon + ' skill-header-icon';
        if (iconMeta.class) icon.classList.add(iconMeta.class);
        title.appendChild(icon);
    }

    const text = document.createElement('span');
    text.textContent = meta.label ?? key;
    title.appendChild(text);

    const invertBtn = document.createElement('button');
    invertBtn.className = 'pill-invert';

    const negated = state?.negated === true;

    invertBtn.innerHTML = negated
        ? '<i class="fa-duotone fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    if (negated) invertBtn.classList.add('negated');

    invertBtn.onclick = () => {
        filterUI.toggleNegated(capsuleIndex, key);
    };

    const removeBtn = document.createElement('button');
    removeBtn.className = 'pill-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';

    removeBtn.onclick = () => {
        filterUI.clear(capsuleIndex, key);
        renderFilterPanel(engine, filterUI);
    };

    header.append(title, invertBtn, removeBtn);
    pill.appendChild(header);
}

/* =========================
   STANDARD HEADER FOR PILLS
========================= */

function createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI) {

    const header = document.createElement('div');
    header.className = 'pill-header';

    const title = document.createElement('div');
    title.className = 'pill-title';
    title.style.flex = '1 1 0%';

    // ✅ USE HEADER_ICON_MAP (same as hierarchy + range)
    const iconMeta = window.HEADER_ICON_MAP?.[key];

    if (iconMeta?.render === 'fa') {
        const icon = document.createElement('i');
        icon.className = iconMeta.icon + ' skill-header-icon';

        if (iconMeta.class) {
            icon.classList.add(iconMeta.class);
        }

        title.appendChild(icon);
    }

    const span = document.createElement('span');
    span.textContent = meta.label ?? key;
    title.appendChild(span);

    // ===== INVERT =====
    const invertBtn = document.createElement('button');
    invertBtn.className = 'pill-invert';

    const negated = engine.get(capsuleIndex, key)?.negated === true;

    invertBtn.innerHTML = negated
        ? '<i class="fa-duotone fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    if (negated) invertBtn.classList.add('negated');

    invertBtn.onclick = () => {
        filterUI.toggleNegated(capsuleIndex, key);
    };

    // ===== REMOVE (CORRECT ICON STYLE) =====
    const removeBtn = document.createElement('button');
    removeBtn.className = 'pill-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';

    removeBtn.onclick = () => {
        filterUI.clear(capsuleIndex, key);
        renderFilterPanel(engine, filterUI);
    };

    header.appendChild(title);
    header.appendChild(invertBtn);
    header.appendChild(removeBtn);

    pill.appendChild(header);
}

/* =========================
   LABEL PILL
========================= */

function renderLabelPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI);

    const list = document.createElement('div');
    list.className = 'pill-checkbox-list';

    // collect ALL labels from meta store
    const labelMap = new Map();

    window.SkillMetaStore?.bySkillId?.forEach(entry => {
        entry.labels?.forEach(label => {
            labelMap.set(label.id, label);
        });
    });

    const labels = [...labelMap.values()]
        .sort((a, b) => a.name.localeCompare(b.name));

    labels.forEach(label => {

        const row = document.createElement('label');
        row.className = 'pill-checkbox-row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = active.has(label.id);

        cb.onchange = () => {
            if (cb.checked) active.add(label.id);
            else active.delete(label.id);

            filterUI.setEquals(capsuleIndex, key, [...active]);
        };

        const icon = document.createElement('i');

        if (label.color_secondary) {
            icon.className = 'fa-duotone fa-solid fa-bookmark';
            icon.style.setProperty('--fa-primary-color', label.color_primary);
            icon.style.setProperty('--fa-secondary-color', label.color_secondary);
        } else {
            icon.className = 'fa-sharp fa-solid fa-bookmark';
            icon.style.color = label.color_primary;
        }

        const text = document.createElement('span');
        text.textContent = label.name;

        row.appendChild(cb);
        row.appendChild(icon);
        row.appendChild(text);

        list.appendChild(row);
    });

    pill.appendChild(list);
}

/* =========================
   BOOK PILL
========================= */

function renderBookPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI);

    const list = document.createElement('div');
    list.className = 'pill-checkbox-list';

    const books = window.BookStore?.all ?? [];

    books.forEach(book => {

        const row = document.createElement('label');
        row.className = 'pill-checkbox-row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = active.has(book.id);

        cb.onchange = () => {
            if (cb.checked) active.add(book.id);
            else active.delete(book.id);

            filterUI.setEquals(capsuleIndex, key, [...active]);
        };

        const icon = document.createElement('i');
        icon.className = book.icon || 'fa-solid fa-book';

        if (book.color_primary) {
            icon.style.setProperty('--fa-primary-color', book.color_primary);
            icon.style.color = book.color_primary;
        }

        if (book.color_secondary) {
            icon.style.setProperty('--fa-secondary-color', book.color_secondary);
        }

        const text = document.createElement('span');
        text.textContent = book.name;

        row.appendChild(cb);
        row.appendChild(icon);
        row.appendChild(text);

        list.appendChild(row);
    });

    pill.appendChild(list);
}

/* =========================
   RATING PILL
========================= */

function renderRatingPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    createStandardHeader(
        pill,
        capsuleIndex,
        key,
        meta,
        engine,
        filterUI
    );

    const list = document.createElement('div');
    list.className = 'pill-vertical-list';

    const values = [5,4,3,2,1,0];

    values.forEach(value => {

        const row = document.createElement('label');
        row.className = 'pill-checkbox-row';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = active.has(value);

        checkbox.onchange = () => {
            if (checkbox.checked) active.add(value);
            else active.delete(value);

            filterUI.setEquals(capsuleIndex, key, [...active]);
        };

        const stars = document.createElement('span');

        if (value === 0) {
            stars.textContent = 'Not rated';
        } else {
            for (let i = 0; i < value; i++) {
                const star = document.createElement('i');
                star.className = 'fa-solid fa-star';
                stars.appendChild(star);
            }
        }

        row.appendChild(checkbox);
        row.appendChild(stars);
        list.appendChild(row);
    });

    pill.appendChild(list);
}

/* =========================
   CONDITION (EQUALS) PILL
========================= */

function renderConditionEqualsPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI);

    const buttons = document.createElement('div');
    buttons.className = 'pill-buttons';

    const conditions = window.Lookups?.conditions ?? {};

    Object.values(conditions).forEach(cond => {

        const btn = document.createElement('button');
        btn.className = 'pill-btn';
        btn.title = cond.name; // already localized string

        const img = document.createElement('img');

        img.src = `https://skiltr.magical.ch/img/icons/condition_${cond.id}.jpg`;
        img.alt = cond.name;
        img.onerror = () => img.remove();

        btn.appendChild(img);

        if (active.has(cond.id)) {
            btn.classList.add('active');
        }

        btn.onclick = () => {

            if (active.has(cond.id)) active.delete(cond.id);
            else active.add(cond.id);

            filterUI.setEquals(
                capsuleIndex,
                key,
                [...active]
            );
        };

        buttons.appendChild(btn);
    });

    pill.appendChild(buttons);
}

/* =========================
   TEXT PILL
========================= */

function renderTextPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI);

    const state = engine.get(capsuleIndex, key);
    const value = state?.values ?? '';

    const wrap = document.createElement('div');
    wrap.className = 'pill-text-wrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control filter-pill-text-input';
    input.placeholder = t('text_pill_search');
    input.value = value;

    input.addEventListener('change', () => {
        filterUI.setText(capsuleIndex, key, input.value);
    });

    wrap.appendChild(input);
    pill.appendChild(wrap);
}

/* =========================
   CAMPAIGN PILL
========================= */

function renderCampaignPill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const active = new Set(
        engine.get(capsuleIndex, key)?.values ?? []
    );

    createStandardHeader(pill, capsuleIndex, key, meta, engine, filterUI);

    const buttons = document.createElement('div');
    buttons.className = 'pill-buttons';

    const CAMPAIGNS = {
        0: { label: 'Core', icon: 'core' },
        1: { label: 'Prophecies', icon: 'prophecies' },
        2: { label: 'Factions', icon: 'factions' },
        3: { label: 'Nightfall', icon: 'nightfall' },
        4: { label: 'Eye_of_the_North', icon: 'eotn' }
    };

    Object.entries(CAMPAIGNS).forEach(([id, data]) => {

        const btn = document.createElement('button');
        btn.className = 'pill-btn';

        const img = document.createElement('img');
        img.src = `https://skiltr.magical.ch/img/icons/${data.icon}.png`;
        img.alt = data.label;
        img.onerror = () => img.remove();

        btn.appendChild(img);

        if (active.has(Number(id))) {
            btn.classList.add('active');
        }

        btn.onclick = () => {

            const numId = Number(id);

            if (active.has(numId)) active.delete(numId);
            else active.add(numId);

            filterUI.setEquals(
                capsuleIndex,
                key,
                [...active]
            );
        };

        buttons.appendChild(btn);
    });

    pill.appendChild(buttons);
}

/* =========================
   RANGE PILL
========================= */

function findClosestStepIndex(steps, value) {
    if (!steps || steps.length === 0) return 0;
    let closest = 0;
    let minDiff = Math.abs(steps[0] - value);

    for (let i = 1; i < steps.length; i++) {
        const diff = Math.abs(steps[i] - value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = i;
        }
    }

    return closest;
}


function renderRangePill(pill, capsuleIndex, key, meta, engine, filterUI) {

    const state = engine.get(capsuleIndex, key);
    const range = state?.values ?? {};

    const isStepped = Array.isArray(meta.steps);

    let minVal, maxVal;
    let minIndex, maxIndex;

    if (isStepped) {

        const steps = meta.steps;

        const realMin = range.min ?? steps[0];
        const realMax = range.max ?? steps[steps.length - 1];

        minIndex = findClosestStepIndex(steps, realMin);
        maxIndex = findClosestStepIndex(steps, realMax);

    } else {

        minVal = range.min ?? meta.min;
        maxVal = range.max ?? meta.max;

    }

    /* =========================
       HEADER
    ========================= */

    const header = document.createElement('div');
    header.className = 'pill-header';

    const title = document.createElement('div');
    title.className = 'pill-title';
    title.style.flex = '1';

    const iconMeta = window.HEADER_ICON_MAP?.[key];
    if (iconMeta?.render === 'fa') {
        const icon = document.createElement('i');
        icon.className = iconMeta.icon + ' skill-header-icon';
        if (iconMeta.class) icon.classList.add(iconMeta.class);
        title.appendChild(icon);
    }

    const text = document.createElement('span');
    text.textContent = meta.label ?? key;
    title.appendChild(text);

    const label = document.createElement('div');
    label.className = 'pill-range-label';

    const invertBtn = document.createElement('button');
    invertBtn.className = 'pill-invert';

    const negated = state?.negated === true;

    invertBtn.innerHTML = negated
        ? '<i class="fa-duotone fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';

    if (negated) invertBtn.classList.add('negated');

    invertBtn.onclick = () => {
        filterUI.toggleNegated(capsuleIndex, key);
    };

    const removeBtn = document.createElement('button');
    removeBtn.className = 'pill-remove';
    removeBtn.innerHTML = '<i class="fa-solid fa-square-x"></i>';

    removeBtn.onclick = () => {
        filterUI.clear(capsuleIndex, key);
        renderFilterPanel(engine, filterUI);
    };

    header.append(title, label, invertBtn, removeBtn);
    pill.appendChild(header);

    if (negated) pill.classList.add('negated');
    else pill.classList.remove('negated');

    /* =========================
       RANGE UI
    ========================= */

    const wrap = document.createElement('div');
    wrap.className = 'pill-range-wrap';
    wrap.style.setProperty('--range-color', meta.color ?? '#1e88e5');

    const track = document.createElement('div');
    track.className = 'range-track';

    const activeBar = document.createElement('div');
    activeBar.className = 'range-active';

    const inputMin = document.createElement('input');
    const inputMax = document.createElement('input');

    inputMin.type = 'range';
    inputMax.type = 'range';

    if (isStepped) {

        inputMin.min = 0;
        inputMin.max = meta.steps.length - 1;
        inputMin.value = minIndex;

        inputMax.min = 0;
        inputMax.max = meta.steps.length - 1;
        inputMax.value = maxIndex;

    } else {

        inputMin.min = meta.min;
        inputMin.max = meta.max;
        inputMin.value = minVal;

        inputMax.min = meta.min;
        inputMax.max = meta.max;
        inputMax.value = maxVal;

    }

    function syncLabel(a, b) {
        label.textContent = `${a} – ${b}`;
    }

    function updateActiveBar() {

        let p1, p2;

        if (isStepped) {

            const maxIndexVal = meta.steps.length - 1;

            p1 = (minIndex / maxIndexVal) * 100;
            p2 = (maxIndex / maxIndexVal) * 100;

        } else {

            const min = meta.min;
            const max = meta.max;

            p1 = ((minVal - min) / (max - min)) * 100;
            p2 = ((maxVal - min) / (max - min)) * 100;

        }

        activeBar.style.left = p1 + '%';
        activeBar.style.width = (p2 - p1) + '%';
    }

    function clamp() {

        if (isStepped) {

            let a = Number(inputMin.value);
            let b = Number(inputMax.value);

            if (a > b) [a, b] = [b, a];

            inputMin.value = a;
            inputMax.value = b;

            minIndex = a;
            maxIndex = b;

            const realMin = meta.steps[minIndex];
            const realMax = meta.steps[maxIndex];

            syncLabel(
                window.halfify(realMin),
                window.halfify(realMax)
            );

        } else {

            let a = Number(inputMin.value);
            let b = Number(inputMax.value);

            if (a > b) [a, b] = [b, a];

            inputMin.value = a;
            inputMax.value = b;

            minVal = a;
            maxVal = b;

            syncLabel(a, b);
        }

        updateActiveBar();
    }

    inputMin.addEventListener('input', clamp);
    inputMax.addEventListener('input', clamp);

    inputMin.addEventListener('change', () => {

        if (isStepped) {

            filterUI.setRange(
                capsuleIndex,
                key,
                meta.steps[minIndex],
                meta.steps[maxIndex]
            );

        } else {

            filterUI.setRange(
                capsuleIndex,
                key,
                minVal,
                maxVal
            );
        }
    });

    inputMax.addEventListener('change', () => {

        if (isStepped) {

            filterUI.setRange(
                capsuleIndex,
                key,
                meta.steps[minIndex],
                meta.steps[maxIndex]
            );

        } else {

            filterUI.setRange(
                capsuleIndex,
                key,
                minVal,
                maxVal
            );
        }
    });

    /* Initial render */

    if (isStepped) {
        syncLabel(
            window.halfify(meta.steps[minIndex]),
            window.halfify(meta.steps[maxIndex])
        );
    } else {
        syncLabel(minVal, maxVal);
    }

    updateActiveBar();

    wrap.append(track, activeBar, inputMin, inputMax);
    pill.appendChild(wrap);
}

function renderFilterSelector(container, capsuleIndex, capsuleMap, engine, filterUI) {

    const selector = document.createElement('div');
    selector.className = 'filter-selector';

    Object.keys(FILTER_META)
        .filter(key => !capsuleMap.has(key))
        .forEach(key => {

            const meta = FILTER_META[key];
            const btn = document.createElement('button');
            btn.className = 'filter-selector-btn';

            /* =========================
               ICON
            ========================= */

            const iconMeta = window.HEADER_ICON_MAP?.[key];

            if (iconMeta?.render === 'fa') {

                const icon = document.createElement('i');
                icon.className = iconMeta.icon + ' skill-header-icon';

                if (iconMeta.class) {
                    icon.classList.add(iconMeta.class);
                }

                btn.appendChild(icon);
            }

            /* =========================
               LABEL
            ========================= */

            const label = document.createElement('span');
            label.textContent = meta.label;
            btn.appendChild(label);

            /* =========================
               CLICK HANDLER
            ========================= */

btn.onclick = () => {

    if (meta.type === 'equals' || meta.type === 'hierarchy') {

        filterUI.setEquals(capsuleIndex, key, []);

    }
    else if (meta.type === 'text') {

        filterUI.setText(capsuleIndex, key, '');

    }
    else if (meta.type === 'dual') {

        filterUI.setCondition(capsuleIndex, key, []);

    }
    else if (meta.type === 'range') {

        if (Array.isArray(meta.steps)) {

            const steps = meta.steps;

            filterUI.setRange(
                capsuleIndex,
                key,
                steps[0],
                steps[steps.length - 1]
            );

        } else {

            filterUI.setRange(
                capsuleIndex,
                key,
                meta.min,
                meta.max
            );
        }

    }
    else if (meta.type === 'toggle') {

        filterUI.setEquals(capsuleIndex, key, [1]);
    }
};
    // no manual render call here

            selector.appendChild(btn);
        });

    container.appendChild(selector);
}


window.renderFilterPanel = renderFilterPanel;
