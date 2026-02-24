<?php

$professions = ["None", "Warrior", "Ranger", "Monk", "Necromancer", "Mesmer", "Elementalist", "Assassin", "Ritualist", "Paragon", "Dervish"];

$professions_i18n = [
    'de' => [
        0 => "Keine Klasse",
        1 => "Krieger",
        2 => "Waldläufer",
        3 => "Mönch",
        4 => "Nekromant",
        5 => "Mesmer",
        6 => "Elementarmagier",
        7 => "Assassine",
        8 => "Ritualist",
        9 => "Paragon",
        10 => "Derwisch"
    ]
];


$campaigns = ["None", "Prophecies", "Factions", "Nightfall", "Eye of the North"];

$attributes = [

    0 => [
        'id' => 0,
        'prof_id' => 5,
        'faicon' => 'fa-solid fa-star',
        'name' => [
            'en' => 'Fast Casting',
            'de' => 'Schnellwirkung'
        ],
        'type' => 'Primary',
        'profession' => 'Mesmer',
        'inherentEffect' => [
            'en' => 'Decreases the activation time of your Spells and Signets. (No effect for non-Mesmer skills with an activation time less than 2 seconds.) In PvE, each rank of Fast Casting decreases the recharge time for your Mesmer Spells by 3%.',
            'de' => 'Verringert die Aktivierungszeit deiner Zauber und Siegel. (Kein Effekt für Nicht-Mesmer-Fertigkeiten mit einer Aktivierungszeit unter 2 Sekunden.) Im PvE verringert jeder Rang Schnellwirkung die Wiederaufladezeit deiner Mesmer-Zauber um 3%.'
        ]
    ],

    1 => [
        'id' => 1,
        'prof_id' => 5,
        'name' => ['en' => 'Illusion Magic', 'de' => 'Illusionsmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Mesmer',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    2 => [
        'id' => 2,
        'prof_id' => 5,
        'name' => ['en' => 'Domination Magic', 'de' => 'Beherrschungsmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Mesmer',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    3 => [
        'id' => 3,
        'prof_id' => 5,
        'name' => ['en' => 'Inspiration Magic', 'de' => 'Inspirationsmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Mesmer',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    4 => [
        'id' => 4,
        'prof_id' => 4,
        'name' => ['en' => 'Blood Magic', 'de' => 'Blutmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Necromancer',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    5 => [
        'id' => 5,
        'prof_id' => 4,
        'name' => ['en' => 'Death Magic', 'de' => 'Todesmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Necromancer',
        'inherentEffect' => [
            'en' => 'Without Death Magic, you can control no more than two undead servants. For every two ranks of Death Magic, you can control one additional undead servant.',
            'de' => 'Ohne Todesmagie kannst du nicht mehr als zwei untote Diener kontrollieren. Für jeweils zwei Ränge Todesmagie kannst du einen zusätzlichen untoten Diener kontrollieren.'
        ]
    ],

    6 => [
        'id' => 6,
        'prof_id' => 4,
        'name' => ['en' => 'Soul Reaping', 'de' => 'Seelensammlung'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Necromancer',
        'inherentEffect' => [
            'en' => 'Gain 1 energy per rank whenever a non-spirit creature dies within range, triggering up to 3 times per 15 seconds.',
            'de' => 'Erhalte pro Rang 1 Energie, wenn eine nicht-geistige Kreatur in Reichweite stirbt, bis zu 3-mal alle 15 Sekunden.'
        ]
    ],

    7 => [
        'id' => 7,
        'prof_id' => 4,
        'name' => ['en' => 'Curses', 'de' => 'Flüche'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Necromancer',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    8 => [
        'id' => 8,
        'prof_id' => 6,
        'name' => ['en' => 'Air Magic', 'de' => 'Luftmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Elementalist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    9 => [
        'id' => 9,
        'prof_id' => 6,
        'name' => ['en' => 'Earth Magic', 'de' => 'Erdmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Elementalist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    10 => [
        'id' => 10,
        'prof_id' => 6,
        'name' => ['en' => 'Fire Magic', 'de' => 'Feuermagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Elementalist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    11 => [
        'id' => 11,
        'prof_id' => 6,
        'name' => ['en' => 'Water Magic', 'de' => 'Wassermagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Elementalist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    12 => [
        'id' => 12,
        'prof_id' => 6,
        'name' => ['en' => 'Energy Storage', 'de' => 'Energiespeicherung'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Elementalist',
        'inherentEffect' => [
            'en' => 'Increases maximum energy by 3 per rank.',
            'de' => 'Erhöht die maximale Energie um 3 pro Rang.'
        ]
    ],

    13 => [
        'id' => 13,
        'prof_id' => 3,
        'name' => ['en' => 'Healing Prayers', 'de' => 'Heilgebete'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Monk',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    14 => [
        'id' => 14,
        'prof_id' => 3,
        'name' => ['en' => 'Smiting Prayers', 'de' => 'Peinigungsgebete'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Monk',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    15 => [
        'id' => 15,
        'prof_id' => 3,
        'name' => ['en' => 'Protection Prayers', 'de' => 'Schutzgebete'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Monk',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    16 => [
        'id' => 16,
        'prof_id' => 3,
        'name' => ['en' => 'Divine Favor', 'de' => 'Gunst der Götter'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Monk',
        'inherentEffect' => [
            'en' => 'Monk spells that target an ally heal the primary target for an additional 3.2 health per rank, rounded down.',
            'de' => 'Mönchszauber, die einen Verbündeten als Ziel haben, heilen das Primärziel um zusätzliche 3,2 Lebenspunkte pro Rang (abgerundet).'
        ]
    ],

    17 => [
        'id' => 17,
        'prof_id' => 1,
        'name' => ['en' => 'Strength', 'de' => 'Stärke'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Warrior',
        'inherentEffect' => [
            'en' => 'When you use attack skills, each point of Strength gives you 1% armor penetration.',
            'de' => 'Bei der Verwendung von Angriffsfertigkeiten verleiht dir jeder Rang Stärke 1 % Rüstungsdurchdringung.'
        ]
    ],

    18 => [
        'id' => 18,
        'prof_id' => 1,
        'name' => ['en' => 'Axe Mastery', 'de' => 'Axtbeherrschung'],
        'faicon' => 'fa-sharp fa-regular fa-axe-battle',
        'type' => 'Secondary',
        'profession' => 'Warrior',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with axes and your chance to inflict a critical hit when using an axe.',
            'de' => 'Erhöht den Schaden mit Äxten und die Chance auf kritische Treffer.'
        ]
    ],

    19 => [
        'id' => 19,
        'prof_id' => 1,
        'name' => ['en' => 'Hammer Mastery', 'de' => 'Hammerbeherrschung'],
        'faicon' => 'fa-sharp fa-regular fa-hammer-war',
        'type' => 'Secondary',
        'profession' => 'Warrior',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with hammers and your chance to inflict a critical hit when using a hammer.',
            'de' => 'Erhöht den Schaden mit Hämmern und die Chance auf kritische Treffer.'
        ]
    ],

    20 => [
        'id' => 20,
        'prof_id' => 1,
        'name' => ['en' => 'Swordsmanship', 'de' => 'Schwertkunst'],
        'faicon' => 'fa-sharp fa-regular fa-sword',
        'type' => 'Secondary',
        'profession' => 'Warrior',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with swords and your chance to inflict a critical hit when using a sword.',
            'de' => 'Erhöht den Schaden mit Schwertern und die Chance auf kritische Treffer.'
        ]
    ],

    21 => [
        'id' => 21,
        'prof_id' => 1,
        'name' => ['en' => 'Tactics', 'de' => 'Taktik'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Warrior',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    22 => [
        'id' => 22,
        'prof_id' => 2,
        'name' => ['en' => 'Beast Mastery', 'de' => 'Tierbeherrschung'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Ranger',
        'inherentEffect' => [
            'en' => 'Increases the damage dealt by your animal companion and its chance to inflict a critical hit.',
            'de' => 'Erhöht den Schaden deines Tiergefährten und dessen Chance auf kritische Treffer.'
        ]
    ],

    23 => [
        'id' => 23,
        'prof_id' => 2,
        'name' => ['en' => 'Expertise', 'de' => 'Fachkenntnis'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Ranger',
        'inherentEffect' => [
            'en' => 'Reduces energy cost of attack skills, rituals, touch skills and all Ranger skills by 4% per rank.',
            'de' => 'Verringert die Energiekosten von Angriffsfertigkeiten, Ritualen, Berührungsfertigkeiten und allen Waldläuferfertigkeiten um 4 % pro Rang.'
        ]
    ],

    24 => [
        'id' => 24,
        'prof_id' => 2,
        'name' => ['en' => 'Wilderness Survival', 'de' => 'Überleben in der Wildnis'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Ranger',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    25 => [
        'id' => 25,
        'prof_id' => 2,
        'name' => ['en' => 'Marksmanship', 'de' => 'Treffsicherheit'],
        'faicon' => 'fa-sharp fa-regular fa-bow-arrow',
        'type' => 'Secondary',
        'profession' => 'Ranger',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with bows and your chance to inflict a critical hit when using a bow.',
            'de' => 'Erhöht den Schaden mit Bögen und die Chance auf kritische Treffer.'
        ]
    ],

    29 => [
        'id' => 29,
        'prof_id' => 7,
        'name' => ['en' => 'Dagger Mastery', 'de' => 'Dolchbeherrschung'],
        'faicon' => 'fa-sharp fa-regular fa-dagger',
        'type' => 'Secondary',
        'profession' => 'Assassin',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with daggers and your chance to inflict a critical hit. 2% chance per rank to double strike.',
            'de' => 'Erhöht den Schaden mit Dolchen und die Chance auf kritische Treffer. 2 % Chance pro Rang auf Doppelschlag.'
        ]
    ],

    30 => [
        'id' => 30,
        'prof_id' => 7,
        'name' => ['en' => 'Deadly Arts', 'de' => 'Tödliche Künste'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Assassin',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    31 => [
        'id' => 31,
        'prof_id' => 7,
        'name' => ['en' => 'Shadow Arts', 'de' => 'Schattenkünste'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Assassin',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    35 => [
        'id' => 35,
        'prof_id' => 7,
        'name' => ['en' => 'Critical Strikes', 'de' => 'Kritische Stöße'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Assassin',
        'inherentEffect' => [
            'en' => 'Increases critical hit rate by 1% per rank. Energy gain on critical hits.',
            'de' => 'Erhöht die Chance auf kritische Treffer um 1 % pro Rang. Energiegewinn bei kritischen Treffern.'
        ]
    ],

    36 => [
        'id' => 36,
        'prof_id' => 8,
        'name' => ['en' => 'Spawning Power', 'de' => 'Macht des Herbeirufens'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Ritualist',
        'inherentEffect' => [
            'en' => 'Increases the health of creatures you create and the duration of weapon spells by 4% per rank.',
            'de' => 'Erhöht die Lebenspunkte beschworener Kreaturen und die Dauer von Waffenzaubern um 4 % pro Rang.'
        ]
    ],

    32 => [
        'id' => 32,
        'prof_id' => 8,
        'name' => ['en' => 'Communing', 'de' => 'Zwiesprache'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Ritualist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    33 => [
        'id' => 33,
        'prof_id' => 8,
        'name' => ['en' => 'Restoration Magic', 'de' => 'Wiederherstellungsmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Ritualist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    34 => [
        'id' => 34,
        'prof_id' => 8,
        'name' => ['en' => 'Channeling Magic', 'de' => 'Kanalisierungsmagie'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Ritualist',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    40 => [
        'id' => 40,
        'prof_id' => 9,
        'name' => ['en' => 'Leadership', 'de' => 'Führung'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Paragon',
        'inherentEffect' => [
            'en' => 'Gain energy for each ally affected by your shouts and chants.',
            'de' => 'Erhalte Energie für jeden Verbündeten, der von deinen Rufen und Gesängen betroffen ist.'
        ]
    ],

    38 => [
        'id' => 38,
        'prof_id' => 9,
        'name' => ['en' => 'Command', 'de' => 'Befehlsgewalt'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Paragon',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    39 => [
        'id' => 39,
        'prof_id' => 9,
        'name' => ['en' => 'Motivation', 'de' => 'Motivation'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Paragon',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    37 => [
        'id' => 37,
        'prof_id' => 9,
        'name' => ['en' => 'Spear Mastery', 'de' => 'Speerbeherrschung'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Paragon',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with spears and your chance to inflict a critical hit.',
            'de' => 'Erhöht den Schaden mit Speeren und die Chance auf kritische Treffer.'
        ]
    ],

    44 => [
        'id' => 44,
        'prof_id' => 10,
        'name' => ['en' => 'Mysticism', 'de' => 'Mystik'],
        'faicon' => 'fa-solid fa-star',
        'type' => 'Primary',
        'profession' => 'Dervish',
        'inherentEffect' => [
            'en' => 'Reduces the cost of enchantments and grants armor while enchanted.',
            'de' => 'Verringert die Kosten von Verzauberungen und verleiht Rüstung, solange du verzaubert bist.'
        ]
    ],

    41 => [
        'id' => 41,
        'prof_id' => 10,
        'name' => ['en' => 'Scythe Mastery', 'de' => 'Sensenbeherrschung'],
        'faicon' => 'fa-sharp fa-regular fa-scythe',
        'type' => 'Secondary',
        'profession' => 'Dervish',
        'inherentEffect' => [
            'en' => 'Increases the damage you do with scythes and your chance to inflict a critical hit.',
            'de' => 'Erhöht den Schaden mit Sensen und die Chance auf kritische Treffer.'
        ]
    ],

    42 => [
        'id' => 42,
        'prof_id' => 10,
        'name' => ['en' => 'Wind Prayers', 'de' => 'Windgebete'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Dervish',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],

    43 => [
        'id' => 43,
        'prof_id' => 10,
        'name' => ['en' => 'Earth Prayers', 'de' => 'Erdgebete'],
        'faicon' => null,
        'type' => 'Secondary',
        'profession' => 'Dervish',
        'inherentEffect' => ['en' => '', 'de' => '']
    ],


    -1 => [
        'id' => -1,
        'prof_id' => 0,
        'name' => ['en' => 'No Attribute', 'de' => 'Kein Attribut'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Any-tango-icon-20.png'
    ],

    -5 => [
        'id' => -5,
        'prof_id' => 0,
        'name' => ['en' => 'Kurzick Skills', 'de' => 'Kurzick-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Kurzick.png'
    ],

    -4 => [
        'id' => -4,
        'prof_id' => 0,
        'name' => ['en' => 'Luxon Skills', 'de' => 'Luxon-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Luxon.png'
    ],

    -3 => [
        'id' => -3,
        'prof_id' => 0,
        'name' => ['en' => 'Lightbringer Skills', 'de' => 'Lichtbringer-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Lightbringer.png'
    ],

    -2 => [
        'id' => -2,
        'prof_id' => 0,
        'name' => ['en' => 'Sunspear Skills', 'de' => 'Sonnen­speer-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Sunspear-logo-48.png'
    ],

    -6 => [
        'id' => -6,
        'prof_id' => 0,
        'name' => ['en' => 'Asuran Skills', 'de' => 'Asura-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Asuran-logo-48.png'
    ],

    -7 => [
        'id' => -7,
        'prof_id' => 0,
        'name' => ['en' => 'Deldrimor Skills', 'de' => 'Deldrimor-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Deldrimor-logo-48.png'
    ],

    -8 => [
        'id' => -8,
        'prof_id' => 0,
        'name' => ['en' => 'Ebon Vanguard Skills', 'de' => 'Ebon-Vorhut-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'ebon_vanguard.png'
    ],

    -9 => [
        'id' => -9,
        'prof_id' => 0,
        'name' => ['en' => 'Norn Skills', 'de' => 'Norn-Fertigkeiten'],
        'faicon' => null,
        'type' => 'other',
        'profession' => 'none',
        'inherentEffect' => ['en' => '', 'de' => ''],
        'icon' => 'Norn-logo-48.png'
    ],
];



$skillTypes = [

    0 => [
        'id' => 0,
        'name' => ['en' => 'Skill (untyped)', 'de' => 'Fertigkeit (ohne Typ)'],
        'parent' => null
    ],

    // Attacks
    1 => [
        'id' => 1,
        'name' => ['en' => 'Skill', 'de' => 'Fertigkeit'],
        'parent' => 0
    ],

    3 => [
        'id' => 3,
        'name' => ['en' => 'Melee attack', 'de' => 'Nahkampfangriff'],
        'parent' => 36
    ],
        11 => [
            'id' => 11,
            'name' => ['en' => 'Pet attack', 'de' => 'Tierangriff'],
            'parent' => 3
        ],
        4 => [
            'id' => 4,
            'name' => ['en' => 'Axe attack', 'de' => 'Axtangriff'],
            'parent' => 3
        ],
        5 => [
            'id' => 5,
            'name' => ['en' => 'Lead attack', 'de' => 'Leithandangriff'],
            'parent' => 34,
	    'icon' => 'Lead_Attack'
        ],
            6 => [
                'id' => 6,
                'name' => ['en' => 'Off-hand attack', 'de' => 'Nebenhandangriff'],
                'parent' => 34,
	        'icon' => 'Off-Hand_Attack'
            ],
            7 => [
                'id' => 7,
                'name' => ['en' => 'Dual attack', 'de' => 'Doppelangriff'],
                'parent' => 34,
	        'icon' => 'Dual_Attack'
            ],
        8 => [
            'id' => 8,
            'name' => ['en' => 'Hammer attack', 'de' => 'Hammerangriff'],
            'parent' => 3
        ],
        9 => [
            'id' => 9,
            'name' => ['en' => 'Scythe attack', 'de' => 'Sensenangriff'],
            'parent' => 3
        ],
        10 => [
            'id' => 10,
            'name' => ['en' => 'Sword attack', 'de' => 'Schwertangriff'],
            'parent' => 3
        ],

    31 => [
        'id' => 31,
        'name' => ['en' => 'Ranged attack', 'de' => 'Fernkampfangriff'],
        'parent' => 36
    ],
        2 => [
            'id' => 2,
            'name' => ['en' => 'Bow attack', 'de' => 'Bogenangriff'],
            'parent' => 31
        ],
        12 => [
            'id' => 12,
            'name' => ['en' => 'Spear attack', 'de' => 'Speerangriff'],
            'parent' => 31
        ],

    // Other core types
    13 => [
        'id' => 13,
        'name' => ['en' => 'Chant', 'de' => 'Gesang'],
        'parent' => 1
    ],
    14 => [
        'id' => 14,
        'name' => ['en' => 'Echo', 'de' => 'Echo'],
        'parent' => 1
    ],
    15 => [
        'id' => 15,
        'name' => ['en' => 'Form', 'de' => 'Form'],
        'parent' => 1
    ],
    16 => [
        'id' => 16,
        'name' => ['en' => 'Glyph', 'de' => 'Glyphe'],
        'parent' => 1
    ],
    17 => [
        'id' => 17,
        'name' => ['en' => 'Preparation', 'de' => 'Vorbereitung'],
        'parent' => 1
    ],

    // Rituals
    18 => [
        'id' => 18,
        'name' => ['en' => 'Binding ritual', 'de' => 'Binderitual'],
        'parent' => 35
    ],
    19 => [
        'id' => 19,
        'name' => ['en' => 'Nature ritual', 'de' => 'Naturritual'],
        'parent' => 35
    ],
    32 => [
        'id' => 32,
        'name' => ['en' => 'Ebon Vanguard ritual', 'de' => 'Ebon-Vorhut-Ritual'],
        'parent' => 35
    ],

    // Vocal
    20 => [
        'id' => 20,
        'name' => ['en' => 'Shout', 'de' => 'Schrei'],
        'parent' => 1
    ],
    21 => [
        'id' => 21,
        'name' => ['en' => 'Signet', 'de' => 'Siegel'],
        'parent' => 1
    ],

    // Spells
    22 => [
        'id' => 22,
        'name' => ['en' => 'Spell', 'de' => 'Zauber'],
        'parent' => 1
    ],
        23 => [
            'id' => 23,
            'name' => ['en' => 'Enchantment spell', 'de' => 'Verzauberung'],
            'parent' => 22,
	    'icon' => 'enchantement'
        ],
            33 => [
                'id' => 33,
                'name' => ['en' => 'Flash enchantment spell', 'de' => 'Blitz-Verzauberung'],
                'parent' => 23,
	        'icon' => 'enchantement'
            ],
        24 => [
            'id' => 24,
            'name' => ['en' => 'Hex spell', 'de' => 'Verhexung'],
            'parent' => 22,
	    'icon' => 'hex'
        ],
        25 => [
            'id' => 25,
            'name' => ['en' => 'Item spell', 'de' => 'Gegenstandszauber'],
            'parent' => 22
        ],
        26 => [
            'id' => 26,
            'name' => ['en' => 'Ward spell', 'de' => 'Schutzzauber'],
            'parent' => 22
        ],
        27 => [
            'id' => 27,
            'name' => ['en' => 'Weapon spell', 'de' => 'Waffenzauber'],
            'parent' => 22,
	    'icon' => 'Weapon_spell'
        ],
        28 => [
            'id' => 28,
            'name' => ['en' => 'Well spell', 'de' => 'Brunnenzauber'],
            'parent' => 22
        ],

    // Other
    29 => [
        'id' => 29,
        'name' => ['en' => 'Stance', 'de' => 'Haltung'],
        'parent' => 1
    ],
    30 => [
        'id' => 30,
        'name' => ['en' => 'Trap', 'de' => 'Falle'],
        'parent' => 1
    ],
    34 => [
        'id' => 34,
        'name' => ['en' => 'Dagger Attack', 'de' => 'Dolchangriff'],
        'parent' => 3
    ],
    35 => [
        'id' => 35,
        'name' => ['en' => 'Ritual', 'de' => 'Ritual'],
        'parent' => 1
    ],
    36 => [
        'id' => 36,
        'name' => ['en' => 'Attack', 'de' => 'Angriff'],
        'parent' => 1
    ],
];

$conditions = [

    1 => [
        'id' => 1,
        'name' => [
            'en' => 'Bleeding',
            'de' => 'Blutung'
        ],
        'description' => [
            'en' => 'Lose Health over time.',
            'de' => 'Verliert im Laufe der Zeit Lebenspunkte.'
        ]
    ],

    2 => [
        'id' => 2,
        'name' => [
            'en' => 'Blind',
            'de' => 'Blindheit'
        ],
        'description' => [
            'en' => 'Melee and missile attacks have a 90% chance to miss. Projectiles may stray.',
            'de' => 'Nah- und Fernkampfangriffe verfehlen mit 90% Wahrscheinlichkeit. Geschosse können abweichen.'
        ]
    ],

    3 => [
        'id' => 3,
        'name' => [
            'en' => 'Burning',
            'de' => 'Brennen'
        ],
        'description' => [
            'en' => 'Lose Health over time.',
            'de' => 'Verliert im Laufe der Zeit Lebenspunkte.'
        ]
    ],

    4 => [
        'id' => 4,
        'name' => [
            'en' => 'Cracked Armor',
            'de' => 'Beschädigte Rüstung'
        ],
        'description' => [
            'en' => '-20 armor (minimum 60).',
            'de' => '-20 Rüstung (Minimum 60).'
        ]
    ],

    5 => [
        'id' => 5,
        'name' => [
            'en' => 'Crippled',
            'de' => 'Verkrüppelt'
        ],
        'description' => [
            'en' => 'Move 50% slower.',
            'de' => 'Bewegt sich 50% langsamer.'
        ]
    ],

    6 => [
        'id' => 6,
        'name' => [
            'en' => 'Dazed',
            'de' => 'Benommen'
        ],
        'description' => [
            'en' => 'Spells take twice as long to cast and are easily interrupted.',
            'de' => 'Zauber benötigen doppelt so lange zum Wirken und werden leicht unterbrochen.'
        ]
    ],

    7 => [
        'id' => 7,
        'name' => [
            'en' => 'Deep Wound',
            'de' => 'Tiefe Wunde'
        ],
        'description' => [
            'en' => 'Maximum Health reduced by 20% and healing is less effective.',
            'de' => 'Maximale Lebenspunkte um 20% reduziert und Heilung ist weniger effektiv.'
        ]
    ],

    8 => [
        'id' => 8,
        'name' => [
            'en' => 'Disease',
            'de' => 'Krankheit'
        ],
        'description' => [
            'en' => 'Lose Health over time. Disease spreads between creatures of the same kind.',
            'de' => 'Verliert im Laufe der Zeit Lebenspunkte. Krankheit breitet sich zwischen gleichen Kreaturen aus.'
        ]
    ],

    9 => [
        'id' => 9,
        'name' => [
            'en' => 'Poison',
            'de' => 'Vergiftung'
        ],
        'description' => [
            'en' => 'Lose Health over time.',
            'de' => 'Verliert im Laufe der Zeit Lebenspunkte.'
        ]
    ],

    10 => [
        'id' => 10,
        'name' => [
            'en' => 'Weakness',
            'de' => 'Schwäche'
        ],
        'description' => [
            'en' => 'Deal 66% damage with attacks and all attributes are reduced by 1.',
            'de' => 'Verursacht mit Angriffen nur 66% Schaden und alle Attribute sind um 1 reduziert.'
        ]
    ],

];

$interactionTypes = [

    // ── Condition application & existence ──
    1  => 'cause',
    2  => 'mimic',

    // ── Condition dependency / benefit ──
    3  => 'benefit_from',
    4  => 'dependent_on',

    // ── Condition prevention & removal ──
    5  => 'prevent',
    6  => 'remove_specific',
    7  => 'remove_multiple',   // was "remove two or more"
    8  => 'remove_any',
    9  => 'remove',
    10 => 'remove_all',
    11 => 'transfer',

    // ── Armor (non-condition domain) ──
    20 => 'armor_reduce',
    21 => 'armor_affect',
    22 => 'armor_increase',
    23 => 'armor_decrease',

    // ── Generic / fallback ──
    30 => 'interact'
];


