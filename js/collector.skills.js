window.SkillCollector = {
    normalize(raw) {
        return {
            id: raw.id,

            // display name (language-ready)
            name:
                raw.name_en ||
                raw.name_de ||
                `(skill #${raw.id})`,

            // profession
            professionId: raw.profession,
            profession:
                Lookups.professions[raw.profession] || 'Unknown',

            // attribute
            attributeId: raw.attribute,
            attribute:
                Lookups.attributes[raw.attribute]?.name || 'No Attribute',

            // skill type
            typeId: raw.type,
            type:
                Lookups.skillTypes[raw.type] || 'Unknown',

            // keep raw for later scaling / details
            raw
        };
    },

    getSlice(offset, limit) {
        return SkillStore.all
            .slice(offset, offset + limit)
            .map(this.normalize);
    }
};

