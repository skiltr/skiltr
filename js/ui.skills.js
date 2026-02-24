/* ============================
   Constants & Config
============================ */

const {
  PROF_NONE,
  PROF_WARRIOR,
  PROF_RANGER,
  PROF_MONK,
  PROF_NECROMANCER,
  PROF_MESMER,
  PROF_ELEMENTALIST,
  PROF_ASSASSIN,
  PROF_RITUALIST,
  PROF_PARAGON,
  PROF_DERVISH,
  ATTR_NONE
} = window.IDS;

const {
  PROFESSION_COLORS
} = window.UI;

const PROF_ICON_NAMES = {
  [PROF_WARRIOR]: 'Warrior',
  [PROF_RANGER]: 'Ranger',
  [PROF_MONK]: 'Monk',
  [PROF_NECROMANCER]: 'Necromancer',
  [PROF_MESMER]: 'Mesmer',
  [PROF_ELEMENTALIST]: 'Elementalist',
  [PROF_ASSASSIN]: 'Assassin',
  [PROF_RITUALIST]: 'Ritualist',
  [PROF_PARAGON]: 'Paragon',
  [PROF_DERVISH]: 'Dervish'
};

const PROF_NAME_TO_ID = Object.fromEntries(
    Object.entries(PROF_ICON_NAMES).map(([id, name]) => [name, Number(id)])
);

const VIEW_MODES = {
    LIST_COMPACT: 'list-compact',   // current
    LIST_DETAILED: 'list-detailed', // with description
    ICON_GRID: 'icon-grid'          // icons only
};

const GROUP_ROW_HEIGHT = 56;

const SKILL_ROW_HEIGHT = {
    [VIEW_MODES.LIST_COMPACT]: 60,
    [VIEW_MODES.LIST_DETAILED]: 120
};

const ICON_ROW_HEIGHT = 96;

window.SkillMetaStore = {
    bySkillId: new Map(),
    loaded: new Set()
};

let SkillViewMode = VIEW_MODES.LIST_COMPACT;

function getSkillRowHeight() {
    return SKILL_ROW_HEIGHT[SkillViewMode];
}

function getIconsPerRow(containerWidth) {
    const ICON_SIZE = 64;
    const GAP = 8;
    return Math.max(1, Math.floor(containerWidth / (ICON_SIZE + GAP)));
}


const GROUP_EXCLUSIVE = [
    'energy',
    'adrenaline',
    'activation',
    'recharge',
    'overcast'
];

function getLang() {
    console.log('APP LANG IS:');
    console.log(window.APP_LANG);
    return window.APP_LANG || 'en';
}

function skillName(skill) {
    const lang = getLang();
    return skill[`name_${lang}`] || skill.name_en || '';
}

function skillDesc(skill) {
    const lang = getLang();
    return skill[`desc_${lang}`] || skill.desc_en || '';
}

function isTypeOrChild(skillTypeId, targetTypeId) {
    let current = skillTypeId;

    while (current != null) {
        if (current === targetTypeId) return true;
        current = Lookups.skillTypes?.[current]?.parent ?? null;
    }

    return false;
}

function applyFastCasting(skill, baseActivation, baseRecharge) {

    const FAST_CASTING_ID = 0;
const rank = AttributeValues[FAST_CASTING_ID] ?? 0;


    if (rank <= 0) {
        return {
            activation: baseActivation,
            recharge: baseRecharge,
            activationModified: false,
            rechargeModified: false
        };
    }

    const MESMER_ID = 5;

    const isSpell  = isTypeOrChild(skill.type, 22);
    const isSignet = skill.type === 21;

    let activation = baseActivation;
    let recharge   = baseRecharge;

    let activationModified = false;
    let rechargeModified   = false;

    /* ====================================
       ACTIVATION (Spells + Signets)
    ==================================== */

    if (baseActivation > 0 && (isSpell || isSignet)) {

        const factor = Math.pow(0.955, rank);

        if (skill.profession === MESMER_ID) {
            // Mesmer skills always affected
            activation = baseActivation * factor;
        } else {
            // Non-Mesmer rule
            if (baseActivation >= 2) {
                activation = baseActivation * factor;
            }
        }

        activation = Math.max(0.25, activation);

        activationModified =
    halfify(activation) !== halfify(baseActivation);


    }

    /* ====================================
       RECHARGE (PvE Mesmer spells only)
       3% per rank, linear
    ==================================== */

    if (
        baseRecharge > 0 &&
        isSpell &&
        skill.profession === MESMER_ID
    ) {
        recharge = baseRecharge * (1 - 0.03 * rank);

        recharge = Math.round(recharge);

        rechargeModified =
    Math.abs(recharge - baseRecharge) > 0.001;

    }

    return {
        activation,
        recharge,
        activationModified,
        rechargeModified
    };
}

function applyEnergyModifiers(skill, baseEnergy) {

    if (baseEnergy <= 0) {
        return { energy: baseEnergy, modified: false, color: null };
    }

    let energy = baseEnergy;
    let color = null;

    /* ========= EXPERTISE (23) ========= */

    const expRank = AttributeValues[23] ?? 0;

    if (expRank > 0) {

        const isAttack =
            isTypeOrChild(skill.type, 3) ||
            isTypeOrChild(skill.type, 31);

        const isRitual =
            isTypeOrChild(skill.type, 18) ||
            isTypeOrChild(skill.type, 19) ||
            isTypeOrChild(skill.type, 32);

        const isTouch =
            skill.name_en?.toLowerCase().includes('touch');

        const isRanger =
            skill.profession === PROF_RANGER;

        if (isAttack || isRitual || isTouch || isRanger) {
            energy *= (1 - 0.04 * expRank);
            color = '#7aa84f'; // Ranger
        }
    }

    /* ========= MYSTICISM (44) ========= */

    const mysRank = AttributeValues[44] ?? 0;

    if (mysRank > 0) {

        const isDervish =
            skill.profession === PROF_DERVISH;

        const isEnchantment =
            isTypeOrChild(skill.type, 23);

        if (isDervish && isEnchantment) {
            energy *= (1 - 0.04 * mysRank);
            color = '#6c7eb5'; // Dervish
        }
    }

    // ---- FINAL ROUNDING ----
    energy = Math.round(energy);
    energy = Math.max(1, energy);

    const changed = energy !== baseEnergy;

    return {
        energy,
        modified: changed,
        color: changed ? color : null
    };
}


/* ============================
   Global State

    sort: { key: 'elite', dir: -1 }, // elites first
============================ */

const SkillViewState = {
    sort: { key: null, dir: 1 }, // no sorting
    groups: ['profession', 'attribute']
};


const SkillSearchState = { query: '' };

