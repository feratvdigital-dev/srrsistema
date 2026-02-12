<?php
require_once 'config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM client_tickets WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $ticket = $stmt->fetch();
            if (!$ticket) jsonResponse(['success' => false, 'error' => 'Chamado não encontrado'], 404);
            
            $photos = $db->prepare('SELECT photo_data FROM ticket_photos WHERE ticket_id = ?');
            $photos->execute([$ticket['id']]);
            $ticket['photos'] = array_column($photos->fetchAll(), 'photo_data');
            jsonResponse(['success' => true, 'data' => formatTicket($ticket)]);
        } else {
            $stmt = $db->query('SELECT * FROM client_tickets ORDER BY created_at DESC');
            $tickets = $stmt->fetchAll();
            foreach ($tickets as &$ticket) {
                $photos = $db->prepare('SELECT photo_data FROM ticket_photos WHERE ticket_id = ?');
                $photos->execute([$ticket['id']]);
                $ticket['photos'] = array_column($photos->fetchAll(), 'photo_data');
                $ticket = formatTicket($ticket);
            }
            jsonResponse(['success' => true, 'data' => $tickets]);
        }
        break;

    case 'POST':
        $input = getInput();
        $id = $input['id'] ?? ('T' . time());
        $stmt = $db->prepare('INSERT INTO client_tickets (id, name, whatsapp, location, description) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['whatsapp'] ?? '',
            $input['location'] ?? '',
            $input['description'] ?? '',
        ]);
        
        if (isset($input['photos'])) {
            $photoStmt = $db->prepare('INSERT INTO ticket_photos (ticket_id, photo_data) VALUES (?, ?)');
            foreach ($input['photos'] as $photo) {
                $photoStmt->execute([$id, $photo]);
            }
        }
        
        jsonResponse(['success' => true, 'data' => ['id' => $id]], 201);
        break;

    case 'PUT':
        $input = getInput();
        $id = $input['id'] ?? '';
        
        $fields = [];
        $values = [];
        $map = [
            'status' => 'status',
            'linkedOrderId' => 'linked_order_id',
        ];
        
        foreach ($map as $js => $sql) {
            if (isset($input[$js])) {
                $fields[] = "$sql = ?";
                $values[] = $input[$js];
            }
        }
        
        if (!empty($fields)) {
            $values[] = $id;
            $stmt = $db->prepare('UPDATE client_tickets SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($values);
        }
        
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        $db->prepare('DELETE FROM client_tickets WHERE id = ?')->execute([$id]);
        jsonResponse(['success' => true]);
        break;
}

function formatTicket($row) {
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'whatsapp' => $row['whatsapp'],
        'location' => $row['location'],
        'description' => $row['description'],
        'photos' => $row['photos'] ?? [],
        'status' => $row['status'],
        'linkedOrderId' => $row['linked_order_id'] ? (int)$row['linked_order_id'] : null,
        'createdAt' => $row['created_at'],
    ];
}
