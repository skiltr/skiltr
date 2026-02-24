<?php
// /api/build_save.php

header('Content-Type: application/json');

require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/keys.php';

require_once __DIR__ . '/../composer/vendor/autoload.php';
require_once __DIR__ . '/../inc/moderation.php';

function json_fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_fail(405, 'POST required');
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    json_fail(400, 'Invalid JSON');
}

// --- Resolve current user (member gate = must exist in users table) ---
$id = require_user_identity();
$pubRaw = $id['public_raw'] ?? null;
if (!$pubRaw || strlen($pubRaw) !== 32) {
    json_fail(401, 'No identity');
}

$fpr = public_fingerprint($pubRaw);

$stmt = $db->prepare("SELECT user_id FROM users WHERE public_key_fingerprint = :fpr LIMIT 1");
$stmt->execute([':fpr' => $fpr]);
$user = $stmt->fetch();

if (!$user) {
    // Member-only: if no users row, saving is not allowed
    json_fail(403, 'Members only (set a name first)');
}

$ownerUserId = (int)$user['user_id'];

// --- Validate payload ---
$primary = (int)($data['primary_prof_id'] ?? 0);
$secondary = (int)($data['secondary_prof_id'] ?? 0);

$skills = $data['skills'] ?? [];
if (!is_array($skills)) json_fail(400, 'skills must be an array');

$skills = array_slice($skills, 0, 8);
while (count($skills) < 8) $skills[] = null;

// normalize skill ids
$skillsNorm = [];
for ($i = 0; $i < 8; $i++) {
    $v = $skills[$i];
    if ($v === null || $v === '' || $v === 0 || $v === '0') {
        $skillsNorm[$i] = null;
        continue;
    }
    if (!is_numeric($v)) json_fail(400, "Invalid skill id at slot " . ($i+1));
    $sid = (int)$v;
    if ($sid <= 0) $skillsNorm[$i] = null;
    else $skillsNorm[$i] = $sid;
}

$attributes = $data['attributes'] ?? [];
if (!is_array($attributes)) json_fail(400, 'attributes must be an object/map');

$name = trim((string)($data['name'] ?? 'Unnamed Build'));
$name = mb_substr($name === '' ? 'Unnamed Build' : $name, 0, 80);

$description = (string)($data['description'] ?? '');
$isPublic = (int)!!($data['is_public'] ?? 0);
$position = (int)($data['position'] ?? 0);

// ---------------- MODERATION ----------------

if (Moderation::containsProfanity($name)) {
    json_fail(400, 'Inappropriate content');
}

if (Moderation::containsProfanity($description)) {
    json_fail(400, 'Inappropriate content');
}

$description = Moderation::sanitizeHtml($description);


// --- Insert gw_builds + attributes + user_builds ---
try {
    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO gw_builds (
            primary_prof_id, secondary_prof_id,
            skill1_id, skill2_id, skill3_id, skill4_id,
            skill5_id, skill6_id, skill7_id, skill8_id,
            buildcode
        ) VALUES (
            :p, :s,
            :s1, :s2, :s3, :s4, :s5, :s6, :s7, :s8,
            NULL
        )
    ");

    $stmt->execute([
        ':p'  => $primary,
        ':s'  => $secondary,
        ':s1' => $skillsNorm[0],
        ':s2' => $skillsNorm[1],
        ':s3' => $skillsNorm[2],
        ':s4' => $skillsNorm[3],
        ':s5' => $skillsNorm[4],
        ':s6' => $skillsNorm[5],
        ':s7' => $skillsNorm[6],
        ':s8' => $skillsNorm[7],
    ]);

    $gwBuildId = (int)$db->lastInsertId();

    // Attributes: only store >=0 ids with points > 0
    if (!empty($attributes)) {
        $insAttr = $db->prepare("
            INSERT INTO gw_build_attributes (gw_build_id, attribute_id, points)
            VALUES (:bid, :aid, :pts)
        ");

        foreach ($attributes as $aid => $pts) {
            if (!is_numeric($aid) || !is_numeric($pts)) continue;
            $aid = (int)$aid;
            $pts = (int)$pts;

            if ($aid < 0) continue;      // do not store your negative pseudo-attributes
            if ($pts <= 0) continue;
            if ($pts > 15) $pts = 15;    // safety clamp

            $insAttr->execute([
                ':bid' => $gwBuildId,
                ':aid' => $aid,
                ':pts' => $pts
            ]);
        }
    }

    $stmt = $db->prepare("
        INSERT INTO user_builds (
            owner_user_id, gw_build_id,
            name, description, is_public, position
        ) VALUES (
            :uid, :bid,
            :name, :desc, :pub, :pos
        )
    ");

    $stmt->execute([
        ':uid'  => $ownerUserId,
        ':bid'  => $gwBuildId,
        ':name' => $name,
        ':desc' => $description,
        ':pub'  => $isPublic,
        ':pos'  => $position
    ]);

    $userBuildId = (int)$db->lastInsertId();

    $db->commit();

    echo json_encode([
        'ok' => true,
        'user_build_id' => $userBuildId,
        'gw_build_id' => $gwBuildId,
        'buildcode' => null
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    json_fail(500, 'Database error');
}
exit;