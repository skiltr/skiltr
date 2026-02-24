<?php
// set_name.php

require_once __DIR__ . '/inc/db.php';
require_once __DIR__ . '/inc/auth.php';
require_once __DIR__ . '/inc/keys.php';

const COOKIE_LIFETIME = 60 * 60 * 24 * 365 * 5;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    if ($name === '') $name = 'Anonymous';

    $name = mb_substr($name, 0, 32);

    // Ensure we have a stable identity (seed cookie may be created here)
    $id = require_user_identity();
    $publicRaw = $id['public_raw'];
    $fpr = public_fingerprint($publicRaw);

    // Upsert by fingerprint
    $sql = "
        INSERT INTO users (display_name, public_key_raw, public_key_fingerprint, last_seen_at)
        VALUES (:name, :pub, :fpr, NOW())
        ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            public_key_raw = VALUES(public_key_raw),
            last_seen_at = NOW(),
            updated_at = NOW()
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':name' => $name,
        ':pub'  => $publicRaw,
        ':fpr'  => $fpr,
    ]);
}

header('Location: index.php');
exit;
