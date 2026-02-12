<?php
require_once 'config.php';
$db = getDB();
$input = getInput();

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// Verificar admin
$stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    jsonResponse(['success' => true, 'data' => ['role' => $user['role'], 'username' => $user['username']]]);
}

// Verificar técnico
$stmt = $db->prepare('SELECT * FROM technicians WHERE username = ?');
$stmt->execute([$username]);
$tech = $stmt->fetch();

if ($tech && $tech['password'] && password_verify($password, $tech['password'])) {
    jsonResponse(['success' => true, 'data' => ['role' => 'technician', 'username' => $tech['username'], 'name' => $tech['name']]]);
}

jsonResponse(['success' => false, 'error' => 'Usuário ou senha incorretos'], 401);
