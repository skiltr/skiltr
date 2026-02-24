<?php
// restore.php

require_once __DIR__ . '/inc/db.php';
require_once __DIR__ . '/inc/keys.php';
require_once __DIR__ . '/inc/auth.php';

const COOKIE_LIFETIME = 60 * 60 * 24 * 365 * 5;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

$secret = trim($_POST['secret'] ?? '');
if ($secret === '') {
    header('Location: index.php?restore=empty');
    exit;
}

$seed = seed_from_formatted_secret($secret);
if ($seed === false) {
    header('Location: index.php?restore=invalid');
    exit;
}

$keys = derive_keypair($seed);
$fpr  = public_fingerprint($keys['public_raw']);

// If user exists, take DB display_name; else keep current cookie name / Anonymous
$stmt = $db->prepare("SELECT display_name FROM users WHERE public_key_fingerprint = :fpr LIMIT 1");
$stmt->execute([':fpr' => $fpr]);
$row = $stmt->fetch();

$name = $row['display_name'] ?? 'Anonymous';

// Set seed cookie (HttpOnly)
setcookie(
    COOKIE_SEED,
    base64_encode($seed),
    [
        'expires'  => time() + COOKIE_LIFETIME,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]
);

header('Location: index.php?restore=ok');
exit;
