<?php
// /api/build_delete.php
header('Content-Type: application/json');

require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/keys.php';

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
if (!is_array($data)) json_fail(400, 'Invalid JSON');

$userBuildId = (int)($data['user_build_id'] ?? 0);
if ($userBuildId <= 0) json_fail(400, 'user_build_id required');

// --- Resolve current user (member gate) ---
$id = require_user_identity();
$pubRaw = $id['public_raw'] ?? null;
if (!$pubRaw || strlen($pubRaw) !== 32) json_fail(401, 'No identity');

$fpr = public_fingerprint($pubRaw);

$stmt = $db->prepare("SELECT user_id FROM users WHERE public_key_fingerprint = :fpr LIMIT 1");
$stmt->execute([':fpr' => $fpr]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) json_fail(403, 'Members only');

$ownerUserId = (int)$user['user_id'];

try {
    $db->beginTransaction();

    // Ensure ownership + fetch gw_build_id for potential cleanup
    $stmt = $db->prepare("
        SELECT user_build_id, gw_build_id
        FROM user_builds
        WHERE user_build_id = :ubid AND owner_user_id = :uid
        LIMIT 1
    ");
    $stmt->execute([':ubid' => $userBuildId, ':uid' => $ownerUserId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        $db->rollBack();
        json_fail(404, 'Build not found');
    }

    $gwBuildId = (int)$row['gw_build_id'];

    // Delete the user's build (FK cascades only from gw_builds -> user_builds, not the other way)
    $stmt = $db->prepare("
        DELETE FROM user_builds
        WHERE user_build_id = :ubid AND owner_user_id = :uid
        LIMIT 1
    ");
    $stmt->execute([':ubid' => $userBuildId, ':uid' => $ownerUserId]);

    // Optional cleanup: remove gw_builds if nobody references it anymore
    $stmt = $db->prepare("SELECT COUNT(*) FROM user_builds WHERE gw_build_id = :bid");
    $stmt->execute([':bid' => $gwBuildId]);
    $cnt = (int)$stmt->fetchColumn();

    if ($cnt === 0) {
        // this will also cascade-delete gw_build_attributes
        $stmt = $db->prepare("DELETE FROM gw_builds WHERE gw_build_id = :bid LIMIT 1");
        $stmt->execute([':bid' => $gwBuildId]);
    }

    $db->commit();

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    json_fail(500, 'Database error');
}
