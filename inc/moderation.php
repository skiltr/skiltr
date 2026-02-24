<?php

class Moderation
{
    private static array $badWords = [];
    private static bool $loaded = false;

    private static array $allowedDomains = [
        'guildwars.com',
        'wiki.guildwars.com',
        'youtube.com',
        'youtu.be'
    ];

    /* =========================================================
       PROFANITY LIST LOADER
    ========================================================= */

    private static function load(): void
    {
        if (self::$loaded) return;

        $file = __DIR__ . '/profanity_list.txt';

        if (!file_exists($file)) {
            self::$loaded = true;
            return;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            $word = trim($line);
            if ($word === '') continue;
            self::$badWords[] = mb_strtolower($word, 'UTF-8');
        }

        self::$loaded = true;
    }

    private static function normalize(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);

        $text = str_replace(
            ['0','1','3','4','5','7','@','$','!'],
            ['o','i','e','a','s','t','a','s','i'],
            $text
        );

        return $text;
    }

    public static function containsProfanity(string $text): bool
    {
        self::load();
        $normalized = self::normalize($text);

        foreach (self::$badWords as $bad) {

            $badNorm = self::normalize($bad);

            if (str_contains($badNorm, ' ')) {
                if (str_contains($normalized, $badNorm)) {
                    return true;
                }
            } else {
                if (preg_match('/\b' . preg_quote($badNorm, '/') . '\b/u', $normalized)) {
                    return true;
                }
            }
        }

        return false;
    }

    /* =========================================================
       HTML SANITIZATION
    ========================================================= */

    public static function sanitizeHtml(string $html): string
    {
        static $purifier = null;

        if ($purifier === null) {

            $config = \HTMLPurifier_Config::createDefault();

            // Allowed HTML
            $config->set('HTML.Allowed', 'p,b,i,strong,em,ul,ol,li,a[href]');

            // Disable CSS & IDs
            $config->set('CSS.AllowedProperties', []);
            $config->set('Attr.EnableID', false);

            // HTTPS only
            $config->set('URI.AllowedSchemes', [
                'https' => true
            ]);

            // Cache folder (create /skiltr/cache writable)
            $config->set(
                'Cache.SerializerPath',
                __DIR__ . '/../cache'
            );

            $purifier = new \HTMLPurifier($config);
        }

        $clean = $purifier->purify($html);

        return self::enforceUrlWhitelist($clean);
    }

    /* =========================================================
       DOMAIN WHITELIST
    ========================================================= */

    private static function enforceUrlWhitelist(string $html): string
    {
        if (trim($html) === '') return $html;

        $dom = new \DOMDocument();
        @$dom->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        $links = $dom->getElementsByTagName('a');

        foreach ($links as $a) {

            $href = $a->getAttribute('href');
            $parts = parse_url($href);

            if (!$parts || ($parts['scheme'] ?? '') !== 'https') {
                $a->parentNode->removeChild($a);
                continue;
            }

            $host = strtolower($parts['host'] ?? '');
            $allowed = false;

            foreach (self::$allowedDomains as $domain) {
                if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                    $allowed = true;
                    break;
                }
            }

            if (!$allowed) {
                $a->parentNode->removeChild($a);
                continue;
            }

            // Security attributes
            $a->setAttribute('rel', 'noopener noreferrer');
            $a->setAttribute('target', '_blank');
        }

        return $dom->saveHTML();
    }
}
