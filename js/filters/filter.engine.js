export function createFilterEngine() {

    function createCapsule() {
        return new Map();
    }

    const capsules = [ createCapsule() ];

    /* =========================
       INTERNAL MATCHING
    ========================= */

    function matchesCapsule(item, capsule) {

for (const entry of capsule.values()) {

    if (typeof entry.fn !== 'function') {
        continue; // skip broken entry instead of crashing
    }

    const result = entry.fn([item]);
    const passed = result.length > 0;

    if (entry.negated ? passed : !passed) {
        return false;
    }
}


        return true;
    }

    /* =========================
       ENGINE API
    ========================= */

    return {

        /* ---------- Capsules ---------- */

        getCapsules() {
            return capsules;
        },

        addCapsule() {
            capsules.push(createCapsule());
        },

        removeCapsule(index) {
            if (capsules.length <= 1) return;
            capsules.splice(index, 1);
        },

        clearCapsule(index) {
            const capsule = capsules[index];
            if (!capsule) return;
            capsule.clear();
        },

        clearAll() {
            capsules.length = 0;
            capsules.push(createCapsule());
        },

        /* ---------- Pills ---------- */

        set(capsuleIndex, key, fn, values = null) {
            const capsule = capsules[capsuleIndex];
            if (!capsule) return;

            const prev = capsule.get(key);

            capsule.set(key, {
                fn,
                values,
                negated: prev?.negated ?? false
            });
        },

        remove(capsuleIndex, key) {
            const capsule = capsules[capsuleIndex];
            if (!capsule) return;

            capsule.delete(key);

            if (capsule.size === 0 && capsules.length > 1) {
                capsules.splice(capsuleIndex, 1);
            }
        },

        toggleNegated(capsuleIndex, key) {
            const capsule = capsules[capsuleIndex];
            if (!capsule) return;

            const entry = capsule.get(key);
            if (!entry) return;

            entry.negated = !entry.negated;
        },

        get(capsuleIndex, key) {
            const capsule = capsules[capsuleIndex];
            if (!capsule) return;
            return capsule.get(key);
        },

        /* ---------- Apply (OR logic) ---------- */

        apply(items) {
            return items.filter(item =>
                capsules.some(capsule =>
                    matchesCapsule(item, capsule)
                )
            );
        },

        /* ---------- Persistence ---------- */

        getState() {
            return capsules.map(capsule => {
                const obj = {};
                for (const [key, entry] of capsule.entries()) {
                    obj[key] = {
                        values: entry.values,
                        negated: entry.negated
                    };
                }
                return obj;
            });
        },

loadState(state, matcherFactory) {

    capsules.length = 0;

    if (!Array.isArray(state) || state.length === 0) {
        capsules.push(createCapsule());
        return;
    }

    state.forEach(capsuleState => {

        const capsule = createCapsule();

        for (const key in capsuleState) {

            const entry = capsuleState[key];

            const fn = matcherFactory?.(key, entry.values);

            capsule.set(key, {
                fn,
                values: entry.values,
                negated: entry.negated
            });
        }

        capsules.push(capsule);
    });

    if (capsules.length === 0) {
        capsules.push(createCapsule());
    }
}


    };
}
