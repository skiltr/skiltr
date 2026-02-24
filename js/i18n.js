export function t(key) {
    const lang = window.APP_LANG || 'en';

    const I18N = {
        en: {
            profession: 'Profession',
            attribute: 'Attribute',
            elite: 'Elite',
	    campaign: 'Campaign',
            pve_only: 'PvE only',
            pre_searing: 'Pre-Searing',
            upkeep: 'Upkeep',
            favorite: 'Favorite',
            rating: 'Rating',
	    book: 'Book',
	    label: 'Label',
            energy: 'Energy',
            adrenaline: 'Adrenaline',
	    sacrifice: 'Sacrifice',
            recharge: 'Recharge',
            activation: 'Activation',
            overcast: 'Overcast',
            skilltype: 'Skilltype',
	    condition: 'Condition',
            text: 'Text',
 	    add_filter: 'Add Filter',
  	    add_filter_group: 'Add Filter Group',
 	    text_pill_search: 'Search (supports AND aswell as OR)'
        },
        de: {
            profession: 'Klasse',
            attribute: 'Attribut',
            elite: 'Elite',
	    campaign: 'Kampagne',
            pve_only: 'PvE Fertigkeit',
            pre_searing: 'Pre-Searing',
            upkeep: 'Aufrechterhaltung',
            favorite: 'Favorit',
            rating: 'Bewertung',
	    book: 'Buch',
	    label: 'Markierung',
            energy: 'Energieverbrauch',
            adrenaline: 'Adrenalin',
	    sacrifice: 'Lebenspunkteopfer',
            recharge: 'Wiederaufladezeit',
            activation: 'Aktivierungszeit',
            overcast: 'Überladung',
            skilltype: 'Fertigkeits Typ',
	    condition: 'Zustand',
            text: 'Text',
  	    add_filter: 'Filter hinzufügen',
 	    add_filter_group: 'Filtergruppe hinzufügen',
 	    text_pill_search: 'Suchen (unterstützt UND sowie ODER)'
        }
    };

    return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}
