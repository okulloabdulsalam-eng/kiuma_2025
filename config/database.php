<?php
/**
 * KIUMA Database Configuration
 * Update these values with your MySQL database credentials
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');  // Change to your MySQL username
define('DB_PASS', '');      // Change to your MySQL password
define('DB_NAME', 'kiuma_recruitment');

// Email configuration
define('EMAIL_TO', 'aworshibah2006@gmail.com');
define('EMAIL_FROM', 'noreply@kiuma.org'); // Change to your domain email
define('EMAIL_SUBJECT', 'New Recruit Joined - KIUMA');

// WhatsApp configuration
define('WHATSAPP_TO', '+256703268522'); // Include country code
define('WHATSAPP_FROM', ''); // Your Twilio WhatsApp number (format: whatsapp:+14155238886)
define('TWILIO_ACCOUNT_SID', ''); // Your Twilio Account SID
define('TWILIO_AUTH_TOKEN', ''); // Your Twilio Auth Token

// SMTP configuration (if using SMTP for emails)
define('SMTP_HOST', 'smtp.gmail.com'); // Gmail SMTP
define('SMTP_PORT', 587);
define('SMTP_USERNAME', ''); // Your email address
define('SMTP_PASSWORD', ''); // Your email password or app password
define('SMTP_ENCRYPTION', 'tls'); // 'tls' or 'ssl'

/**
 * Database connection function
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection error: " . $e->getMessage());
        die("Database connection failed. Please check your configuration.");
    }
}
?>

