<?php
// /api/skill_relations.php

require_once __DIR__ . '/../inc/db.php';

header('Content-Type: application/json');

$sql = "
    SELECT
        skill_id,
        condition_id,
        interaction_id
    FROM skill_condition_relations
";

$stmt = $db->query($sql);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($rows);
