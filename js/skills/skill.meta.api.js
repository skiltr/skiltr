export async function skillMetaAction(payload) {
    const res = await fetch('/api/skill_meta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Skill Meta API error');
    return json.data;
}

window.skillMetaAction = skillMetaAction;
