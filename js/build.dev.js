/* ==========================================================
   BUILD + SKILLBAR (DEV FILE)
   Everything in one place for now
   ========================================================== */

/* =========================
   Build code decoding
   ========================= */

/*
  Minimal GW build code decoder.
  Decodes ONLY skill IDs for UI rendering.
  Attribute points are ignored (for now).
*/

function decodeBuildCode(code) {
    if (!code || typeof code !== 'string') return null;

    // remove [ ] if present
    code = code.replace(/^\[|\]$/g, '');

    // Base64 → bitstream
    const bytes = atob(code)
        .split('')
        .map(c => c.charCodeAt(0));

    let bitPos = 0;

    function readBits(n) {
        let val = 0;
        for (let i = 0; i < n; i++) {
            const byte = bytes[Math.floor(bitPos / 8)];
            const bit = (byte >> (bitPos % 8)) & 1;
            val |= bit << i;
            bitPos++;
        }
        return val;
    }

    // header
    readBits(4);              // version
    const prof = readBits(4);
    const sec = readBits(4);

    // attributes (skip)
    const attrCount = readBits(4);
    for (let i = 0; i < attrCount; i++) {
        readBits(6); // attribute id
        readBits(4); // rank
    }

    // skills
    const skills = [];
    for (let i = 0; i < 8; i++) {
        const skillId = readBits(8);
        if (skillId !== 0) skills.push(skillId);
    }

    return {
        profession: prof,
        secondary: sec,
        skills
    };
}

/* =========================
   Skill icon (temporary)
   ========================= */

function renderSkillIcon(skill) {
    const el = document.createElement('div');
    el.className = 'skill-icon';

    el.style.backgroundImage = `url(${skill.icon})`;
    el.title = skill.name_en;

    if (skill.elite) {
        el.classList.add('elite');
    }

    el.onclick = () => {
        if (typeof openSkillDetails === 'function') {
            openSkillDetails(skill);
        }
    };

    return el;
}

/* =========================
   Build renderer (REUSABLE)
   ========================= */

function renderBuild(input) {
    let build;

    if (typeof input === 'string') {
        build = decodeBuildCode(input);
    } else if (Array.isArray(input)) {
        build = { skills: input };
    } else if (input?.skills) {
        build = input;
    } else {
        return null;
    }

    const bar = document.createElement('div');
    bar.className = 'skillbar';

    build.skills.slice(0, 8).forEach(id => {
        const skill = SkillStore.get(id);
        if (!skill) return;

        bar.appendChild(renderSkillIcon(skill));
    });

    return bar;
}

/* =========================
   TEMP DEV TEST RENDERER
   ========================= */

function devRenderBuilds() {
    const root = document.getElementById('build-test');
    if (!root) return;

    // Example build code (replace anytime)
    const exampleCode = '[OQcTE5sMKMmXAAA]';

    const fromCode = renderBuild(exampleCode);
    const fromIds  = renderBuild([1, 2, 3, 4, 5, 6, 7, 8]);

    root.appendChild(fromCode);
    root.appendChild(document.createElement('hr'));
    root.appendChild(fromIds);
}

/* =========================
   DEV STYLES (TEMP)
   ========================= */

const style = document.createElement('style');
style.textContent = `
.skillbar {
    display: flex;
    gap: 6px;
}

.skill-icon {
    width: 48px;
    height: 48px;
    background-size: cover;
    background-position: center;
    border: 1px solid #333;
    cursor: pointer;
}

.skill-icon.elite {
    box-shadow: 0 0 6px gold;
}
`;
document.head.appendChild(style);
