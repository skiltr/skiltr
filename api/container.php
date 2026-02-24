<?php
// /api/container.php
declare(strict_types=1);

header('Content-Type: application/json');

require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/auth.php';
require_once __DIR__ . '/../inc/crypto.php';

require_once __DIR__ . '/../composer/vendor/autoload.php';
require_once __DIR__ . '/../inc/moderation.php';

$identity = require_user_identity();

$publicRaw = $identity['public_raw'] ?? null;

if (!$publicRaw || strlen($publicRaw) !== 32) {
    echo json_encode(['ok' => false, 'error' => 'No identity']);
    exit;
}

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

    // optional: update last_seen_at
    $stmt = $db->prepare("
        UPDATE users
        SET last_seen_at = NOW()
        WHERE user_id = ?
    ");
    $stmt->execute([$user_id]);
}

// ---- Read JSON input ----
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['action'])) {
    echo json_encode(['ok' => false, 'error' => 'Invalid request']);
    exit;
}

$action = $input['action'];

try {

    switch ($action) {

        case 'list':

    $type = $input['type'] ?? null;

    if ($type) {

        $stmt = $db->prepare("
            SELECT user_container_id AS id,
                   name,
                   type,
                   position,
                   is_default,
                   icon,
                   color_primary,
                   color_secondary
            FROM user_containers
            WHERE owner_user_id = ?
              AND type = ?
            ORDER BY position ASC
        ");

        $stmt->execute([$user_id, $type]);

    } else {

        $stmt = $db->prepare("
            SELECT user_container_id AS id,
                   name,
                   type,
                   position,
                   is_default,
                   icon,
                   color_primary,
                   color_secondary
            FROM user_containers
            WHERE owner_user_id = ?
            ORDER BY position ASC
        ");

        $stmt->execute([$user_id]);
    }

    echo json_encode([
        'ok' => true,
        'data' => ['containers' => $stmt->fetchAll()]
    ]);

    break;


	case 'list_items':

    $container_id = (int)($input['container_id'] ?? 0);
    if (!$container_id) throw new Exception('Invalid container_id');

    // verify ownership
    $stmt = $db->prepare("
        SELECT type
        FROM user_containers
        WHERE user_container_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$container_id, $user_id]);
    $container = $stmt->fetch();

    if (!$container) throw new Exception('Container not found');

    if ($container['type'] === 'build_group' || $container['type'] === 'team_build') {

        $stmt = $db->prepare("
            SELECT ub.user_build_id, ub.name, uic.position
            FROM user_builds_in_containers uic
            JOIN user_builds ub ON ub.user_build_id = uic.user_build_id
            WHERE uic.user_container_id = ?
            ORDER BY uic.position ASC
        ");
        $stmt->execute([$container_id]);

        echo json_encode([
            'ok' => true,
            'data' => [
                'type' => $container['type'],
                'items' => $stmt->fetchAll()
            ]
        ]);

    } else {

        // -------- BOOKS VIA SECTIONS --------

        // fetch sections
        $stmt = $db->prepare("
            SELECT user_container_section_id,
                   type,
                   title,
                   position,
                   config
            FROM user_container_sections
            WHERE user_container_id = ?
            ORDER BY position ASC
        ");
        $stmt->execute([$container_id]);
        $sections = $stmt->fetchAll();

        $result = [];

        foreach ($sections as $section) {

            $section_id = (int)$section['user_container_section_id'];

            $stmtItems = $db->prepare("
                SELECT user_section_item_id,
                       type,
                       skill_id,
                       user_build_id,
                       text_content,
                       position
                FROM user_section_items
                WHERE user_container_section_id = ?
                ORDER BY position ASC
            ");
            $stmtItems->execute([$section_id]);

            $result[] = [
                'section_id' => $section_id,
                'type'       => $section['type'],
                'title'      => $section['title'],
                'position'   => (int)$section['position'],
                'config'     => $section['config'],
                'items'      => $stmtItems->fetchAll()
            ];
        }

        echo json_encode([
            'ok' => true,
            'data' => [
                'type' => $container['type'],
                'sections' => $result
            ]
        ]);
    }

    break;

case 'add_build':

    $container_id = (int)($input['container_id'] ?? 0);
    $user_build_id = (int)($input['user_build_id'] ?? 0);

    if (!$container_id || !$user_build_id)
        throw new Exception('Invalid input');

    // verify container ownership
    $stmt = $db->prepare("
        SELECT type
        FROM user_containers
        WHERE user_container_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$container_id, $user_id]);
    $container = $stmt->fetch();

    if (!$container) throw new Exception('Container not found');

    // verify build ownership
    $stmt = $db->prepare("
        SELECT user_build_id
        FROM user_builds
        WHERE user_build_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$user_build_id, $user_id]);
    if (!$stmt->fetch()) throw new Exception('Build not found');

    // team build validation
if ($container['type'] === 'team_build') {

    // ---- 1) Max 8 builds ----
    $stmt = $db->prepare("
        SELECT COUNT(*)
        FROM user_builds_in_containers
        WHERE user_container_id = ?
    ");
    $stmt->execute([$container_id]);
    $count = (int)$stmt->fetchColumn();

    if ($count >= 8)
        throw new Exception('Team build container can hold max 8 builds');

    // ---- 2) PvE restriction ----

    // Does this build contain a PvE skill?
    $stmt = $db->prepare("
        SELECT 1
        FROM user_builds ub
        JOIN gw_builds gb ON gb.gw_build_id = ub.gw_build_id
        JOIN skills s ON s.id IN (
            gb.skill1_id, gb.skill2_id, gb.skill3_id, gb.skill4_id,
            gb.skill5_id, gb.skill6_id, gb.skill7_id, gb.skill8_id
        )
        WHERE ub.user_build_id = ?
          AND s.pve_only = 1
        LIMIT 1
    ");
    $stmt->execute([$user_build_id]);
    $hasPve = (bool)$stmt->fetchColumn();

    if ($hasPve) {

        // Does container already contain a PvE build?
        $stmt = $db->prepare("
            SELECT 1
            FROM user_builds_in_containers uic
            JOIN user_builds ub ON ub.user_build_id = uic.user_build_id
            JOIN gw_builds gb ON gb.gw_build_id = ub.gw_build_id
            JOIN skills s ON s.id IN (
                gb.skill1_id, gb.skill2_id, gb.skill3_id, gb.skill4_id,
                gb.skill5_id, gb.skill6_id, gb.skill7_id, gb.skill8_id
            )
            WHERE uic.user_container_id = ?
              AND s.pve_only = 1
            LIMIT 1
        ");
        $stmt->execute([$container_id]);

        if ($stmt->fetchColumn())
            throw new Exception('Only one PvE build allowed in team container');
    }
}


    // get next position
    $stmt = $db->prepare("
        SELECT COALESCE(MAX(position), 0) + 1
        FROM user_builds_in_containers
        WHERE user_container_id = ?
    ");
    $stmt->execute([$container_id]);
    $position = (int)$stmt->fetchColumn();

    $stmt = $db->prepare("
        INSERT INTO user_builds_in_containers
        (user_container_id, user_build_id, position)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$container_id, $user_build_id, $position]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'reorder_items':

    $container_id = (int)($input['container_id'] ?? 0);
    $ordered_ids = $input['ordered_ids'] ?? [];

    if (!$container_id || !is_array($ordered_ids))
        throw new Exception('Invalid input');

    // verify ownership
    $stmt = $db->prepare("
        SELECT user_container_id
        FROM user_containers
        WHERE user_container_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([$container_id, $user_id]);
    if (!$stmt->fetch()) throw new Exception('Container not found');

    $position = 1;

    $stmt = $db->prepare("
        UPDATE user_builds_in_containers
        SET position = ?
        WHERE user_container_id = ?
          AND user_build_id = ?
    ");

    foreach ($ordered_ids as $build_id) {
        $stmt->execute([$position, $container_id, (int)$build_id]);
        $position++;
    }

    echo json_encode(['ok' => true, 'data' => true]);
    break;

case 'move_build':

    $from_container_id = (int)($input['from_container_id'] ?? 0);
    $to_container_id   = (int)($input['to_container_id'] ?? 0);
    $user_build_id     = (int)($input['user_build_id'] ?? 0);

    if (!$from_container_id || !$to_container_id || !$user_build_id)
        throw new Exception('Invalid input');

    // verify both containers belong to user
    $stmt = $db->prepare("
        SELECT user_container_id, type
        FROM user_containers
        WHERE user_container_id IN (?, ?)
          AND owner_user_id = ?
    ");
    $stmt->execute([$from_container_id, $to_container_id, $user_id]);
    $containers = $stmt->fetchAll();

    if (count($containers) !== 2)
        throw new Exception('Container ownership error');

    // determine target container type
    $targetType = null;
    foreach ($containers as $c) {
        if ((int)$c['user_container_id'] === $to_container_id) {
            $targetType = $c['type'];
        }
    }

    // --- team_build validation ---
    if ($targetType === 'team_build') {

        // max 8
        $stmt = $db->prepare("
            SELECT COUNT(*)
            FROM user_builds_in_containers
            WHERE user_container_id = ?
        ");
        $stmt->execute([$to_container_id]);
        if ((int)$stmt->fetchColumn() >= 8)
            throw new Exception('Team build container can hold max 8 builds');

        // PvE restriction (same logic as add_build)
        $stmt = $db->prepare("
            SELECT 1
            FROM user_builds ub
            JOIN gw_builds gb ON gb.gw_build_id = ub.gw_build_id
            JOIN skills s ON s.id IN (
                gb.skill1_id, gb.skill2_id, gb.skill3_id, gb.skill4_id,
                gb.skill5_id, gb.skill6_id, gb.skill7_id, gb.skill8_id
            )
            WHERE ub.user_build_id = ?
              AND s.pve_only = 1
            LIMIT 1
        ");
        $stmt->execute([$user_build_id]);
        $hasPve = (bool)$stmt->fetchColumn();

        if ($hasPve) {

            $stmt = $db->prepare("
                SELECT 1
                FROM user_builds_in_containers uic
                JOIN user_builds ub ON ub.user_build_id = uic.user_build_id
                JOIN gw_builds gb ON gb.gw_build_id = ub.gw_build_id
                JOIN skills s ON s.id IN (
                    gb.skill1_id, gb.skill2_id, gb.skill3_id, gb.skill4_id,
                    gb.skill5_id, gb.skill6_id, gb.skill7_id, gb.skill8_id
                )
                WHERE uic.user_container_id = ?
                  AND s.pve_only = 1
                LIMIT 1
            ");
            $stmt->execute([$to_container_id]);

            if ($stmt->fetchColumn())
                throw new Exception('Only one PvE build allowed in team container');
        }
    }

    // remove from old container
    $stmt = $db->prepare("
        DELETE FROM user_builds_in_containers
        WHERE user_container_id = ?
          AND user_build_id = ?
    ");
    $stmt->execute([$from_container_id, $user_build_id]);

    // get new position
    $stmt = $db->prepare("
        SELECT COALESCE(MAX(position), 0) + 1
        FROM user_builds_in_containers
        WHERE user_container_id = ?
    ");
    $stmt->execute([$to_container_id]);
    $position = (int)$stmt->fetchColumn();

    // insert into new container
    $stmt = $db->prepare("
        INSERT INTO user_builds_in_containers
        (user_container_id, user_build_id, position)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$to_container_id, $user_build_id, $position]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;


case 'remove_build':

    $container_id = (int)($input['container_id'] ?? 0);
    $user_build_id = (int)($input['user_build_id'] ?? 0);

    if (!$container_id || !$user_build_id)
        throw new Exception('Invalid input');

    $stmt = $db->prepare("
        DELETE FROM user_builds_in_containers
        WHERE user_container_id = ?
          AND user_build_id = ?
    ");
    $stmt->execute([$container_id, $user_build_id]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;

        case 'create':

$name = trim($input['name'] ?? '');
$type = $input['type'] ?? '';

if ($name === '' || $type === '') {
    throw new Exception('Missing name or type');
}

if (Moderation::containsProfanity($name)) {
    throw new Exception('Inappropriate content');
}


            $stmt = $db->prepare("
                SELECT COALESCE(MAX(position), 0) + 1
                FROM user_containers
                WHERE owner_user_id = ?
            ");
            $stmt->execute([$user_id]);
            $position = (int)$stmt->fetchColumn();

$icon = $input['icon'] ?? null;
$color_primary = $input['color_primary'] ?? null;
$color_secondary = $input['color_secondary'] ?? null;

            $stmt = $db->prepare("
INSERT INTO user_containers
(owner_user_id, name, type, position, icon, color_primary, color_secondary)
VALUES (?, ?, ?, ?, ?, ?, ?)

            ");
            $stmt->execute([
    $user_id,
    $name,
    $type,
    $position,
    $icon,
    $color_primary,
    $color_secondary
]);

$container_id = (int)$db->lastInsertId();

// ---- AUTO CREATE DEFAULT SECTION FOR SKILL BOOK ----
if ($type === 'skill_book') {

    $stmt = $db->prepare("
        INSERT INTO user_container_sections
        (user_container_id, type, title, position)
        VALUES (?, 'manual_skills', 'Skills', 1)
    ");
    $stmt->execute([$container_id]);
}


            echo json_encode([
                'ok' => true,
                'data' => [
                    'id' => $container_id,
                    'name' => $name,
                    'type' => $type,
                    'position' => $position
                ]
            ]);
            break;


        case 'delete':

            $container_id = (int)($input['container_id'] ?? 0);
            if (!$container_id) throw new Exception('Invalid container_id');

            $stmt = $db->prepare("
                DELETE FROM user_containers
                WHERE user_container_id = ?
                  AND owner_user_id = ?
            ");
            $stmt->execute([$container_id, $user_id]);

            echo json_encode(['ok' => true, 'data' => true]);
            break;


case 'rename':

    $container_id = (int)($input['container_id'] ?? 0);
    $name = trim($input['name'] ?? '');

    $icon = $input['icon'] ?? null;
    $color_primary = $input['color_primary'] ?? null;
    $color_secondary = $input['color_secondary'] ?? null;

if (!$container_id || $name === '') {
    throw new Exception('Invalid input');
}

if (Moderation::containsProfanity($name)) {
    throw new Exception('Inappropriate content');
}


    $stmt = $db->prepare("
        UPDATE user_containers
        SET name = ?, icon = ?, color_primary = ?, color_secondary = ?
        WHERE user_container_id = ?
          AND owner_user_id = ?
    ");
    $stmt->execute([
        $name,
        $icon,
        $color_primary,
        $color_secondary,
        $container_id,
        $user_id
    ]);

    echo json_encode(['ok' => true, 'data' => true]);
    break;


// -------------------------------------------------
// ADD SKILL TO CONTAINER
// -------------------------------------------------

case 'add_skill_to_section':

    $section_id = (int)($input['section_id'] ?? 0);
    $skill_id   = (int)($input['skill_id'] ?? 0);

    if (!$section_id || !$skill_id)
        throw new Exception('Invalid input');

    // -------------------------------------------------
    // VERIFY SECTION OWNERSHIP
    // -------------------------------------------------
    $stmt = $db->prepare("
        SELECT ucs.user_container_section_id
        FROM user_container_sections ucs
        JOIN user_containers uc
          ON uc.user_container_id = ucs.user_container_id
        WHERE ucs.user_container_section_id = ?
          AND uc.owner_user_id = ?
    ");
    $stmt->execute([$section_id, $user_id]);

    if (!$stmt->fetch())
        throw new Exception('Section not found');

    // -------------------------------------------------
    // VERIFY SKILL EXISTS
    // -------------------------------------------------
    $stmt = $db->prepare("SELECT id FROM skills WHERE id = ?");
    $stmt->execute([$skill_id]);

    if (!$stmt->fetch())
        throw new Exception('Skill not found');

    // -------------------------------------------------
    // PREVENT DUPLICATES
    // -------------------------------------------------
    $stmt = $db->prepare("
        SELECT 1
        FROM user_section_items
        WHERE user_container_section_id = ?
          AND type = 'skill'
          AND skill_id = ?
        LIMIT 1
    ");
    $stmt->execute([$section_id, $skill_id]);

    if ($stmt->fetch()) {
        echo json_encode(['ok'=>true,'data'=>true]);
        break; // silently ignore duplicate
    }

    // -------------------------------------------------
    // NEXT POSITION
    // -------------------------------------------------
    $stmt = $db->prepare("
        SELECT COALESCE(MAX(position),0)+1
        FROM user_section_items
        WHERE user_container_section_id = ?
    ");
    $stmt->execute([$section_id]);
    $position = (int)$stmt->fetchColumn();

    // -------------------------------------------------
    // INSERT
    // -------------------------------------------------
    $stmt = $db->prepare("
        INSERT INTO user_section_items
        (user_container_section_id, type, skill_id, position)
        VALUES (?, 'skill', ?, ?)
    ");
    $stmt->execute([$section_id, $skill_id, $position]);

    echo json_encode(['ok'=>true,'data'=>true]);
    break;

case 'remove_section_item':

    $item_id = (int)($input['user_section_item_id'] ?? 0);
    if (!$item_id)
        throw new Exception('Invalid input');

    // verify ownership
    $stmt = $db->prepare("
        SELECT usi.user_section_item_id
        FROM user_section_items usi
        JOIN user_container_sections ucs
          ON ucs.user_container_section_id = usi.user_container_section_id
        JOIN user_containers uc
          ON uc.user_container_id = ucs.user_container_id
        WHERE usi.user_section_item_id = ?
          AND uc.owner_user_id = ?
    ");
    $stmt->execute([$item_id, $user_id]);

    if (!$stmt->fetch())
        throw new Exception('Item not found');

    $stmt = $db->prepare("
        DELETE FROM user_section_items
        WHERE user_section_item_id = ?
    ");
    $stmt->execute([$item_id]);

    echo json_encode(['ok'=>true,'data'=>true]);
    break;

// -------------------------------------------------
// SECTIONS 
// -------------------------------------------------

case 'list_sections':

    $container_id = (int)($input['container_id'] ?? 0);
    if (!$container_id) throw new Exception('Invalid container_id');

    $stmt = $db->prepare("
        SELECT user_container_section_id,
               type,
               title,
               position
        FROM user_container_sections
        WHERE user_container_id = ?
        ORDER BY position ASC
    ");
    $stmt->execute([$container_id]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'sections' => $stmt->fetchAll()
        ]
    ]);
    break;

case 'list_section_items':

    $section_id = (int)($input['section_id'] ?? 0);
    if (!$section_id) throw new Exception('Invalid section_id');

    $stmt = $db->prepare("
        SELECT user_section_item_id,
               type,
               skill_id,
               user_build_id,
               text_content,
               position
        FROM user_section_items
        WHERE user_container_section_id = ?
        ORDER BY position ASC
    ");
    $stmt->execute([$section_id]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'items' => $stmt->fetchAll()
        ]
    ]);
    break;

// -------------------------------------------------
// REORDER CONTAINERS
// -------------------------------------------------
case 'reorder_containers':

    $ordered_ids = $input['ordered_ids'] ?? [];

    if (!is_array($ordered_ids))
        throw new Exception('Invalid input');

    $position = 1;

    $stmt = $db->prepare("
        UPDATE user_containers
        SET position = ?
        WHERE user_container_id = ?
          AND owner_user_id = ?
    ");

    foreach ($ordered_ids as $container_id) {
        $stmt->execute([
            $position,
            (int)$container_id,
            $user_id
        ]);
        $position++;
    }

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
