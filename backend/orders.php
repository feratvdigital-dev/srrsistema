<?php
require_once 'config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM service_orders WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $order = $stmt->fetch();
            if (!$order) jsonResponse(['success' => false, 'error' => 'OS não encontrada'], 404);
            
            // Buscar fotos
            $photos = $db->prepare('SELECT phase, photo_data FROM order_photos WHERE order_id = ?');
            $photos->execute([$order['id']]);
            $order['photos'] = ['before' => [], 'during' => [], 'after' => []];
            foreach ($photos->fetchAll() as $photo) {
                $order['photos'][$photo['phase']][] = $photo['photo_data'];
            }
            jsonResponse(['success' => true, 'data' => formatOrder($order)]);
        } else {
            $stmt = $db->query('SELECT * FROM service_orders ORDER BY created_at DESC');
            $orders = $stmt->fetchAll();
            foreach ($orders as &$order) {
                $photos = $db->prepare('SELECT phase, photo_data FROM order_photos WHERE order_id = ?');
                $photos->execute([$order['id']]);
                $order['photos'] = ['before' => [], 'during' => [], 'after' => []];
                foreach ($photos->fetchAll() as $photo) {
                    $order['photos'][$photo['phase']][] = $photo['photo_data'];
                }
                $order = formatOrder($order);
            }
            jsonResponse(['success' => true, 'data' => $orders]);
        }
        break;

    case 'POST':
        $input = getInput();
        $stmt = $db->prepare('INSERT INTO service_orders (client_name, client_phone, client_email, service_type, address, latitude, longitude, description, observation, labor_cost, material_cost, material_description, assigned_technician) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $input['clientName'] ?? '',
            $input['clientPhone'] ?? '',
            $input['clientEmail'] ?? '',
            $input['serviceType'] ?? 'hydraulic',
            $input['address'] ?? '',
            $input['latitude'] ?? null,
            $input['longitude'] ?? null,
            $input['description'] ?? '',
            $input['observation'] ?? '',
            $input['laborCost'] ?? 0,
            $input['materialCost'] ?? 0,
            $input['materialDescription'] ?? '',
            $input['assignedTechnician'] ?? '',
        ]);
        $id = $db->lastInsertId();
        
        // Salvar fotos
        if (isset($input['photos'])) {
            savePhotos($db, $id, $input['photos']);
        }
        
        jsonResponse(['success' => true, 'data' => ['id' => (int)$id]], 201);
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? 0;
        unset($input['id']);
        
        $fields = [];
        $values = [];
        $map = [
            'clientName' => 'client_name', 'clientPhone' => 'client_phone',
            'clientEmail' => 'client_email', 'serviceType' => 'service_type',
            'address' => 'address', 'latitude' => 'latitude', 'longitude' => 'longitude',
            'description' => 'description', 'observation' => 'observation',
            'laborCost' => 'labor_cost', 'materialCost' => 'material_cost',
            'materialDescription' => 'material_description', 'status' => 'status',
            'assignedTechnician' => 'assigned_technician',
            'executedAt' => 'executed_at', 'closedAt' => 'closed_at',
        ];
        
        foreach ($map as $js => $sql) {
            if (isset($input[$js])) {
                $fields[] = "$sql = ?";
                $values[] = $input[$js];
            }
        }
        
        if (!empty($fields)) {
            $values[] = $id;
            $stmt = $db->prepare('UPDATE service_orders SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($values);
        }
        
        // Atualizar fotos
        if (isset($input['photos'])) {
            $db->prepare('DELETE FROM order_photos WHERE order_id = ?')->execute([$id]);
            savePhotos($db, $id, $input['photos']);
        }
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? 0;
        $db->prepare('DELETE FROM service_orders WHERE id = ?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;
}

function savePhotos($db, $orderId, $photos) {
    $stmt = $db->prepare('INSERT INTO order_photos (order_id, phase, photo_data) VALUES (?, ?, ?)');
    foreach (['before', 'during', 'after'] as $phase) {
        if (isset($photos[$phase])) {
            foreach ($photos[$phase] as $photo) {
                $stmt->execute([$orderId, $phase, $photo]);
            }
        }
    }
}

function formatOrder($row) {
    return [
        'id' => (int)$row['id'],
        'clientName' => $row['client_name'],
        'clientPhone' => $row['client_phone'],
        'clientEmail' => $row['client_email'],
        'serviceType' => $row['service_type'],
        'address' => $row['address'],
        'latitude' => $row['latitude'] ? (float)$row['latitude'] : null,
        'longitude' => $row['longitude'] ? (float)$row['longitude'] : null,
        'description' => $row['description'],
        'observation' => $row['observation'],
        'photos' => $row['photos'] ?? ['before' => [], 'during' => [], 'after' => []],
        'laborCost' => (float)$row['labor_cost'],
        'materialCost' => (float)$row['material_cost'],
        'materialDescription' => $row['material_description'],
        'status' => $row['status'],
        'assignedTechnician' => $row['assigned_technician'],
        'createdAt' => $row['created_at'],
        'executedAt' => $row['executed_at'],
        'closedAt' => $row['closed_at'],
    ];
}
