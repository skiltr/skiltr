window.RelationStore = {
    all: [],
    bySkill: new Map(),
    ready: false
};

fetch('/api/skill_relations.php')
    .then(r => r.json())
    .then(rows => {
        RelationStore.all = rows;

        for (const rel of rows) {
            if (!RelationStore.bySkill.has(rel.skill_id)) {
                RelationStore.bySkill.set(rel.skill_id, []);
            }
            RelationStore.bySkill.get(rel.skill_id).push(rel);
        }

        RelationStore.ready = true; // ← THIS WAS MISSING
        document.dispatchEvent(new Event('relations:ready'));
    })
    .catch(err => {
        console.error('Failed to load skill relations', err);
    });