function normalizeSearchQuery(q) {
    return String(q ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function skillSearchText(skill) {
    const lang = getLang();

    const nameL = skill[`name_${lang}`] ?? '';
    const descL = skill[`desc_${lang}`] ?? '';

    const nameEn = skill.name_en ?? '';
    const descEn = skill.desc_en ?? '';

    return `${nameL} ${descL} ${nameEn} ${descEn}`.toLowerCase();
}

function matchesSkillSearch(skill, qNorm) {
    if (!qNorm) return true;

    // optional: allow searching by exact id
    if (/^\d+$/.test(qNorm)) return String(skill.id) === qNorm;

    return skillSearchText(skill).includes(qNorm);
}

function setSkillSearchQuery(raw) {
    const q = normalizeSearchQuery(raw);
    if (q === SkillSearchState.query) return;

    SkillSearchState.query = q;

    // reset scroll so you don’t “land” in empty space after filtering
    const scroller = SkillListView.container?.parentElement;
    if (scroller) scroller.scrollTop = 0;

    SkillListView.updateItems();
    SkillListView.render();
}

function tryDecodeBuildCodeFromSearch(str) {
    if (!str) return false;

    // base64-only, no spaces
    if (!/^[A-Za-z0-9+/]+$/.test(str)) return false;

    if (str.length < 16) return false;

    const decoded = window.decodeGWBuildCode?.(str);
    if (!decoded) return false;

    import('./builds/build.viewer.js').then(m => {
        m.openBuildViewer?.({
            skills: decoded.skills,
            attributes: Object.fromEntries(
                decoded.attributes.map(a => [a.id, a.points])
            ),
            primary_prof_id: decoded.primary,
            secondary_prof_id: decoded.secondary,
            name: ''
        });
    });

    return true;
}


function initSkillSearchUI() {
    const input = document.getElementById('skillSearchInput');
    if (!input) return;

    input.placeholder = t('searchPlaceholder') || 'Search…';

    let debounce = null;

input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        const val = input.value.trim();

        // intercept build codes
        if (tryDecodeBuildCodeFromSearch(val)) {
            // optional UX: clear search input
            input.value = '';
            setSkillSearchQuery('');
            return;
        }

        // normal search
        setSkillSearchQuery(val);
    }, 80);
});


    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            input.value = '';
            setSkillSearchQuery('');
            input.blur();
        }
    });

    input.value = SkillSearchState.query;

    window._skillSearchUpdatePlaceholder = () => {
        updateSearchPlaceholderCount(SkillListView.skillCount);
    };
}


function renderEmptyState({
    imgSrc = null,
    imgAlt = '',
    title = null,
    text = null
} = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'skill-list-empty';

    const inner = document.createElement('div');
    inner.className = 'skill-list-empty-inner';

    if (title) {
        const h = document.createElement('h3');
        h.className = 'skill-list-empty-title';
        h.textContent = title;
        inner.appendChild(h);
    }

    if (text) {
        const p = document.createElement('p');
        p.className = 'skill-list-empty-text';
        p.textContent = text;
        inner.appendChild(p);
    }

    if (imgSrc) {
        const img = document.createElement('img');
        img.className = 'skill-list-empty-img';
        img.src = imgSrc;
        img.alt = imgAlt || '';
        inner.appendChild(img);
    }

    wrap.appendChild(inner);
    return wrap;
}

/* ============================
   Skill List View (virtualized)
============================ */


const SkillListView = {
    container: null,
    items: [],
    total: 0,
    skillCount: 0,

    init() {
        this.container = document.querySelector('.skill-list-rows');
        this.container.style.position = 'relative';

        initSkillSearchUI();

        this.updateItems();
        this.render();

        this.container.parentElement.addEventListener(
            'scroll',
            () => this.render()
        );
    },

    /* =========================
       Offset recomputation
    ========================= */
    recomputeOffsets() {
        this.offsets = [];
        let y = 0;

        for (const item of this.items) {
            this.offsets.push(y);
            y += item.height ?? GROUP_ROW_HEIGHT;
        }

        this.container.style.height = `${y}px`;
    },

    /* =========================
       Build item list
    ========================= */
    updateItems() {
        let skills = SkillStore.all.slice();

        if (window.FilterEngine) {
            skills = window.FilterEngine.apply(skills);
        }

if (SkillSearchState.query) {
    skills = skills.filter(s => matchesSkillSearch(s, SkillSearchState.query));
}

    this.skillCount = skills.length;
    updateSearchPlaceholderCount(this.skillCount);

        /* ---- GROUP TREE (ALWAYS FIRST) ---- */
        let flat;

        if (SkillViewState.groups.length) {
            const tree = buildGroupTree(skills, SkillViewState.groups);
            flat = flattenGroupTree(tree);
        } else {
            skills.sort(compareSkills);
            flat = skills.map(skill => ({ type: 'skill', skill }));
        }

        /* ---- BUILD VIEW ITEMS ---- */
        this.items = [];
        let bucket = [];

        const perRow =
            SkillViewMode === VIEW_MODES.ICON_GRID
                ? getIconsPerRow(this.container.parentElement.clientWidth)
                : 1;

        for (const item of flat) {

            /* ---- GROUP HEADERS ---- */
            if (item.type === 'group') {
                if (bucket.length) {
                    this.items.push({
                        type: 'icon-row',
                        skills: bucket,
                        height: null
                    });
                    bucket = [];
                }

                this.items.push({
                    ...item,
                    height: GROUP_ROW_HEIGHT
                });
                continue;
            }

            /* ---- ICON GRID MODE ---- */
            if (SkillViewMode === VIEW_MODES.ICON_GRID) {
                bucket.push(item.skill);

                if (bucket.length === perRow) {
                    this.items.push({
                        type: 'icon-row',
                        skills: bucket,
                        height: null
                    });
                    bucket = [];
                }
            }

            /* ---- LIST MODE ---- */
            else {
                this.items.push({
                    ...item,
                    height:
                        SkillViewMode === VIEW_MODES.LIST_DETAILED
                            ? null   // dynamic height
                            : getSkillRowHeight()
                });
            }
        }

        /* ---- FLUSH REMAINDER ICONS ---- */
        if (bucket.length) {
            this.items.push({
                type: 'icon-row',
                skills: bucket,
                height: null
            });
        }

        /* ---- INITIAL OFFSETS ---- */
        this.recomputeOffsets();
        this.total = this.items.length;
    },

    /* =========================
       Render
    ========================= */
    render() {
        this.container.innerHTML = '';

/* ================ EMPTY STATE ===================
For image only, set title: null, text: null.
For text only, set imgSrc: null.
================================================ */

    if (this.skillCount === 0) {
        // ensure the empty state has vertical room even when list height would be 0
        this.container.style.height = '100%';

        this.container.appendChild(
            renderEmptyState({
                imgSrc: '/img/brutus.png',          // 404 IMAGE NOT FOUND ZERO
                imgAlt: 'No skills found',
                title: getLang() === 'de' ? 'Keine Treffer' : 'No results',
                text:  getLang() === 'de'
                    ? 'Ändere Suche oder Filter, um wieder Skills zu sehen.'
                    : 'Adjust your search or filters to see skills again.'
            })
        );
        return;
    }

    // reset if we previously showed empty state
    this.container.style.height = `${this.container.style.height || ''}`;
        for (let i = 0; i < this.total; i++) {
            const item = this.items[i];
            if (!item) continue;

            let row;
            if (item.type === 'group') {
                row = renderGroupRow(item);
            } else if (item.type === 'icon-row') {
                row = renderIconRow(item);
            } else {
                row = renderSkillRow(item.skill);
            }

            row.style.position = 'absolute';
            row.style.top = `${this.offsets[i]}px`;

            this.container.appendChild(row);

            /* ---- MEASURE DYNAMIC HEIGHTS ---- */
            if (item.height == null) {
                const measured = row.offsetHeight;

                if (measured !== item._measuredHeight) {
                    item._measuredHeight = measured;
                    item.height = measured;
                    this.recomputeOffsets();
                }
            }

            /* ---- APPLY FIXED HEIGHTS (NOT ICON GRID) ---- */
            if (item.type !== 'icon-row' && item.height != null) {
                row.style.height = `${item.height}px`;
            }
        }
    }
};


