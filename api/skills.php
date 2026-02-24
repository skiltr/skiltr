<?php
require_once __DIR__ . '/../inc/db.php';

header('Content-Type: application/json');

// Full raw skill table export
$sql = "SELECT * FROM skills WHERE id != 0 ORDER BY id";

$stmt = $db->query($sql);
$skills = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($skills);
