<?php
// Приём заявок с лендинга и передача в Битрикс24 (crm.lead.add).
// Настройки — в config.php. Пока вебхук не указан, заявки пишутся в leads.log.

header('Content-Type: application/json; charset=utf-8');

function respond($code, $data) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method']);
}

$config = require __DIR__ . '/config.php';
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) {
    respond(400, ['ok' => false, 'error' => 'bad request']);
}

$clean = function ($key, $max = 200) use ($in) {
    return isset($in[$key]) ? mb_substr(trim(strip_tags((string) $in[$key])), 0, $max) : '';
};

$name  = $clean('name', 100);
$phone = $clean('phone', 30);
$email = $clean('email', 150);
$form  = $clean('form', 150);
$page  = $clean('page', 500);

$digits = preg_replace('/\D/', '', $phone);
if (mb_strlen($name) < 2 || strlen($digits) !== 11) {
    respond(422, ['ok' => false, 'error' => 'validation']);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = '';
}

// Простая защита от повторной отправки: не чаще раза в 10 секунд с одного IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$lock = sys_get_temp_dir() . '/lead_' . md5($ip);
if (is_file($lock) && time() - filemtime($lock) < 10) {
    respond(429, ['ok' => false, 'error' => 'too many requests']);
}
@touch($lock);

$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $k) {
    $utm[strtoupper($k)] = $clean($k);
}

$comments = "Форма: {$form}\nСтраница: {$page}";
foreach (['yclid', 'gclid'] as $k) {
    if ($clean($k) !== '') {
        $comments .= "\n{$k}: " . $clean($k);
    }
}

$fields = array_merge([
    'TITLE'       => ($config['lead_title'] ?? 'Заявка с сайта') . ' — ' . $form,
    'NAME'        => $name,
    'PHONE'       => [['VALUE' => '+' . $digits, 'VALUE_TYPE' => 'WORK']],
    'SOURCE_ID'   => $config['source_id'] ?? 'WEB',
    'SOURCE_DESCRIPTION' => $form,
    'COMMENTS'    => $comments,
], array_filter($utm));
if ($email !== '') {
    $fields['EMAIL'] = [['VALUE' => $email, 'VALUE_TYPE' => 'WORK']];
}
if (!empty($config['assigned_by_id'])) {
    $fields['ASSIGNED_BY_ID'] = (int) $config['assigned_by_id'];
}

$webhook = rtrim($config['bitrix_webhook'] ?? '', '/');

if ($webhook === '') {
    // ЗАГЛУШКА: вебхук ещё не указан — сохраняем заявку в лог
    $line = date('c') . "\t" . json_encode($fields, JSON_UNESCAPED_UNICODE) . PHP_EOL;
    file_put_contents(__DIR__ . '/leads.log', $line, FILE_APPEND | LOCK_EX);
    respond(200, ['ok' => true, 'stub' => true]);
}

$ch = curl_init($webhook . '/crm.lead.add.json');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode(['fields' => $fields, 'params' => ['REGISTER_SONET_EVENT' => 'Y']], JSON_UNESCAPED_UNICODE),
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode((string) $response, true);
if ($status !== 200 || empty($result['result'])) {
    // Заявка не должна потеряться: пишем в лог, чтобы менеджер мог её обработать
    $line = date('c') . "\tОШИБКА Б24 ({$status})\t" . json_encode($fields, JSON_UNESCAPED_UNICODE) . PHP_EOL;
    file_put_contents(__DIR__ . '/leads.log', $line, FILE_APPEND | LOCK_EX);
    respond(502, ['ok' => false, 'error' => 'crm']);
}

respond(200, ['ok' => true]);