/* ============================
   Skill List Header (grouping)
============================ */

const GroupCollapseState = {};

function buildGroupTree(skills, keys, level = 0) {
    if (level >= keys.length) {
        // LEAF: sort skills here
        return skills.slice().sort(compareSkills);
    }

    const key = keys[level];
    const map = {};

    skills.forEach(skill => {
        const raw = skill[key] ?? null;
        (map[raw] ||= []).push(skill);
    });

    return Object.entries(map)
      .sort(([a], [b]) => compareGroupValues(key, a, b, SkillViewState.sort)) // sort groups
        .map(([value, items]) => {
            const id = `${key}:${value}`;
            return {
                type: 'group',
                key,
                value,
                id,
                collapsed: GroupCollapseState[id] ?? true,
                children: buildGroupTree(items, keys, level + 1)
            };
        });
}


function flattenGroupTree(tree, level = 0, out = []) {

    // LEAF: plain skill array
    if (Array.isArray(tree) && tree.length && tree[0]?.name_en) {
        tree.forEach(skill => {
            out.push({ type: 'skill', skill });
        });
        return out;
    }

    // GROUP LEVEL
    tree.forEach(node => {
        out.push({
            type: 'group',
            level,
            node
        });

        if (!node.collapsed) {
            flattenGroupTree(node.children, level + 1, out);
        }
    });

    return out;
}


/* ============================
   Skill List Header (sorting)
============================ */

function sortItems(items) {
    items.sort((a, b) => {

        if (a.type !== b.type) {
            return a.type === 'group' ? -1 : 1;
        }

        if (a.type === 'group') {
            return compareValues(a.node.value, b.node.value);
        }

        return compareSkills(a.skill, b.skill);
    });
}

function countRawSkills(children) {
    if (!children) return 0;

    // leaf: array of skills
    if (Array.isArray(children) && children.length && children[0]?.name_en) {
        return children.length;
    }

    // array of group nodes
    if (Array.isArray(children)) {
        return children.reduce(
            (sum, node) => sum + countRawSkills(node.children),
            0
        );
    }

    return 0;
}



function compareValues(a, b) {

    // normalize
    const na = a ?? '';
    const nb = b ?? '';

    // --- NUMERIC SPECIAL CASE ---
    const aNum = Number(na);
    const bNum = Number(nb);

    const aIsNum = !isNaN(aNum);
    const bIsNum = !isNaN(bNum);

    if (aIsNum && bIsNum) {

    const aNeg = aNum < 0;
    const bNeg = bNum < 0;

    // negatives always last
    if (aNeg && !bNeg) return 1;
    if (!aNeg && bNeg) return -1;

    // otherwise: normal numeric sort
    return aNum - bNum;
}


    // --- FALLBACK: STRING SORT ---
    return String(na).localeCompare(String(nb));
}

function compareGroupValues(key, a, b, sort) {

    // helper
    const dir = sort?.dir ?? 1;
    const isActiveSort = sort?.key === key;

    // ---------- PROFESSION ----------
if (key === 'profession') {
    const idA = Number(a);
    const idB = Number(b);

    // PROF_NONE always last
    if (idA === PROF_NONE && idB !== PROF_NONE) return 1;
    if (idA !== PROF_NONE && idB === PROF_NONE) return -1;

    const nameA = Lookups.professions[idA] ?? '';
    const nameB = Lookups.professions[idB] ?? '';

    const cmp = nameA.localeCompare(nameB);
    return isActiveSort ? cmp * dir : cmp;
}


    // ---------- ATTRIBUTE ----------
    if (key === 'attribute') {
        const idA = Number(a);
        const idB = Number(b);

        const aNeg = idA < 0;
        const bNeg = idB < 0;

        // negative (title-track) attributes always last
        if (aNeg && !bNeg) return 1;
        if (!aNeg && bNeg) return -1;

        const nameA =
            Lookups.attributes[String(a)]?.name ?? 'No Attribute';
        const nameB =
            Lookups.attributes[String(b)]?.name ?? 'No Attribute';

        // "No Attribute" last within its tier
        if (nameA === 'No Attribute' && nameB !== 'No Attribute') return 1;
        if (nameA !== 'No Attribute' && nameB === 'No Attribute') return -1;

        const cmp = nameA.localeCompare(nameB);
        return isActiveSort ? cmp * dir : cmp;
    }

    // ---------- NUMERIC GROUPS (energy, recharge, etc.) ----------
    const aNum = Number(a);
    const bNum = Number(b);

    if (!isNaN(aNum) && !isNaN(bNum)) {
        const aNeg = aNum < 0;
        const bNeg = bNum < 0;

        // negatives always last
        if (aNeg && !bNeg) return 1;
        if (!aNeg && bNeg) return -1;

        const cmp = aNum - bNum;
        return isActiveSort ? cmp * dir : cmp;
    }

    // ---------- FALLBACK ----------
    const cmp = String(a).localeCompare(String(b));
    return isActiveSort ? cmp * dir : cmp;
}



