 // skill.details.controller.js
import { loadSkillMeta } from './skill.details.meta.js';

let currentSkill = null;
let isOpen = false;

function renderSkillDetails(skill) {


    const title = document.getElementById('skillDetailsTitle');
    const content = document.getElementById('skillDetailsContent');

    const attrId = skill.attribute;
    const attrName = Lookups.attributes[attrId]?.name ?? '';
    const prof = Lookups.professions[skill.profession] ?? '';

    const icon = type =>
        `<img src="https://guildwars.magical.ch/img/icons/${type}.png" alt="">`;

    const skillIconName = skill.name_en.replace(/[ "]/g, '_');
    const typeName = Lookups.skillTypes?.[skill.type]?.name ?? null;

    const fc = applyFastCasting(skill, skill.activation, skill.recharge);

    // header
    title.innerHTML = `
    <span class="skill-details-header-row">
        <img
            class="skill-icon-details"
            src="https://guildwars.magical.ch/img/skill_icons/${skillIconName}.jpg"
            alt=""
        >

        <span class="skill-details-text">
            <span class="skill-details-main">
                ${(() => {
const wikiName = encodeURIComponent(
    skill.name_en.replace(/ /g, '_')
);    return `
        <a
            class="skill-title-text"
            href="https://wiki.guildwars.com/wiki/${wikiName}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${skillName(skill)}
        </a>
    `;
})()}

                <span class="skill-title-costs">
                    ${skill.overcast > 0 ? `<strong>${halfify(skill.overcast)}</strong>${icon('overcast')}` : ''}
                    ${skill.sacrifice > 0 ? `<strong>${halfify(skill.sacrifice)}%</strong>${icon('sacrifice')}` : ''}
                    ${skill.upkeep < 0 ? `<strong>${halfify(skill.upkeep)}</strong>${icon('upkeep')}` : ''}
                    ${skill.adrenaline > 0 ? `<strong>${halfify(skill.adrenaline)}</strong>${icon('adrenaline')}` : ''}

                    ${(() => {
                        if (skill.energy <= 0) return '';
                        const mod = applyEnergyModifiers(skill, skill.energy);
                        return `<strong style="${mod.modified ? `color:${mod.color}` : ''}">
                                    ${halfify(mod.energy)}
                                </strong>${icon('energy')}`;
                    })()}

                    ${skill.activation > 0
                        ? `<strong class="${fc.activationModified ? 'fastcast-purple' : ''}">
                               ${halfify(fc.activation)}
                           </strong>${icon('activation')}`
                        : ''}

                    ${skill.recharge > 0
                        ? `<strong class="${fc.rechargeModified ? 'fastcast-purple' : ''}">
                               ${halfify(fc.recharge)}
                           </strong>${icon('recharge')}`
                        : ''}
                </span>
            </span>

            <span class="skill-details-sub">
                ${typeName ?? ''}
                ${attrName ? ` · ${attrName}` : ''}
                ${skill.profession !== PROF_NONE ? ` · ${prof}` : ''}
            </span>

            <span class="skill-details-meta" id="skillDetailsMeta"></span>

        </span>
    </span>
`;


    // description
    const description = attrId != null
        ? applyAttributeValues(skillDesc(skill) ?? '', attrId)
        : (skillDesc(skill) ?? '');

    content.innerHTML = `
        <div class="skill-description">
            ${description}
        </div>
    `;

    loadSkillMeta(skill.id);

}

export function openSkillDetails(skill) {
    currentSkill = skill;
    isOpen = true;

    renderSkillDetails(skill);

    document.querySelector('.center')
        ?.classList.add('details-open');
}

export function refreshSkillDetails() {
    if (!isOpen || !currentSkill) return;
    renderSkillDetails(currentSkill);
}

export function closeSkillDetails() {
    isOpen = false;

    document.querySelector('.center')
        ?.classList.remove('details-open');
}
