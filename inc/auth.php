<?php
// inc/auth.php

require_once __DIR__ . '/keys.php';

const COOKIE_SEED = 'skilter_private_seed';
const COOKIE_NAME = 'skilter_user_name';
const COOKIE_LIFETIME = 60 * 60 * 24 * 365 * 5;

function require_user_identity(): array
{
    if (!isset($_COOKIE[COOKIE_SEED])) {
        return create_identity();
    }

    $seed = base64_decode($_COOKIE[COOKIE_SEED], true);
    if ($seed === false || strlen($seed) !== SODIUM_CRYPTO_SIGN_SEEDBYTES) {
        return create_identity();
    }

    return build_identity_from_seed($seed);
}

function create_identity(): array
{
    $seed = generate_private_seed();

    setcookie(
        COOKIE_SEED,
        base64_encode($seed),
        [
            'expires'  => time() + COOKIE_LIFETIME,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]
    );

    if (!isset($_COOKIE[COOKIE_NAME])) {
        setcookie(
            COOKIE_NAME,
            'Anonymous',
            [
                'expires'  => time() + COOKIE_LIFETIME,
                'path'     => '/',
                'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                'httponly' => false,
                'samesite' => 'Lax'
            ]
        );
    }

    return build_identity_from_seed($seed);
}

function build_identity_from_seed(string $seed): array
{
    $keys = derive_keypair($seed);

    return [
        'name'       => $_COOKIE[COOKIE_NAME] ?? 'Anonymous',

        'secret'     => $keys['secret'],
        'public'     => $keys['public'],

        'seed_raw'   => $keys['seed_raw'],
        'secret_raw' => $keys['secret_raw'],
        'public_raw' => $keys['public_raw'],
    ];
}