function compareSkills(a, b) {
    const { key, dir } = SkillViewState.sort;

    const lang = window.APP_LANG === 'de' ? 'de' : 'en';
    const nameA = a[`name_${lang}`] || a.name_en;
    const nameB = b[`name_${lang}`] || b.name_en;

    if (key) {
        let av, bv;

        switch (key) {
            case 'name':
                av = nameA;
                bv = nameB;
                break;

            case 'profession':
                av = Lookups.professions[a.profession] ?? '';
                bv = Lookups.professions[b.profession] ?? '';
                break;

            case 'attribute':
                av = Lookups.attributes[a.attribute]?.name ?? '';
                bv = Lookups.attributes[b.attribute]?.name ?? '';
                break;

            default:
                av = a[key] ?? 0;
                bv = b[key] ?? 0;
        }

        if (av !== bv) {
            return (av > bv ? 1 : -1) * dir;
        }

        // secondary alphabetical sort (language-aware)
        return nameA.localeCompare(nameB);
    }

    // no user sort → alphabetical (language-aware)
    return nameA.localeCompare(nameB);
}

/* ============================
   Skill List Header actions
============================ */

function toggleSort(key) {
    const sort = SkillViewState.sort;

    // CASE 1: clicking a new column → start ascending
    if (sort.key !== key) {
        sort.key = key;
        sort.dir = 1;
    }
    // CASE 2: same column, ascending → descending
    else if (sort.dir === 1) {
        sort.dir = -1;
    }
    // CASE 3: same column, descending → OFF
    else {
        sort.key = null;
        sort.dir = 1;
    }

    SkillListView.updateItems();
    SkillListView.render();
}

function toggleGroup(key) {
    SkillViewState.groups = normalizeGroups(SkillViewState.groups);

    const isActive = SkillViewState.groups.includes(key);

    // === TOGGLE OFF ===
    if (isActive) {
        SkillViewState.groups = SkillViewState.groups.filter(k => k !== key);
    }
    // === TOGGLE ON ===
    else {
        if (GROUP_EXCLUSIVE.includes(key)) {
            SkillViewState.groups = SkillViewState.groups.filter(
                k => !GROUP_EXCLUSIVE.includes(k)
            );
        }
        SkillViewState.groups.push(key);
    }

    SkillListView.updateItems();
    SkillListView.render();
    renderSkillListHeader();
}

/* =====
FOR FONTAWESOME ICONS:
render: 'fa'
icon: fontawesome class

FOR IMAGE ICONS:
render: 'img'
 src: urls to icons
===== */

const HEADER_ICON_MAP = {
    adrenaline: {
        render: 'fa',
        icon: 'fa-solid fa-hand-fist fa-flip-horizontal',
        class: 'adrenaline-red'
    },
    energy: {
        render: 'fa',
        icon: 'fa-notdog fa-solid fa-circle',
        class: 'energy-blue'
    },
    upkeep: {
        render: 'fa',
        icon: 'fa-duotone fa-solid fa-circle-chevron-right',
        class: 'upkeep-blue'
    },
    activation: {
        render: 'fa',
        icon: 'fa-solid fa-clock-three',
        class: 'activate-yellow'
    },
    recharge: {
        render: 'fa',
        icon: 'fa-solid fa-rotate-right fa-rotate-270',
        class: 'recharge-yellow'
    },
    overcast: {
        render: 'fa',
        icon: 'fa-notdog fa-solid fa-circle',
        class: 'overcast-grey'
    },

    /* ===== SKILL TYPE COLUMN ===== */
    type: {
        render: 'fa',
        icon: 'fa-duotone fa-thin fa-tag',
        class: 'red-blue'
    },

    elite: {
        render: 'fa',
        icon: 'fa-regular fa-square',
        class: 'elite-yellow'
    },
    profession: {
        render: 'fa',
        icon: 'fa-duotone fa-solid fa-helmet-battle',
        class: 'gold-bronze'
    },
    skilltype: {
        render: 'fa',
        icon: 'fa-duotone fa-thin fa-tag',
        class: 'red-blue'
    },
    pve_only: {
        render: 'fa',
        icon: 'fa-solid fa-circle-user',
        class: 'filter-pve-only'
    },
    pre_searing: {
        render: 'fa',
        icon: 'fa-duotone fa-regular fa-castle',
        class: 'filter-pre-searing'
    },
    favorite: {
        render: 'fa',
        icon: 'fa-solid fa-star',
        class: 'filter-favorite-star'
    },
    rating: {
        render: 'fa',
        icon: 'fa-solid fa-star',
        class: 'filter-rating-star'
    },
    book: {
        render: 'fa',
        icon: 'fa-duotone fa-solid fa-book-copy',
        class: 'filter-books-stack'
    },
    label: {
        render: 'fa',
        icon: 'fa-duotone fa-solid fa-bookmark',
        class: 'filter-label-marks'
    },

    sacrifice: {
        render: 'fa',
        icon: 'fa-sharp fa-solid fa-droplet',
        class: 'sacrifice-red'
    },
    campaign: {
        render: 'fa',
        icon: 'fa-solid fa-swords',
        class: 'campaign-gold'
    },
    condition: {
        render: 'fa',
        icon: 'fa-duotone fa-solid fa-staff-snake',
        class: 'condition-blue'
    },
    text: {
        render: 'fa',
        icon: 'fa-light fa-input-text',
        class: 'text-black'
    },
    attribute: {
        render: 'fa',
        icon: 'fa-etch fa-solid fa-star',
        class: 'attribute-green'
    }
};
window.HEADER_ICON_MAP = HEADER_ICON_MAP;


function createHeaderIcon(colKey) {
    const cfg = HEADER_ICON_MAP[colKey];
    if (!cfg) return null;

    if (cfg.render === 'img') {
        const img = document.createElement('img');
        img.src = cfg.src;
        img.className = `skill-header-icon ${cfg.class}`;
        img.alt = colKey;
        return img;
    }

    if (cfg.render === 'fa') {
        const i = document.createElement('i');
        i.className = `${cfg.icon} ${cfg.class} skill-header-icon`;
        return i;
    }

    return null;
}

function rerenderToolbars() {
    renderToolbarExtension();
    // renderSkillListHeader(); // intentionally not used anymore
}

function isFilterActive(key) {
    return !!FilterEngine?.get(key);
}


