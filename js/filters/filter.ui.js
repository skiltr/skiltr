import { FILTER_META } from './filter.meta.js';

export function initFilterUI(engine, onChange) {

    function setEquals(capsuleIndex, key, values) {

        const fn = (items) => {

            if (!values?.length) return [];

            return items.filter(skill => {

                // RATING
                if (key === 'rating') {
                    const meta = window.SkillMetaStore?.bySkillId?.get(skill.id);
                    const rating = meta?.rating ?? 0;
                    return values.includes(rating);
                }

                // FAVORITES
                if (key === 'favorite') {
                    const meta = window.SkillMetaStore?.bySkillId?.get(skill.id);
                    return meta?.is_favorite === 1;
                }

                // LABEL
                if (key === 'label') {
                    const meta = window.SkillMetaStore?.bySkillId?.get(skill.id);
                    if (!meta?.labels?.length) return false;
                    return meta.labels.some(l => values.includes(l.id));
                }

                // SKILL TYPE
if (key === 'skilltype') {
    return values.includes(Number(skill.type));
}

// UPKEEP
if (key === 'upkeep') {
    return skill.upkeep < 0;
}

// CONDITION
if (key === 'condition') {

    const relations = skill.condition_relations ?? [];

    return relations.some(rel =>
        values.includes(rel.condition_id)
    );
}

// CAMPAIGN
if (key === 'campaign') {
    return values.includes(Number(skill.campaign));
}

                // BOOK
                if (key === 'book') {

                    for (const bookId of values) {

                        const sections =
                            window.BookStore?.sectionsByBookId?.get(bookId);

                        if (!sections) continue;

                        for (const section of sections) {

                            const items =
                                window.BookStore?.itemsBySectionId
                                    ?.get(section.user_container_section_id);

                            if (!items) continue;

                            const found = items.some(i =>
                                i.type === 'skill' &&
                                i.skill_id === skill.id
                            );

                            if (found) return true;
                        }
                    }

                    return false;
                }

                // DEFAULT
                return values.includes(skill[key]);
            });
        };

        engine.set(capsuleIndex, key, fn, values);
        onChange?.();
    }



    function setRange(capsuleIndex, key, min, max) {
        const prev = engine.get(capsuleIndex, key);

        engine.set(
            capsuleIndex,
            key,
            skills => skills.filter(s => s[key] >= min && s[key] <= max),
            {
                ...prev?.values,
                min,
                max
            }
        );

        onChange?.();
    }

    function toggleNegated(capsuleIndex, key) {
        engine.toggleNegated(capsuleIndex, key);
        onChange?.();
    }

    function clear(capsuleIndex, key) {
        engine.remove(capsuleIndex, key);
        onChange?.();
    }

    function clearCapsule(capsuleIndex) {
        engine.clearCapsule(capsuleIndex);
        onChange?.();
    }

    function clearAll() {
        engine.clearAll();
        onChange?.();
    }

function setText(capsuleIndex, key, query) {

    const fn = (items) => {

        if (!query?.trim()) return items;

const tokens = query
    .toLowerCase()
    .replace(/\bund\b/g, 'and')
    .replace(/\boder\b/g, 'or')
    .split(/\s+/);

        return items.filter(skill => {

const text =
    (skill.name_en ?? '') + ' ' +
    (skill.desc_en ?? '') + ' ' +
    (skill.name_de ?? '') + ' ' +
    (skill.desc_de ?? '');

            const lower = text.toLowerCase();

            let result = null;
            let currentOp = 'and';

            for (const token of tokens) {

                if (token === 'and' || token === 'or') {
                    currentOp = token;
                    continue;
                }

                const contains = lower.includes(token);

                if (result === null) {
                    result = contains;
                } else {
                    if (currentOp === 'and') {
                        result = result && contains;
                    } else {
                        result = result || contains;
                    }
                }
            }

            return result === true;
        });
    };

    engine.set(capsuleIndex, key, fn, query);
    onChange?.();
}

function createMatcher(key, values) {

    if (!values?.length) return items => items;

    return (items) => {

        return items.filter(skill => {

            const meta = window.SkillMetaStore?.bySkillId?.get(skill.id);

            if (key === 'favorite') {
                return values.includes(meta?.is_favorite ? 1 : 0);
            }

            if (key === 'rating') {
                const rating = meta?.rating ?? 0;
                return values.includes(rating);
            }

            if (key === 'label') {
                if (!meta?.labels?.length) return false;
                return meta.labels.some(l => values.includes(l.id));
            }

            if (key === 'book') {
                if (!meta?.book_ids?.length) return false;
                return meta.book_ids.some(id => values.includes(id));
            }

            return values.includes(skill[key]);
        });
    };
}

return {
    setEquals,
    setRange,
    toggleNegated,
    clear,
    clearCapsule,
    clearAll,
    createMatcher,
    setText
};
}
