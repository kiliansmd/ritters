<?php
/**
 * Formular-Handler: Kontakt- und Terminanfragen (Basisversion)
 * - keine Speicherung auf dem Server, nur Weiterleitung per E-Mail
 * - Spam-Schutz: Honeypot + Mindest-/Höchstausfüllzeit, ohne externe Dienste
 * Für zuverlässige Zustellung beim Hoster SMTP/SPF/DKIM für die Absenderadresse einrichten.
 */
declare(strict_types=1);

const EMPFAENGER = 'ritters@schornsteinfeger.koeln';
const ABSENDER   = 'website@schornsteinfeger.koeln'; // muss zur Domain gehören (SPF/DKIM)

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$isEn = (($_POST['sprache'] ?? '') === 'en');

function antwort(bool $ok, int $code, bool $json): never {
    global $isEn;
    http_response_code($code);
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok]);
    } else {
        header('Location: ' . ($isEn ? '/en/' : '/') . '?anfrage=' . ($ok ? 'ok' : 'fehler') . ($isEn ? '#request' : '#anfrage'), true, 303);
    }
    exit;
}

function feld(string $name, int $max = 500): string {
    $v = trim((string)($_POST[$name] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') antwort(false, 405, $wantsJson);

// Spam: Honeypot gefüllt oder unplausible Ausfüllzeit -> stillschweigend „ok“
$ts = (int)($_POST['ts'] ?? 0);
$dauer = time() - $ts;
if (feld('website') !== '' || $dauer < 3 || $dauer > 7200) antwort(true, 200, $wantsJson);

$art     = feld('art', 40) === 'Terminanfrage' ? 'Terminanfrage' : 'Kontaktanfrage';
$name    = str_replace("\n", ' ', feld('name', 120));
$email   = str_replace("\n", '', feld('email', 200));
$telefon = str_replace("\n", ' ', feld('telefon', 60));
$msg     = feld('nachricht', 5000);

$einwilligung = feld('datenschutz', 3) === 'ja';
$fehler = $name === '' || !$einwilligung; // Einwilligung ist Pflicht
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $fehler = true;
if ($art === 'Terminanfrage') {
    $leistung = feld('leistung', 80);
    $adresse  = str_replace("\n", ' ', feld('adresse', 200));
    $datum    = preg_match('/^\d{4}-\d{2}-\d{2}$/', feld('wunschtermin', 10)) ? feld('wunschtermin', 10) : '';
    $zeit     = in_array(feld('zeit', 20), ['egal', 'vormittags', 'nachmittags'], true) ? feld('zeit', 20) : 'egal';
    if ($telefon === '' || $leistung === '' || $adresse === '') $fehler = true;
} else {
    if ($email === '' || $msg === '') $fehler = true;
}
if ($fehler) antwort(false, 422, $wantsJson);

$zeilen = ["Neue {$art} über die Website" . ($isEn ? ' (englische Seite – Kunde bevorzugt ggf. Englisch)' : ''), str_repeat('-', 40), "Name:     {$name}", "Telefon:  {$telefon}", "E-Mail:   {$email}"];
if ($art === 'Terminanfrage') {
    $zeilen[] = "Anliegen: {$leistung}";
    $zeilen[] = "Objekt:   {$adresse}";
    $zeilen[] = 'Wunsch:   ' . ($datum ? date('d.m.Y', strtotime($datum)) : 'kein Datum') . ", {$zeit}";
}
$zeilen[] = '';
$zeilen[] = "Nachricht:\n" . ($msg !== '' ? $msg : '–');
$zeilen[] = '';
$zeilen[] = 'Hinweis: Terminanfrage bitte manuell bestätigen.';
$zeilen[] = '';
// Nachweis der Einwilligung (Art. 7 Abs. 1 DSGVO) – ohne IP-Adresse
$zeilen[] = 'Datenschutz-Einwilligung erteilt am ' . date('d.m.Y \u\m H:i') . ' Uhr über das Website-Formular (' . $art . ').';
$zeilen[] = 'Löschung nach Abschluss der Bearbeitung, sofern keine Aufbewahrungspflicht besteht.';

$betreff = '=?UTF-8?B?' . base64_encode("{$art}: {$name}") . '?=';
$header  = [
    'From: Website Schornsteinfeger Ritters <' . ABSENDER . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
if ($email !== '') $header[] = 'Reply-To: ' . $email;

$ok = mail(EMPFAENGER, $betreff, implode("\n", $zeilen), implode("\r\n", $header), '-f' . ABSENDER);
antwort($ok, $ok ? 200 : 500, $wantsJson);
