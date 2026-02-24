window.SkillStore = {
    all: [],
    byId: new Map(),
    ready: false
};

fetch('/api/skills.php')
    .then(res => res.json())
    .then(skills => {
        SkillStore.all = skills;
        skills.forEach(s => SkillStore.byId.set(s.id, s));
        SkillStore.ready = true;
        document.dispatchEvent(new Event('skills:ready'));
	console.log("skills ready:", SkillStore.all.length);
    })
    .catch(err => {
        console.error('Failed to load skills', err);
    });