function buildHeaderControl(col, mode) {
    const root = document.createElement('div');

    // container class depends on mode
    root.className =
        mode === 'compact'
            ? 'skill-header-item'
            : 'toolbar-control';

    if (SkillViewState.sort.key === col.key) {
        root.classList.add('active');
    }

    if (SkillViewState.groups.includes(col.key)) {
        root.classList.add('group-active');
    }

    /* ===== COLUMN ICON (FROM HEADER_ICON_MAP) ===== */
    const headerIcon = createHeaderIcon(col.key);
    if (headerIcon) {
        headerIcon.onclick = e => {
            e.stopPropagation();
            toggleSort(col.key);
            rerenderToolbars();
        };
    }

    /* ===== SORT ICON ===== */
    const sortIcon = document.createElement('i');
    sortIcon.className = `${sortIconClass(col.key)} skill-header-icon`;
    sortIcon.onclick = e => {
        e.stopPropagation();
        toggleSort(col.key);
        rerenderToolbars();
    };

    /* ===== LABEL ===== */
    const label = document.createElement('span');
    label.className =
        mode === 'compact'
            ? 'skill-header-label'
            : 'label';
    label.textContent = col.label;
    label.onclick = () => {
        toggleSort(col.key);
        rerenderToolbars();
    };

    /* ===== GROUP ICON ===== */
    const groupIcon = document.createElement('i');
    groupIcon.className = `${groupIconClass(col.key)} skill-header-icon`;
    groupIcon.onclick = e => {
        e.stopPropagation();
        toggleGroup(col.key);
        rerenderToolbars();
    };


    if (mode === 'compact') {
        // ORIGINAL HEADER BEHAVIOR
        root.append(sortIcon);

        if (headerIcon) root.append(headerIcon);
        root.append(label);

        if (col.groupable) root.append(groupIcon);
 
    } else {
        // EXTENDED PANEL BEHAVIOR
        const spacer = document.createElement('span');
        spacer.className = 'spacer';

        root.append(
            headerIcon,
            label,
            spacer,
            sortIcon,
            groupIcon,
        );
    }

    return root;
}


function renderSkillListHeader() {
    console.log('old render triggered');
}


function renderToolbarExtension() {
    const host = document.getElementById('skillToolbarExtension');
    if (!host) return;

    host.innerHTML = '';

    SkillHeaderCols.forEach(col => {
        host.appendChild(
            buildHeaderControl(col, 'expanded')
        );
    });
}



/* ============================
   Skill List Header group row rendering
============================ */

function renderGroupRow(item) {

    const { node, level } = item;

    GroupCollapseState[node.id] = node.collapsed;

    const skillCount = countRawSkills(node.children);

    // ===== OUTER: virtualization row (fixed height) =====
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.style.height = item.height + 'px';

    // ===== INNER: visual group =====
    const div = document.createElement('div');
    div.className = `skill-group level-${level}`;

    if (!node.collapsed) {
        div.classList.add('open');
    }

    // ---------- CARET ----------
    const caret = document.createElement('i');
    caret.className = node.collapsed
        ? 'fa-sharp fa-solid fa-caret-right group-caret'
        : 'fa-sharp fa-solid fa-caret-down group-caret';

// ---------- ICON ----------
let iconEl = null;
let color = null;

/* ===== PROFESSION ===== */
if (node.key === 'profession') {
const profId   = Number(node.value);
const profName = Lookups.professions[profId] ?? '';

color = PROFESSION_COLORS[profId] ?? '#777';

iconEl = document.createElement('img');
iconEl.className = 'group-icon profession';

if (profId === PROF_NONE) {
    iconEl.src = 'https://skilter.magical.ch/img/icons/Any-tango-icon-20.png';
    iconEl.alt = 'Any';
} else {
    const iconName = PROF_ICON_NAMES[profId];
    if (iconName) {
        iconEl.src = `https://guildwars.magical.ch/img/icons/${iconName}-tango-icon-200.png`;
        iconEl.alt = profName; // localized alt text is GOOD
        iconEl.onerror = () => iconEl.remove();
    }
}

}

else if (node.key === 'attribute') {
    const attr = Lookups.attributes[String(node.value)];

    const profId = PROF_NAME_TO_ID[attr?.profession];
    color = PROFESSION_COLORS[profId] ?? '#aaa';

    iconEl = document.createElement('i');

    if (attr?.faicon) {
        iconEl.className = `${attr.faicon} group-icon attribute`;
    } else {
        iconEl.className = 'fa-etch fa-regular fa-star group-icon attribute';
    }

    iconEl.style.color = color;
}



    else if (['energy','adrenaline','activation','recharge','overcast'].includes(node.key)) {

        const valueEl = document.createElement('span');
        valueEl.className = 'group-value';
        valueEl.textContent = halfify(Number(node.value));

        iconEl = document.createElement('img');
        iconEl.className = 'group-icon resource';
        iconEl.src = `https://guildwars.magical.ch/img/icons/${node.key}.png`;
        iconEl.alt = node.key;

        const labelText = t(node.key);


        const countEl = document.createElement('span');
        countEl.className = 'group-count';
        countEl.textContent = ` (${skillCount})`;

        div.appendChild(caret);
        div.appendChild(valueEl);
        div.appendChild(iconEl);
        div.appendChild(document.createTextNode(` ${labelText}`));
        div.appendChild(countEl);

        div.addEventListener('click', () => {
            node.collapsed = !node.collapsed;
            GroupCollapseState[node.id] = node.collapsed;
            SkillListView.updateItems();
            SkillListView.render();
        });

        row.appendChild(div);
        return row;
    }

    else if (node.key === 'type') {

        const typeId = Number(node.value);
        const type = Lookups.skillTypes?.[String(typeId)];

        if (!type) {
            console.error('Missing skill type lookup for id:', typeId);
            return null;
        }

        const label = document.createElement('span');
        label.className = 'group-label';
        label.textContent = type.name;

        const countEl = document.createElement('span');
        countEl.className = 'group-count';
        countEl.textContent = ` (${skillCount})`;

        div.appendChild(caret);
        div.appendChild(label);
        div.appendChild(countEl);

        div.addEventListener('click', () => {
            node.collapsed = !node.collapsed;
            GroupCollapseState[node.id] = node.collapsed;
            SkillListView.updateItems();
            SkillListView.render();
        });

        row.appendChild(div);
        return row;
    }

    // ===== ELITE =====
else if (node.key === 'elite') {

    const isElite = Number(node.value) === 1;

    const icon = document.createElement('i');
    icon.className = isElite
        ? 'fa-sharp fa-solid fa-star-sharp group-icon elite'
        : 'fa-sharp fa-solid fa-square group-icon non-elite';

    if (isElite) {
        icon.style.color = '#d4af37'; // gold
    } else {
        icon.style.color = '#777'; // grey
    }

    const label = document.createElement('span');
    label.className = 'group-label';
    label.textContent = isElite ? t('elite') : t('nonElite');

    const countEl = document.createElement('span');
    countEl.className = 'group-count';
    countEl.textContent = ` (${skillCount})`;

    div.appendChild(caret);
    div.appendChild(icon);
    div.appendChild(label);
    div.appendChild(countEl);

    div.addEventListener('click', () => {
        node.collapsed = !node.collapsed;
        GroupCollapseState[node.id] = node.collapsed;
        SkillListView.updateItems();
        SkillListView.render();
    });

    row.appendChild(div);
    return row;
}

    // ---------- LABEL (fallback) ----------
    const label = document.createElement('span');
    label.className = 'group-label';
    label.textContent = formatGroupLabel(node.key, node.value);

    const countEl = document.createElement('span');
    countEl.className = 'group-count';
    countEl.textContent = ` (${skillCount})`;

    div.appendChild(caret);
    if (iconEl) div.appendChild(iconEl);
    div.appendChild(label);
    div.appendChild(countEl);

if (color) {
    div.style.borderLeft = `4px solid ${color}`;
    div.style.color = color;
} else {
    div.style.borderLeft = '4px solid #666';
    div.style.color = '#aaa';
}


    div.addEventListener('click', () => {
        node.collapsed = !node.collapsed;
        GroupCollapseState[node.id] = node.collapsed;
        SkillListView.updateItems();
        SkillListView.render();
    });

    row.appendChild(div);
    return row;
}



