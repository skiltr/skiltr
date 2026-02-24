export async function containerAction(payload) {
    const res = await fetch('/api/container.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Container API error');
    return json.data;
}
