<?php
// inc/keys.php

require_once __DIR__ . '/crypto.php';

function generate_private_seed(): string
{
    return random_bytes(SODIUM_CRYPTO_SIGN_SEEDBYTES); // 32 bytes
}

function derive_keypair(string $seed): array
{
    $keypair = sodium_crypto_sign_seed_keypair($seed);

    $secretRaw = sodium_crypto_sign_secretkey($keypair);
    $publicRaw = sodium_crypto_sign_publickey($keypair);

    return [
        'seed_raw'   => $seed,
        'secret_raw' => $secretRaw,
        'public_raw' => $publicRaw,

        // Human-readable
        'secret' => format_key('SKL-SEC', $seed),
        'public' => format_key('SKL-PUB', $publicRaw),
    ];
}


function seed_from_formatted_secret(string $secretFormatted): string|false
{
    $seed = parse_formatted_key('SKL-SEC', $secretFormatted);
    if ($seed === false) return false;

    if (strlen($seed) !== SODIUM_CRYPTO_SIGN_SEEDBYTES) {
        return false;
    }

    return $seed;
}

function public_fingerprint(string $public_raw): string
{
    // 32-byte binary sha256
    return hash('sha256', $public_raw, true);
}