<?php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/crypto.php';

$identity = require_user_identity();
$publicRaw = $identity['public_raw'];
$fingerprint = public_fingerprint($publicRaw);

// ---- Ensure user exists ----
$stmt = $db->prepare("
    SELECT user_id
    FROM users
    WHERE public_key_raw = ?
");
$stmt->execute([$publicRaw]);
$user = $stmt->fetch();

if (!$user) {
    $stmt = $db->prepare("
        INSERT INTO users (display_name, public_key_raw, public_key_fingerprint)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([
        $identity['name'] ?? 'Anonymous',
        $publicRaw,
        $fingerprint
    ]);
    $user_id = (int)$db->lastInsertId();
} else {
    $user_id = (int)$user['user_id'];
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['action'])) {
    echo json_encode(['ok' => false, 'error' => 'Invalid request']);
    exit;
}

$action = $input['action'];

try {

    switch ($action) {

case 'get_all_meta':

    // $user_id already resolved via require_user_identity()

    // -----------------------------
    // FAVORITES + RATING
    // -----------------------------

    $stmt = $db->prepare("
        SELECT skill_id, is_favorite, rating
        FROM user_skill_meta
        WHERE owner_user_id = ?
    ");
    $stmt->execute([$user_id]);

    $meta = $stmt->fetchAll(PDO::FETCH_ASSOC);

// -----------------------------
// LABELS
// -----------------------------

$stmt = $db->prepare("
    SELECT
        usl.skill_id,
        ul.user_label_id AS label_id,
        ul.name,
        ul.icon,
        ul.color_primary,
        ul.color_secondary
    FROM user_skill_labels usl
    JOIN user_labels ul
        ON ul.user_label_id = usl.user_label_id
    WHERE usl.owner_user_id = ?
");
$stmt->execute([$user_id]);

$labels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // -----------------------------
    // BOOKS (skill_book containers via sections)
    // -----------------------------

$stmt = $db->prepare("
    SELECT 
        usi.skill_id,
        uc.user_container_id AS container_id,
        uc.name AS container_name
    FROM user_section_items usi
    JOIN user_container_sections ucs
        ON ucs.user_container_section_id = usi.user_container_section_id
    JOIN user_containers uc
        ON uc.user_container_id = ucs.user_container_id
    WHERE uc.owner_user_id = ?
      AND uc.type = 'skill_book'
      AND usi.type = 'skill'
");
$stmt->execute([$user_id]);
$books = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'ok' => true,
        'data' => [
            'meta'   => $meta,
            'labels' => $labels,
            'books'  => $books
        ]
    ]);

    break;

case 'add_note':

    $skill_id = (int)($input['skill_id'] ?? 0);
    $text = trim($input['note_text'] ?? '');

    if (!$skill_id || $text === '')
        throw new Exception('Invalid input');

    // next position
    $stmt = $db->prepare("
        SELECT COALESCE(MAX(position), 0) + 1
        FROM user_skill_notes
        WHERE owner_user_id = ?
          AND skill_id = ?
    ");
    $stmt->execute([$user_id, $skill_id]);
    $position = (int)$stmt->fetchColumn();

    $stmt = $db->prepare("
        INSERT INTO user_skill_notes
        (owner_user_id, skill_id, note_text, position)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$user_id, $skill_id, $text, $position]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'id' => (int)$db->lastInsertId(),
            'note_text' => $text,
            'position' => $position
        ]
    ]);
    break;

case 'update_note':

    $note_id = (int)($input['note_id'] ?? 0);
    $text = trim($input['note_text'] ?? '');

    if (!$note_id || $text === '')
        throw new Exception('Invalid input');

    $stmt = $db->prepare("
        UPDATE user_skill_notes
        SET note_text = ?
        WHERE user_skill_note_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$text, $note_id, $user_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'delete_note':

    $note_id = (int)($input['note_id'] ?? 0);
    if (!$note_id) throw new Exception('Invalid note_id');

    $stmt = $db->prepare("
        DELETE FROM user_skill_notes
        WHERE user_skill_note_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$note_id, $user_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'reorder_notes':

    $skill_id = (int)($input['skill_id'] ?? 0);
    $ordered_ids = $input['ordered_ids'] ?? [];

    if (!$skill_id || !is_array($ordered_ids))
        throw new Exception('Invalid input');

    $position = 1;

    $stmt = $db->prepare("
        UPDATE user_skill_notes
        SET position = ?
        WHERE user_skill_note_id = ?
          AND owner_user_id = ?
          AND skill_id = ?
    ");

    foreach ($ordered_ids as $note_id) {
        $stmt->execute([
            $position,
            (int)$note_id,
            $user_id,
            $skill_id
        ]);
        $position++;
    }

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'assign_label':

    $skill_id = (int)($input['skill_id'] ?? 0);
    $label_id = (int)($input['label_id'] ?? 0);

    if (!$skill_id || !$label_id)
        throw new Exception('Invalid input');

    // verify label ownership
    $stmt = $db->prepare("
        SELECT user_label_id
        FROM user_labels
        WHERE user_label_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$label_id, $user_id]);

    if (!$stmt->fetch())
        throw new Exception('Label not found');

    $stmt = $db->prepare("
        INSERT IGNORE INTO user_skill_labels
        (owner_user_id, skill_id, user_label_id)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$user_id, $skill_id, $label_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'remove_label':

    $skill_id = (int)($input['skill_id'] ?? 0);
    $label_id = (int)($input['label_id'] ?? 0);

    if (!$skill_id || !$label_id)
        throw new Exception('Invalid input');

    $stmt = $db->prepare("
        DELETE FROM user_skill_labels
        WHERE owner_user_id = ?
          AND skill_id = ?
          AND user_label_id = ?
    ");
    $stmt->execute([$user_id, $skill_id, $label_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

        // -------------------------------------------------
        // GET META FOR ONE SKILL
        // -------------------------------------------------
        case 'get_meta':

            $skill_id = (int)($input['skill_id'] ?? 0);
            if (!$skill_id) throw new Exception('Invalid skill_id');

            // Meta row
            $stmt = $db->prepare("
                SELECT is_favorite, rating
                FROM user_skill_meta
                WHERE owner_user_id = ?
                  AND skill_id = ?
            ");
            $stmt->execute([$user_id, $skill_id]);
            $meta = $stmt->fetch();

            // Notes
            $stmt = $db->prepare("
                SELECT user_skill_note_id AS id, note_text, position
                FROM user_skill_notes
                WHERE owner_user_id = ?
                  AND skill_id = ?
                ORDER BY position ASC
            ");
            $stmt->execute([$user_id, $skill_id]);
            $notes = $stmt->fetchAll();

            // Labels
            $stmt = $db->prepare("
                SELECT ul.user_label_id AS id, ul.name, ul.color_primary,
                       ul.color_secondary, ul.icon
                FROM user_skill_labels usl
                JOIN user_labels ul ON ul.user_label_id = usl.user_label_id
                WHERE usl.owner_user_id = ?
                  AND usl.skill_id = ?
            ");
            $stmt->execute([$user_id, $skill_id]);
            $labels = $stmt->fetchAll();

            echo json_encode([
                'ok' => true,
                'data' => [
                    'is_favorite' => $meta['is_favorite'] ?? 0,
                    'rating'      => $meta['rating'] ?? null,
                    'notes'       => $notes,
                    'labels'      => $labels
                ]
            ]);
            break;


        // -------------------------------------------------
        // SET FAVORITE
        // -------------------------------------------------
        case 'set_favorite':

            $skill_id = (int)($input['skill_id'] ?? 0);
            $value = (int)($input['is_favorite'] ?? 0);

            if (!$skill_id) throw new Exception('Invalid skill_id');

            $stmt = $db->prepare("
                INSERT INTO user_skill_meta (owner_user_id, skill_id, is_favorite)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE is_favorite = VALUES(is_favorite)
            ");
            $stmt->execute([$user_id, $skill_id, $value ? 1 : 0]);

            echo json_encode(['ok' => true, 'data' => true]);
            break;


        // -------------------------------------------------
        // SET RATING (0–5 or null)
        // -------------------------------------------------
        case 'set_rating':

            $skill_id = (int)($input['skill_id'] ?? 0);
            $rating = $input['rating'];

            if (!$skill_id) throw new Exception('Invalid skill_id');

            if ($rating !== null) {
                $rating = (int)$rating;
                if ($rating < 0 || $rating > 5)
                    throw new Exception('Rating must be 0–5 or null');
            }

            $stmt = $db->prepare("
                INSERT INTO user_skill_meta (owner_user_id, skill_id, rating)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE rating = VALUES(rating)
            ");
            $stmt->execute([$user_id, $skill_id, $rating]);

            echo json_encode(['ok' => true, 'data' => true]);
            break;

// -------------------------------------------------
// LIST LABELS
// -------------------------------------------------
case 'list_labels':

    $stmt = $db->prepare("
        SELECT user_label_id AS id,
               name,
               color_primary,
               color_secondary,
               icon
        FROM user_labels
        WHERE owner_user_id = ?
        ORDER BY name ASC
    ");
    $stmt->execute([$user_id]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'labels' => $stmt->fetchAll()
        ]
    ]);
    break;


// -------------------------------------------------
// CREATE LABEL
// -------------------------------------------------
case 'create_label':

    $name = trim($input['name'] ?? '');
    $color_primary = trim($input['color_primary'] ?? '');
    $color_secondary = $input['color_secondary'] ?? null;
    $icon = trim($input['icon'] ?? 'fa-tag');

    if ($name === '' || $color_primary === '')
        throw new Exception('Invalid input');

    $stmt = $db->prepare("
        INSERT INTO user_labels
        (owner_user_id, name, color_primary, color_secondary, icon)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user_id,
        $name,
        $color_primary,
        $color_secondary,
        $icon
    ]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'id' => (int)$db->lastInsertId(),
            'name' => $name,
            'color_primary' => $color_primary,
            'color_secondary' => $color_secondary,
            'icon' => $icon
        ]
    ]);
    break;


// -------------------------------------------------
// UPDATE LABEL
// -------------------------------------------------
case 'update_label':

    $label_id = (int)($input['label_id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $color_primary = trim($input['color_primary'] ?? '');
    $color_secondary = $input['color_secondary'] ?? null;
    $icon = trim($input['icon'] ?? '');

    if (!$label_id || $name === '' || $color_primary === '')
        throw new Exception('Invalid input');

    $stmt = $db->prepare("
        UPDATE user_labels
        SET name = ?, color_primary = ?, color_secondary = ?, icon = ?
        WHERE user_label_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([
        $name,
        $color_primary,
        $color_secondary,
        $icon,
        $label_id,
        $user_id
    ]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

// -------------------------------------------------
// GET ALL LABELS
// -------------------------------------------------
case 'get_all_labels':

    $stmt = $db->prepare("
        SELECT 
            user_label_id AS id,
            name,
            color_primary,
            color_secondary,
            icon
        FROM user_labels
        WHERE owner_user_id = ?
        ORDER BY name ASC
    ");

    $stmt->execute([$user_id]);

    echo json_encode([
        'ok' => true,
        'data' => $stmt->fetchAll()
    ]);
    break;


// -------------------------------------------------
// DELETE LABEL
// -------------------------------------------------
case 'delete_label':

    $label_id = (int)($input['label_id'] ?? 0);
    if (!$label_id)
        throw new Exception('Invalid label_id');

    $stmt = $db->prepare("
        DELETE FROM user_labels
        WHERE user_label_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$label_id, $user_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;


        default:
            throw new Exception('Unknown action');
    }

} catch (Throwable $e) {
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}
