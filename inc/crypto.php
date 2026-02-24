<?php
// inc/crypto.php

function base32_encode_safe(string $data): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $binary = '';
    foreach (str_split($data) as $c) {
        $binary .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    }

    $chunks = str_split($binary, 5);
    $encoded = '';

    foreach ($chunks as $chunk) {
        if (strlen($chunk) < 5) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
        }
        $encoded .= $alphabet[bindec($chunk)];
    }

    return $encoded;
}

function base32_decode_safe(string $encoded): string|false
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $map = array_flip(str_split($alphabet));

    $encoded = strtoupper($encoded);
    $encoded = preg_replace('/[^A-Z2-9]/', '', $encoded); // remove dashes/spaces etc.

    $binary = '';
    $len = strlen($encoded);
    for ($i = 0; $i < $len; $i++) {
        $ch = $encoded[$i];
        if (!isset($map[$ch])) return false;
        $binary .= str_pad(decbin($map[$ch]), 5, '0', STR_PAD_LEFT);
    }

    $bytes = '';
    foreach (str_split($binary, 8) as $byte) {
        if (strlen($byte) < 8) break;
        $bytes .= chr(bindec($byte));
    }

    return $bytes;
}

function format_key(string $prefix, string $raw): string
{
    $encoded = base32_encode_safe($raw);
    return $prefix . '-' . implode('-', str_split($encoded, 4));
}

function parse_formatted_key(string $expectedPrefix, string $formatted): string|false
{
    $formatted = trim($formatted);

    // Accept: "SKL-SEC-...." or just the base32 part
    $upper = strtoupper($formatted);

    if (str_starts_with($upper, strtoupper($expectedPrefix) . '-')) {
        $upper = substr($upper, strlen($expectedPrefix) + 1);
    }

    $raw = base32_decode_safe($upper);
    return $raw;
}
