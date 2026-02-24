import { FILTER_META } from './filter.meta.js';

export function renderFilterPills(engine) {
    console.log(
  'PILLS RUN',
);
    const host = document.getElementById('filterCapsules');
    if (!host) return;

    host.innerHTML = '';

    for (const key in FILTER_META) {

        const meta = FILTER_META[key];
        if (!meta) continue;

        const pill = document.createElement('div');
        pill.className = 'filter-pill';

        if (meta.type === 'equals') {
            renderEqualsPill(pill, key, meta, engine);
        }
        else if (meta.type === 'range') {
            renderRangePill(pill, key, meta, engine);
        }
        else if (meta.type === 'text') {
            renderTextPill(pill, key, meta, engine);
        }

        const close = document.createElement('span');
        close.className = 'pill-close';
        close.textContent = '×';
        close.onclick = () => {
            engine.remove(key);
            document.dispatchEvent(new Event('filters:changed'));
        };

        pill.appendChild(close);
        host.appendChild(pill);
    }
}

/* =========================
   Pill renderers (UI-only)
   ========================= */

function renderRangePill(pill, key, meta, engine) {
    const label = document.createElement('div');
    label.className = 'pill-label';
    label.textContent = meta.label ?? key;

    const state = engine.get(key) ?? {
        min: meta.min,
        max: meta.max
    };

    const minInput = document.createElement('input');
    minInput.type = 'range';
    minInput.min = meta.min;
    minInput.max = meta.max;
    minInput.value = state.min;

    const maxInput = document.createElement('input');
    maxInput.type = 'range';
    maxInput.min = meta.min;
    maxInput.max = meta.max;
    maxInput.value = state.max;

    minInput.oninput = maxInput.oninput = () => {
        engine.setRange(key, {
            min: Number(minInput.value),
            max: Number(maxInput.value)
        });
        document.dispatchEvent(new Event('filters:changed'));
    };

    pill.append(label, minInput, maxInput);
}
