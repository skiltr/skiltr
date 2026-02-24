window.Lookups = {
    professions: [],
    campaigns: [],
    attributes: {},
    skillTypes: {},
    ready: false
};

const APP_LANG = window.APP_LANG || 'en';

fetch(`/api/lookups.php?lang=${APP_LANG}`)
    .then(r => r.json())
    .then(data => {
        Object.assign(Lookups, data);
        Lookups.ready = true;
        document.dispatchEvent(new Event('lookups:ready'));
    })
    .catch(err => console.error('Lookup load failed', err));

