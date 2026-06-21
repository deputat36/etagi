<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Метод не поддерживается',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawBody = (string) file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Некорректный JSON',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$type = (string) ($payload['type'] ?? 'sheet');
$settings = $payload['settings'] ?? null;
$hasSheetAds = isset($payload['selected_ads']) && is_array($payload['selected_ads']);
$hasEditorBlocks = isset($payload['blocks']) && is_array($payload['blocks']);

// Обработчик принимает два формата: лист с объявлениями и ручной редактор с блоками.
if (!in_array($type, ['sheet', 'editor'], true) || !is_array($settings) || (!$hasSheetAds && !$hasEditorBlocks)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Не переданы обязательные данные макета',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$flyersDir = __DIR__ . '/data/flyers';
if (!is_dir($flyersDir) && !mkdir($flyersDir, 0775, true) && !is_dir($flyersDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Не удалось создать папку для макетов',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $id = date('Ymd-His') . '-' . bin2hex(random_bytes(3));
} catch (Exception $exception) {
    $id = date('Ymd-His') . '-' . mt_rand(100000, 999999);
}

$record = [
    'id' => $id,
    'type' => $type,
    'title' => trim((string) ($payload['title'] ?? 'Макет расклейки')),
    'settings' => $settings,
    'selected_ads' => $hasSheetAds ? array_values($payload['selected_ads']) : [],
    'blocks' => $hasEditorBlocks ? array_values($payload['blocks']) : [],
    'created_at' => date('c'),
];

$targetFile = $flyersDir . '/' . $id . '.json';
$saved = file_put_contents(
    $targetFile,
    json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
);

if ($saved === false) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Не удалось записать файл макета',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $id,
    'file' => 'data/flyers/' . $id . '.json',
], JSON_UNESCAPED_UNICODE);
?>
