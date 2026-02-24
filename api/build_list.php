<?php
// /api/build_list.php
header('Content-Type: application/json');

require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/keys.php';

function json_fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_fail(405, 'GET required');
}

// --- Resolve current user (member gate) ---
$id = require_user_identity();
$pubRaw = $id['public_raw'] ?? null;
if (!$pubRaw || strlen($pubRaw) !== 32) json_fail(401, 'No identity');

$fpr = public_fingerprint($pubRaw);

$stmt = $db->prepare("SELECT user_id FROM users WHERE public_key_fingerprint = :fpr LIMIT 1");
$stmt->execute([':fpr' => $fpr]);
$user = $stmt->fetch();
if (!$user) json_fail(403, 'Members only');

$uid = (int)$user['user_id'];

// --- Fetch list ---
$stmt = $db->prepare("
    SELECT
        ub.user_build_id,
        ub.gw_build_id,
        ub.name,
        ub.description,
        ub.is_public,
        ub.position,
        ub.created_at,
        ub.updated_at,

        gb.primary_prof_id,
        gb.secondary_prof_id,
        gb.skill1_id, gb.skill2_id, gb.skill3_id, gb.skill4_id,
        gb.skill5_id, gb.skill6_id, gb.skill7_id, gb.skill8_id,
        gb.buildcode,

        COALESCE(a.attributes_json, JSON_OBJECT()) AS attributes_json

    FROM user_builds ub
    JOIN gw_builds gb ON gb.gw_build_id = ub.gw_build_id

    LEFT JOIN (
        SELECT
            gw_build_id,
            JSON_OBJECTAGG(attribute_id, points) AS attributes_json
        FROM gw_build_attributes
        GROUP BY gw_build_id
    ) a ON a.gw_build_id = gb.gw_build_id

    WHERE ub.owner_user_id = :uid
    ORDER BY ub.position ASC, ub.updated_at DESC
");

$stmt->execute([':uid' => $uid]);

$rows = $stmt->fetchAll();

// normalize skills array for frontend
$out = array_map(function($r) {
    return [
        'user_build_id' => (int)$r['user_build_id'],
        'gw_build_id'   => (int)$r['gw_build_id'],
        'name'          => $r['name'],
        'description'   => $r['description'],
        'is_public'     => (int)$r['is_public'],
        'position'      => (int)$r['position'],
        'created_at'    => $r['created_at'],
        'updated_at'    => $r['updated_at'],

        'primary_prof_id'   => (int)$r['primary_prof_id'],
        'secondary_prof_id' => (int)$r['secondary_prof_id'],
        'skills' => [
            $r['skill1_id'] !== null ? (int)$r['skill1_id'] : null,
            $r['skill2_id'] !== null ? (int)$r['skill2_id'] : null,
            $r['skill3_id'] !== null ? (int)$r['skill3_id'] : null,
            $r['skill4_id'] !== null ? (int)$r['skill4_id'] : null,
            $r['skill5_id'] !== null ? (int)$r['skill5_id'] : null,
            $r['skill6_id'] !== null ? (int)$r['skill6_id'] : null,
            $r['skill7_id'] !== null ? (int)$r['skill7_id'] : null,
            $r['skill8_id'] !== null ? (int)$r['skill8_id'] : null,
        ],
        'buildcode' => $r['buildcode'],
	'attributes' => json_decode($r['attributes_json'] ?? '{}', true) ?: new stdClass(),
    ];
}, $rows);

echo json_encode(['ok' => true, 'builds' => $out]);
