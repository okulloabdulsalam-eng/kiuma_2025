<?php
/**
 * Database Connection Test Script
 * Use this to verify your database configuration
 */

require_once 'config/database.php';

echo "<h2>KIUMA Database Connection Test</h2>";

try {
    $pdo = getDBConnection();
    echo "<p style='color: green;'>✓ Database connection successful!</p>";
    
    // Test table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'recruits'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: green;'>✓ Table 'recruits' exists</p>";
        
        // Show table structure
        $stmt = $pdo->query("DESCRIBE recruits");
        echo "<h3>Table Structure:</h3>";
        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        while ($row = $stmt->fetch()) {
            echo "<tr>";
            echo "<td>" . $row['Field'] . "</td>";
            echo "<td>" . $row['Type'] . "</td>";
            echo "<td>" . $row['Null'] . "</td>";
            echo "<td>" . $row['Key'] . "</td>";
            echo "<td>" . ($row['Default'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Count existing records
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM recruits");
        $count = $stmt->fetch()['count'];
        echo "<p>Total records in database: <strong>$count</strong></p>";
    } else {
        echo "<p style='color: red;'>✗ Table 'recruits' does not exist. Please run the schema.sql file.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error: " . $e->getMessage() . "</p>";
    echo "<p>Please check your database configuration in config/database.php</p>";
}

echo "<hr>";
echo "<p><small>Delete this file after testing for security.</small></p>";
?>

