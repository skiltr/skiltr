<?php
// /api/lookups.php

require_once __DIR__ . '/../inc/gw_lookups.php';

$lang = $_GET['lang'] ?? 'en';
$lang = in_array($lang, ['en','de'], true) ? $lang : 'en';

function apply_i18n_structure($data, string $lang, string $fallback = 'en') {
    // scalar → return as-is
    if (!is_array($data)) {
        return $data;
    }

    // language leaf → collapse
    if (isset($data[$lang])) {
        return $data[$lang];
    }

    if ($lang !== $fallback && isset($data[$fallback])) {
        return $data[$fallback];
    }

    // recurse
    $out = [];

    foreach ($data as $key => $value) {
        $out[$key] = apply_i18n_structure($value, $lang, $fallback);
    }

    return $out;
}

function apply_i18n(array $base, array $i18n, string $lang): array {
    if ($lang === 'en' || empty($i18n[$lang])) {
        return array_values($base);
    }

    $out = [];

    foreach ($base as $id => $value) {
        $out[$id] = $i18n[$lang][$id] ?? $value;
    }

    return $out;
}

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'lang'        => $lang,
    'professions' => apply_i18n($professions, $professions_i18n ?? [], $lang),
    'campaigns'   => apply_i18n($campaigns,   $campaigns_i18n   ?? [], $lang),
    'attributes'  => apply_i18n_structure($attributes, $lang),
    'skillTypes'  => apply_i18n_structure($skillTypes, $lang),
    'conditions'  => apply_i18n_structure($conditions, $lang),
    'interactionTypes' => apply_i18n($interactionTypes, $interactionTypes_i18n ?? [], $lang),
], JSON_UNESCAPED_UNICODE);
