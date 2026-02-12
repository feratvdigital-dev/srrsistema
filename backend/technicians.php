<?php
require_once 'config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT * FROM technicians ORDER BY name');
        $techs = array_map('formatTechnician', $stmt->fetchAll());
        jsonResponse(['success' => true, 'data' => $techs]);
        break;

    case 'POST':
        $input = getInput();
        $id = uniqid();
        $hashedPass = isset($input['password']) ? password_hash($input['password'], PASSWORD_DEFAULT) : null;
        $stmt = $db->prepare('INSERT INTO technicians (id, name, phone, specialty, rg, cpf, profile_photo, document_photo, username, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['specialty'] ?? '',
            $input['rg'] ?? '',
            $input['cpf'] ?? '',
            $input['profilePhoto'] ?? null,
            $input['documentPhoto'] ?? null,
            $input['username'] ?? null,
            $hashedPass,
        ]);
        jsonResponse(['success' => true, 'data' => ['id' => $id]], 201);
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? '';
        $fields = [];
        $values = [];
        $map = [
            'name' => 'name', 'phone' => 'phone', 'specialty' => 'specialty',
            'rg' => 'rg', 'cpf' => 'cpf', 'profilePhoto' => 'profile_photo',
            'documentPhoto' => 'document_photo', 'username' => 'username',
        ];
        foreach ($map as $js => $sql) {
            if (isset($input[$js])) { $fields[] = "$sql = ?"; $values[] = $input[$js]; }
        }
        if (isset($input['password']) && $input['password']) {
            $fields[] = 'password = ?';
            $values[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        if (!empty($fields)) {
            $values[] = $id;
            $db->prepare('UPDATE technicians SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);
        }
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        $db->prepare('DELETE FROM technicians WHERE id = ?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;
}

function formatTechnician($row) {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'specialty' => $row['specialty'],
        'rg' => $row['rg'],
        'cpf' => $row['cpf'],
        'profilePhoto' => $row['profile_photo'],
        'documentPhoto' => $row['document_photo'],
        'username' => $row['username'],
        'password' => $row['password'] ? '***' : '',
    ];
}
