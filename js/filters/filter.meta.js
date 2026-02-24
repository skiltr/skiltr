import { t } from '../i18n.js';

export const FILTER_META = {

    profession: {
        label: t('profession'),
        type: 'equals',
        multi: true,
        values: () =>
            Object.entries(Lookups.professions)
                .map(([id, name]) => {
                    const pid = Number(id);

                    const ICON_NAMES = {
                        0: 'Any',
                        1: 'Warrior',
                        2: 'Ranger',
                        3: 'Monk',
                        4: 'Necromancer',
                        5: 'Mesmer',
                        6: 'Elementalist',
                        7: 'Assassin',
                        8: 'Ritualist',
                        9: 'Paragon',
                        10: 'Dervish'
                    };

                    const iconName = ICON_NAMES[pid] ?? 'Any';

                    return {
                        id: pid,
                        label: name, // ← stays localized from Lookups
                        icon: `https://guildwars.magical.ch/img/icons/${iconName}-tango-icon-200.png`
                    };
                })
                .sort((a, b) => {
                    if (a.id === 0) return 1;
                    if (b.id === 0) return -1;
                    return a.label.localeCompare(b.label);
                })
    },

    attribute: {
        label: t('attribute'),
        type: 'hierarchy',
        invertible: true,
        multi: true
    },

    energy: {
        label: t('energy'),
        type: 'range',
        invertible: true,
        steps: [0, 1, 5, 10, 15, 25],
        color: '#2fa9ee'
    },

    adrenaline: {
        label: t('adrenaline'),
        type: 'range',
        invertible: true,
        min: 0,
        max: 10,
        color: '#b02525'
    },

    sacrifice: {
        label: t('sacrifice'),
        type: 'range',
        invertible: true,
        steps: [0, 2, 5, 8, 10, 15, 17, 20, 33],
        color: '#FF0C0B'
    },

    upkeep: {
        label: t('upkeep'),
        type: 'toggle',
        invertible: true
    },

    overcast: {
        label: t('overcast'),
        type: 'range',
        invertible: true,
        steps: [0, 5, 10],
        color: '#8e8e8e'
    },

    recharge: {
        label: t('recharge'),
        type: 'range',
        invertible: true,
        steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 25, 30, 45, 55, 60, 90],
        color: '#fec34b'
    },

    activation: {
        label: t('activation'),
        type: 'range',
        invertible: true,
        steps: [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 10],
        color: '#fac641'
    },

    skilltype: {
        label: t('skilltype'),
        type: 'hierarchy',
        invertible: true,
        multi: true,
        color: '#ff7700'
    },

    elite: {
        label: t('elite'),
        type: 'toggle',
        invertible: true
    },

    campaign: {
        label: t('campaign'),
        type: 'equals',
        invertible: true,
        multi: true,
        render: 'campaign'
    },

    pve_only: {
        label: t('pve_only'),
        type: 'toggle',
        invertible: true
    },

    pre_searing: {
        label: t('pre_searing'),
        type: 'toggle',
        invertible: true
    },

    favorite: {
        label: t('favorite'),
        type: 'toggle',
        invertible: true
    },

rating: {
    label: t('rating'),
    type: 'equals',
    invertible: true,
    multi: true,
    render: 'rating'
},

book: {
    label: t('book'),
    type: 'equals',
    invertible: true,
    multi: true,
    render: 'book'
},

label: {
    label: t('label'),
    type: 'equals',
    invertible: true,
    multi: true,
    render: 'label'
},

    text: {
        label: t('text'),
        type: 'text',
        invertible: true,
        render: 'text'
    },

condition: {
    label: t('condition'),
    type: 'equals',
    invertible: true,
    multi: true,
    render: 'condition'
}

};

window.FILTER_META = FILTER_META;
