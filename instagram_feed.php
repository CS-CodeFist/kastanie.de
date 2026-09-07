<?php
header('Content-Type: application/json; charset=utf-8');

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$credentialsFile = __DIR__ . '/credentials.local.php';
$previousCredentialsFile = __DIR__ . '/site_credentials.local.php';
$legacyCredentialsFile = __DIR__ . '/instagram_credentials.local.php';
$credentials = is_file($credentialsFile)
    ? require $credentialsFile
    : (is_file($previousCredentialsFile)
        ? require $previousCredentialsFile
        : (is_file($legacyCredentialsFile) ? require $legacyCredentialsFile : []));
$accountId = !empty($credentials['account_id']) ? $credentials['account_id'] : getenv('INSTAGRAM_ACCOUNT_ID');
$accessToken = !empty($credentials['access_token']) ? $credentials['access_token'] : getenv('INSTAGRAM_ACCESS_TOKEN');

if (!$accountId || !$accessToken) {
    respond(['data' => []]);
}

if (!function_exists('curl_init')) {
    respond(['data' => [], 'error' => 'Der Instagram-Abruf ist auf diesem Server nicht verfuegbar.'], 500);
}

$limit = min(max((int) ($_GET['limit'] ?? 6), 1), 12);
$fields = 'id,caption,comments_count,like_count,media_type,media_product_type,media_url,permalink,shortcode,thumbnail_url,timestamp,username,is_comment_enabled,is_shared_to_feed,video_title,children{id,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp}';
$url = sprintf(
    'https://graph.instagram.com/v22.0/%s/media?fields=%s&limit=%d&access_token=%s',
    rawurlencode($accountId),
    rawurlencode($fields),
    $limit,
    rawurlencode($accessToken)
);

$curl = curl_init($url);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

$payload = is_string($response) ? json_decode($response, true) : null;
if ($status !== 200 || !is_array($payload)) {
    $apiError = is_array($payload) ? ($payload['error']['message'] ?? null) : null;
    error_log(sprintf('Instagram API request failed (HTTP %d): %s', $status, $apiError ?: 'Keine lesbare API-Antwort.'));
    respond(['data' => [], 'error' => 'Instagram-Beitraege konnten nicht geladen werden.'], 502);
}

$posts = array_values(array_filter($payload['data'] ?? [], function ($post) {
    return !empty($post['permalink']) && (!empty($post['media_url']) || !empty($post['thumbnail_url']));
}));

foreach ($posts as &$post) {
    if (empty($post['comments_count']) || empty($post['username'])) {
        continue;
    }

    $commentsUrl = sprintf(
        'https://graph.instagram.com/v22.0/%s/comments?fields=id,text,timestamp,username&limit=25&access_token=%s',
        rawurlencode($post['id']),
        rawurlencode($accessToken)
    );
    $commentsCurl = curl_init($commentsUrl);
    curl_setopt_array($commentsCurl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10
    ]);
    $commentsResponse = curl_exec($commentsCurl);
    $commentsStatus = (int) curl_getinfo($commentsCurl, CURLINFO_HTTP_CODE);
    curl_close($commentsCurl);

    $commentsPayload = is_string($commentsResponse) ? json_decode($commentsResponse, true) : null;
    if ($commentsStatus !== 200 || !is_array($commentsPayload)) {
        $commentsError = is_array($commentsPayload) ? ($commentsPayload['error']['message'] ?? null) : null;
        error_log(sprintf('Instagram comments request failed (HTTP %d): %s', $commentsStatus, $commentsError ?: 'Keine lesbare API-Antwort.'));
        continue;
    }

    foreach ($commentsPayload['data'] ?? [] as $comment) {
        $commentAuthor = $comment['username'] ?? $comment['from']['username'] ?? '';
        if (strcasecmp($commentAuthor, $post['username']) === 0) {
            $post['author_comment'] = $comment;
            break;
        }
    }
}
unset($post);

respond(['data' => $posts]);