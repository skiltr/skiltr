let currentBarChart = null;
let currentPieChart = null;

/* ---------- BAR CHART ---------- */

export function prepareBarChartData(skills) {
    const componentColors = {
        energy: '#298aea',
        activation: '#d79716',
        recharge: '#efd05b',
        sacrifice: '#df393b',
        adrenaline: '#b76d6d',
        overcast: '#8e8e8e'
    };

    const costComponents = ['energy', 'adrenaline', 'overcast', 'sacrifice'];
    const timeComponents = ['activation', 'recharge'];

    const datasets = [];

    const allZero = k =>
        skills.every(s => !s || Number(s[k]) === 0);

    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

    costComponents.forEach(k => {
        if (!allZero(k)) {
            datasets.push({
                label: cap(k),
                data: skills.map(s => Number(s?.[k]) || 0),
                backgroundColor: componentColors[k],
                stack: 'Cost'
            });
        }
    });

    timeComponents.forEach(k => {
        if (!allZero(k)) {
            datasets.push({
                label: cap(k),
                data: skills.map(s => Number(s?.[k]) || 0),
                backgroundColor: componentColors[k],
                stack: 'Time'
            });
        }
    });

    return {
        labels: skills.map(s => s.name_en),
        datasets
    };
}

export function renderBarChart(canvas, skills) {
    if (currentBarChart) currentBarChart.destroy();

    currentBarChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: prepareBarChartData(skills),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, ticks: { display: false } },
                y: { stacked: true }
            }
        }
    });
}

/* ---------- PIE / DONUT ---------- */

export function preparePieChartData(
    skills,
    attributeMap,
    primaryProf,
    secondaryProf
) {
    const profCounts = {};
    const profOrder = [];

    // --------- FIRST PASS: professions ---------
    for (const s of skills) {
        if (!s) continue;

        const pid = Number(s.profession) || 0;

        if (!profCounts[pid]) {
            profCounts[pid] = 0;
            profOrder.push(pid);
        }
        profCounts[pid]++;
    }

    // force primary → secondary order if provided
    const orderedProfIds = [];
    if (primaryProf && profCounts[primaryProf]) orderedProfIds.push(primaryProf);
    if (secondaryProf && profCounts[secondaryProf]) orderedProfIds.push(secondaryProf);

    for (const pid of profOrder) {
        if (!orderedProfIds.includes(pid)) {
            orderedProfIds.push(pid);
        }
    }

    const professionDataset = {
        labels: orderedProfIds.map(
            id => window.UI?.PROFESSION_EN?.[id] ?? `#${id}`
        ),
        data: orderedProfIds.map(id => profCounts[id]),
        backgroundColor: orderedProfIds.map(
            id => window.UI?.PROFESSION_COLORS?.[id] ?? '#818181'
        )
    };

    // --------- SECOND PASS: attributes PER profession ---------
    const attrLabels = [];
    const attrData = [];
    const attrColors = [];

    for (const pid of orderedProfIds) {
        const attrCounts = {};

        for (const s of skills) {
            if (!s) continue;
            if (Number(s.profession) !== pid) continue;

            const aid = Number(s.attribute);
            const attrId = Number.isFinite(aid) ? aid : -1;

            attrCounts[attrId] = (attrCounts[attrId] || 0) + 1;
        }

        for (const attrId of Object.keys(attrCounts).map(Number)) {
            const name =
                window.Lookups?.attributes?.[attrId]?.name?.en ??
                window.Lookups?.attributes?.[attrId]?.name ??
                'No Attribute';

            attrLabels.push(name);
            attrData.push(attrCounts[attrId]);
            attrColors.push(
                window.UI?.ATTRIBUTE_COLORS?.[attrId] ?? '#818181'
            );
        }
    }

    const attributeDataset = {
        labels: attrLabels,
        data: attrData,
        backgroundColor: attrColors
    };

    return {
        professionDataset,
        attributeDataset
    };
}



export function renderPieChart(
    canvas,
    skills,
    attributeMap,
    primaryProf,
    secondaryProf
) {
    if (canvas._chart) {
        canvas._chart.destroy();
    }

    const { professionDataset, attributeDataset } =
        preparePieChartData(
            skills,
            attributeMap,
            primaryProf,
            secondaryProf
        );

    canvas._chart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [
                {
                    // OUTER = attributes (breakdown)
                    ...attributeDataset,
                    cutout: '40%',
                    radius: '100%',
                    borderColor: '#000',
       		    borderWidth: 1
                },
                {
                    // INNER = professions
                    ...professionDataset,
                    cutout: 0,
                    radius: '140%',
                    borderColor: '#000',
       		    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label(ctx) {
                            const value = ctx.formattedValue;

                            if (ctx.datasetIndex === 0) {
                                const attr = attributeDataset.labels[ctx.dataIndex];
                                return `${value} ${attr} ${value === '1' ? 'Skill' : 'Skills'}`;
                            } else {
                                const prof = professionDataset.labels[ctx.dataIndex];
                                return `${value} ${prof} ${value === '1' ? 'Skill' : 'Skills'}`;
                            }
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}