const GROUP_ORDER = ['profession', 'attribute', 'type', 'elite', ...GROUP_EXCLUSIVE];

function normalizeGroups(groups) {
    const out = [];
    for (const key of GROUP_ORDER) {
        if (groups.includes(key)) out.push(key);
    }
    return out;
}

const I18N = {
    en: {
        profession: 'Profession',
        attribute: 'Attribute',
        type: 'Skill Type',
        energy: 'Energy',
        activation: 'Casting Time',
        recharge: 'Recharge Time',
        overcast: 'Overcast',
        adrenaline: 'Adrenaline',
        elite: 'Elite Skill',
        nonElite: 'Non-Elite Skill',
        noAttribute: 'No Attribute',
	searchPlaceholder: 'Search list ({count})',
	clear: 'Clear'

    },
    de: {
        profession: 'Klasse',
        attribute: 'Attribut',
        type: 'Fertigkeitstyp',
        energy: 'Energiekosten',
        activation: 'Aktivierungszeit',
        recharge: 'Wiederaufladezeit',
        overcast: 'Überladung',
        adrenaline: 'Adrenalin',
        elite: 'Elite-Fertigkeit',
        nonElite: 'Nicht-Elite-Fertigkeit',
        noAttribute: 'Kein Attribut',
	searchPlaceholder: 'Liste durchsuchen ({count})',
	clear: 'Zurücksetzen'
    }
};


function t(key, vars = null) {
    const lang = window.APP_LANG || 'en';
    let str = I18N[lang]?.[key] ?? I18N.en[key] ?? key;

    if (vars && typeof str === 'string') {
        str = str.replace(/\{(\w+)\}/g, (_, k) =>
            vars[k] != null ? String(vars[k]) : `{${k}}`
        );
    }
    return str;
}

function updateSearchPlaceholderCount(count) {
    const input = document.getElementById('skillSearchInput');
    if (!input) return;

    input.placeholder = t('searchPlaceholder', { count });
}


const SkillHeaderCols = [
    { key: 'profession',  label: t('profession'),  groupable: true },
    { key: 'attribute',   label: t('attribute'),   groupable: true },
    { key: 'type',        label: t('type'),        groupable: true },
    { key: 'energy',      label: t('energy'),      groupable: true },
    { key: 'activation',  label: t('activation'),  groupable: true },
    { key: 'recharge',    label: t('recharge'),    groupable: true },
    { key: 'overcast',    label: t('overcast'),    groupable: true },
    { key: 'adrenaline',  label: t('adrenaline'),  groupable: true },
    { key: 'elite',       label: t('elite'),       groupable: true }
];

function formatGroupLabel(key, value) {
    switch (key) {

        case 'profession':
            return Lookups.professions[value] ?? '';

        case 'attribute':
            return Lookups.attributes[value]?.name ?? t('noAttribute');

        case 'energy':
        case 'adrenaline':
        case 'activation':
        case 'recharge':
        case 'overcast':
            return `${value} ${t(key)}`;

        case 'elite':
  	    return Number(value) === 1 ? t('elite') : t('nonElite');

        default:
            return String(value);
    }
}

function sortIconClass(key) {
    if (SkillViewState.sort.key !== key) {
        return 'fa-sharp fa-thin fa-sort';
    }
    return SkillViewState.sort.dir === 1
        ? 'fa-sharp fa-solid fa-sort-up'
        : 'fa-sharp fa-solid fa-sort-down';
}

function groupIconClass(key) {
    return SkillViewState.groups.includes(key)
        ? 'fa-sharp fa-solid fa-layer-group'
        : 'fa-sharp fa-thin fa-layer-group';
}


/* ============================
   Skill Row Rendering
============================ */

function halfify(num) {

    if (num == null) return '0';

    // round to nearest 0.25
    const rounded = Math.round(num * 4) / 4;

    const whole = Math.floor(rounded);
    const frac = rounded - whole;

    // exact integer
    if (frac === 0) {
        return whole.toString();
    }

    const prefix = whole > 0 ? whole.toString() : '';

    if (Math.abs(frac - 0.25) < 0.001) return prefix + '¼';
    if (Math.abs(frac - 0.5)  < 0.001) return prefix + '½';
    if (Math.abs(frac - 0.75) < 0.001) return prefix + '¾';

    // fallback safety (should never hit now)
    return rounded.toString();
}
window.halfify = halfify;

function createSkillIconElement(skill) {

    const wrapper = document.createElement('div');
    wrapper.className = 'skill-icon-wrapper';

    const img = document.createElement('img');
    img.className = 'skill-icon';
    img.src = `https://guildwars.magical.ch/img/skill_icons/${skill.name_en.replace(/[ "]/g, '_')}.jpg`;
    img.alt = '';
    img.draggable = false;

    wrapper.appendChild(img);

    // ==== SKILL TYPE ICON ====
    const type = Lookups.skillTypes?.[skill.type];

    if (type?.icon) {
        const overlay = document.createElement('img');
        overlay.className = 'skilltype-overlay-icon';
        overlay.src = `https://skiltr.magical.ch/img/icons/${type.icon}.png`;
        overlay.alt = '';
        overlay.draggable = false;

        wrapper.appendChild(overlay);
    }

    return wrapper;
}

function renderSkillRow(skill) {
    switch (SkillViewMode) {
        case VIEW_MODES.LIST_DETAILED:
            return renderSkillRowDetailed(skill);
        case VIEW_MODES.ICON_GRID:
            return renderSkillIcon(skill);
        default:
            return renderSkillRowCompact(skill);
    }
}

function renderSkillRowDetailed(skill) {
    const div = renderSkillRowCompact(skill);
    div.classList.add('detailed');

    const desc = document.createElement('div');
    desc.className = 'skill-row-description';

    const attrId = skill.attribute;
desc.innerHTML = attrId != null
    ? applyAttributeValues(skillDesc(skill) ?? '', attrId)

        : (skillDesc(skill) ?? '');

    div.appendChild(desc);
    return div;
}

window.renderSkillRowDetailed = renderSkillRowDetailed;

function renderSkillRowCompact(skill) {

    const div = document.createElement('div');
    div.className = 'skill-row';

    const attr = Lookups.attributes[skill.attribute]?.name ?? 'No Attribute';
    const prof = Lookups.professions[skill.profession] ?? 'All';

    const icon = type =>
        `<img src="https://guildwars.magical.ch/img/icons/${type}.png" alt="">`;

    const skillIconName = skill.name_en.replace(/[ "]/g, '_');
    const typeName = Lookups.skillTypes?.[skill.type]?.name ?? null;

    const attrValue = window.AttributeValues?.[skill.attribute] ?? 0;

    div.innerHTML = `
        <div class="skill-row-top">

            <div class="skill-row-text">
                <div class="skill-row-main">
                    <strong class="skill-row-name">${skillName(skill)}</strong>

                    <span class="skill-row-costs">
                        <span class="cost-slot">
                            ${skill.overcast > 0 ? `<strong>${halfify(skill.overcast)}</strong>${icon('overcast')}` : ''}
                            ${skill.sacrifice > 0 ? `<strong>${halfify(skill.sacrifice)}%</strong>${icon('sacrifice')}` : ''}
                            ${skill.upkeep < 0 ? `<strong>${halfify(skill.upkeep)}</strong>${icon('upkeep')}` : ''}
                        </span>

                        <span class="cost-slot">
                            ${(() => {
                                if (skill.energy <= 0) return '';
                                const mod = applyEnergyModifiers(skill, skill.energy);
                                return `<strong style="${mod.modified ? `color:${mod.color}` : ''}">
                                            ${halfify(mod.energy)}
                                        </strong>${icon('energy')}`;
                            })()}
                            ${skill.adrenaline > 0 ? `<strong>${halfify(skill.adrenaline)}</strong>${icon('adrenaline')}` : ''}
                        </span>

                        <span class="cost-slot">
                            ${(() => {
                                if (skill.activation <= 0) return '';
                                const fc = applyFastCasting(skill, skill.activation, skill.recharge);
                                return `<strong class="${fc.activationModified ? 'fastcast-purple' : ''}">
                                            ${halfify(fc.activation)}
                                        </strong>${icon('activation')}`;
                            })()}
                        </span>

                        <span class="cost-slot">
                            ${(() => {
                                if (skill.recharge <= 0) return '';
                                const fc = applyFastCasting(skill, skill.activation, skill.recharge);
                                return `<strong class="${fc.rechargeModified ? 'fastcast-purple' : ''}">
                                            ${halfify(fc.recharge)}
                                        </strong>${icon('recharge')}`;
                            })()}
                        </span>
                    </span>
                </div>

                <div class="skill-row-sub">
                    ${[
                        typeName,
                        skill.attribute ? `${attr}` : null,
                        skill.profession !== PROF_NONE ? prof : null
                    ].filter(Boolean).join(' · ')}
                </div>

                <div class="skill-row-meta" data-skill-id="${skill.id}"></div>
            </div>
        </div>
    `;

const top = div.querySelector('.skill-row-top');
const iconEl = createSkillIconElement(skill);
top.insertBefore(iconEl, top.firstChild);

    /* ==============================
       DRAG FUNCTIONALITY
    =============================== */

    const img = div.querySelector('.skill-icon-wrapper img');

    if (img) {

        /* DESKTOP DRAG */
        img.draggable = true;

        img.addEventListener('dragstart', e => {
            e.stopPropagation();

            DragState.skill = skill;
            DragState.source = 'list';
            DragState.handled = false;

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
    }

    /* ==============================
       CLICK FOR DETAILS
    =============================== */

    div.addEventListener('click', () => openSkillDetails(skill));

    /* ==============================
       LOAD META
    =============================== */

    loadRowMeta(div, skill.id);

    return div;
}

function renderRowMeta(container, meta) {
    container.innerHTML = '';

    meta = meta ?? {
        is_favorite: 0,
        rating: null,
        labels: [],
        notes: []
    };

    const hasFavorite = !!meta.is_favorite;
    const hasRating   = !!meta.rating;
    const hasLabels   = (meta.labels ?? []).length > 0;
    const hasNotes    = (meta.notes ?? []).length > 0;

    if (!hasFavorite && !hasRating && !hasLabels && !hasNotes)
        return;

    const wrap = document.createElement('div');
    wrap.className = 'skill-row-meta-inner';

    /* ===== FAVORITE ===== */
    if (hasFavorite) {
        const star = document.createElement('i');
        star.className = 'fa-solid fa-star row-meta-favorite';
        wrap.appendChild(star);
    }

    /* ===== RATING GROUP ===== */
    if (hasRating) {
        const ratingGroup = document.createElement('div');
        ratingGroup.className = 'row-meta-rating-group';

        for (let i = 0; i < meta.rating; i++) {
            const star = document.createElement('i');
            star.className = 'fa-solid fa-star row-meta-rating';
            ratingGroup.appendChild(star);
        }

        wrap.appendChild(ratingGroup);
    }

    /* ===== NOTE ICON ===== */
    if (hasNotes) {
        const note = document.createElement('i');
        note.className = 'fa-solid fa-note row-meta-note';
        wrap.appendChild(note);
    }

    /* ===== LABELS ===== */
    (meta.labels ?? []).forEach(label => {
        const icon = document.createElement('i');

        if (label.color_secondary) {
            icon.className = 'fa-duotone fa-solid fa-bookmark row-meta-label';
            icon.style.setProperty('--fa-primary-color', label.color_primary);
            icon.style.setProperty('--fa-secondary-color', label.color_secondary);
        } else {
            icon.className = 'fa-sharp fa-solid fa-bookmark row-meta-label';
            icon.style.color = label.color_primary;
        }

        wrap.appendChild(icon);
    });

    container.appendChild(wrap);
}

async function loadRowMeta(rowEl, skillId) {
if (!window.SkillMetaStore) {
    window.SkillMetaStore = {
        bySkillId: new Map(),
        loaded: new Set()
    };
}
    const container = rowEl.querySelector('.skill-row-meta');
    if (!container) return;

    // already cached
    if (window.SkillMetaStore?.bySkillId?.has(skillId)) {
        renderRowMeta(container, window.SkillMetaStore.bySkillId.get(skillId));
        return;
    }

    // avoid duplicate fetch
    if (window.SkillMetaStore?.loaded?.has(skillId)) return;
    window.SkillMetaStore.loaded.add(skillId);

    try {
        const meta = await skillMetaAction({
            action: 'get_meta',
            skill_id: skillId
        });

        window.SkillMetaStore.bySkillId.set(skillId, meta);

        renderRowMeta(container, meta);

    } catch (e) {
        console.error('Row meta load failed', e);
    }
}


function renderSkillIcon(skill) {
    const div = document.createElement('div');
    div.className = 'skill-icon-tile';

const iconEl = createSkillIconElement(skill);
div.appendChild(iconEl);

// ==== SKILL TYPE ICON ====
const type = Lookups.skillTypes?.[skill.type];

if (type?.icon) {
    const typeIcon = document.createElement('img');
    typeIcon.className = 'skilltype-overlay-icon';
    typeIcon.src = `https://skiltr.magical.ch/img/icons/${type.icon}.png`;
    typeIcon.alt = '';
    typeIcon.draggable = false;

    div.appendChild(typeIcon);
}

    // normal click still opens details
    div.addEventListener('click', () => openSkillDetails(skill));

    // enable dragging on the tile
    div.draggable = true;

    div.addEventListener('dragstart', e => {
        // set global drag state
        DragState.skill = skill;

        // browser requirement (esp. Firefox)
        e.dataTransfer.setData('text/plain', skill.id);
        e.dataTransfer.effectAllowed = 'copy';

        // reveal skillbar panel
        showSkillbarPanel();
    });

div.addEventListener('touchstart', e => {

    e.preventDefault();
    e.stopPropagation();

    window.TouchDragState.skill = skill;
    window.TouchDragState.active = true;
    window.TouchDragState.lastSlot = null;

const ghost = document.getElementById('touch-drag-ghost');
ghost.src = `https://guildwars.magical.ch/img/skill_icons/${skill.name_en.replace(/[ "]/g, '_')}.jpg`;
ghost.style.display = 'block';

    showSkillbarPanel();
}, { passive: false });


    return div;
}


function renderIconRow(item) {
    const row = document.createElement('div');
    row.className = 'skill-gridicon-row';

    item.skills.forEach(skill => {
        const icon = renderSkillIcon(skill);
        icon.classList.add('skill-gridicon');
        row.appendChild(icon);
    });

    return row;
}


/* ============================
   Skill Details
============================ */

function applyAttributeValues(description, attributeId) {
    const rank = AttributeValues[attributeId] ?? 0;


    return description.replace(/\d+\.\.\d+/g, match => {
        const [min, max] = match.split('..').map(Number);
        const value = min + ((max - min) * rank) / 15;
        return `<span class="dynamic-number">${Math.round(value)}</span>`;
    });
}

function costLine(icon, label, value) {
    return `
        <div class="skill-cost-line">
            <img src="https://guildwars.magical.ch/img/icons/${icon}.png" alt="">
            <span>${label}:</span>
            <strong>${halfify(value)}</strong>
        </div>
    `;
}

/* ============================
   Attribute Sliders
============================ */

function renderAttributeSettings() {
    const panel = document.getElementById('panel-settings');
    if (!panel) return;

    panel.innerHTML = '<h2>Attributes</h2>';

    // build name → id map ONCE
const PROF_NAME_TO_ID = {};
Object.entries(PROF_ICON_NAMES).forEach(([id, name]) => {
    PROF_NAME_TO_ID[name] = Number(id);
});


    const groups = {};

    Object.values(Lookups.attributes).forEach(attr => {

        // skip invalid
        if (attr.profession === 'none' && !/Title Track/i.test(attr.name)) {
            return;
        }

        const profId =
            /Title Track/i.test(attr.name)
                ? 'title'
                : PROF_NAME_TO_ID[attr.profession]; // ← FIXED

        if (!groups[profId]) {
            groups[profId] = {
                label:
                    profId === 'title'
                        ? 'Title Track'
                        : Lookups.professions[profId],
                attrs: []
            };
        }

        groups[profId].attrs.push(attr);
    });

    Object.entries(groups).forEach(([profId, group]) => {
        const section = document.createElement('div');
        section.className = 'attr-group card collapsed';

        const color =
            profId === 'title'
                ? '#777'
                : (PROFESSION_COLORS[profId] ?? '#777');

        section.innerHTML = `
            <div class="attr-group-header" style="--prof-color:${color}">
                <div class="attr-group-title">
                    ${
                        profId !== 'title' && PROF_ICON_NAMES[profId]
                            ? `<img
                                src="https://guildwars.magical.ch/img/icons/${PROF_ICON_NAMES[profId]}-tango-icon-200.png"
                                class="prof-icon"
                                alt=""
                                loading="lazy"
                                onerror="this.remove()"
                              >`
                            : ''
                    }
                    <span>${group.label}</span>
                </div>
                <span class="attr-group-toggle">▸</span>
            </div>
            <div class="attr-group-body"></div>
        `;

        const body = section.querySelector('.attr-group-body');
        const header = section.querySelector('.attr-group-header');
        const toggle = section.querySelector('.attr-group-toggle');

        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
            toggle.textContent = section.classList.contains('collapsed') ? '▸' : '▾';
        });

        group.attrs.forEach(attr => {
            const max = attr.max ?? 21;

if (!window.AttributeValues) window.AttributeValues = {};

if (window.AttributeValues[attr.id] == null) {
    window.AttributeValues[attr.id] = 0;
}

const value = window.AttributeValues[attr.id];



            const row = document.createElement('div');
            row.className = 'attribute-setting';

            row.innerHTML = `
                <div class="attr-header">
                    <span class="attr-name">${attr.name}</span>
                    <span class="attr-value">${value}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="${max}"
                    value="${value}"
                    data-attr="${attr.name}"
                    style="accent-color:${color}"
                >
            `;

            const slider = row.querySelector('input');
            const valueLabel = row.querySelector('.attr-value');
const sync = () => {
    const current = window.AttributeValues?.[attr.id] ?? 0;
    slider.value = current;
    valueLabel.textContent = current;
};

document.addEventListener('attributes:changed', sync);

            slider.addEventListener('input', () => {
    let v = parseInt(slider.value, 10) || 0;

if (window.BuildViewerActive) {
    if (v > 12) v = 12;
    slider.value = String(v);
}

    const id = Number(attr.id);

    // ===== IF BUILD VIEWER ACTIVE → APPLY RESTRICTIONS =====
    if (window.BuildViewerActive && window._BuildViewerRestriction) {

        const R = window._BuildViewerRestriction;

        // inactive attribute → force 0
        if (!R.getActiveKeys().has(id)) {
            slider.value = '0';
            window.setAttributeValue(id, 0);
            return;
        }

        const old = window.AttributeValues[id] ?? 0;

        const usedBefore = R.used();
        const usedAfter =
            usedBefore
            - R.rankCost(old)
            + R.rankCost(v);

        if (usedAfter > 200) {
            slider.value = String(old);
            return;
        }

        window.setAttributeValue(id, v);
        return;
    }

    // ===== NORMAL (UNRESTRICTED) =====
    window.setAttributeValue(id, v);
});



            body.appendChild(row);
        });

        panel.appendChild(section);
    });
}

/* ============================
   Bootstrapping
============================ */

renderSkillListHeader();
// call SkillListView.init() and renderAttributeSettings()
// from app.js AFTER lookups & SkillStore are ready

document.dispatchEvent(new Event("ui:skills:ready"));
