<?php
session_start();

// Konfiguration – später auslagern
$valid_username = "admin";
$valid_password = "geheim123";

// Login prüfen
if (isset($_POST['username'], $_POST['password'])) {
    if ($_POST['username'] === $valid_username && $_POST['password'] === $valid_password) {
        $_SESSION['logged_in'] = true;
        header("Location: editor.php");
        exit;
    } else {
        $error = "Benutzername oder Passwort falsch.";
    }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f2f2f2;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .login-box {
      background: white;
      padding: 2em;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      max-width: 300px;
      width: 100%;
    }
    .login-box h2 {
      margin-top: 0;
    }
    input[type="text"], input[type="password"] {
      width: 100%;
      padding: 0.5em;
      margin: 0.5em 0 1em;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 0.6em;
      background-color: #7ea12c;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
    .error {
      color: red;
      margin-bottom: 1em;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h2>Login</h2>
    <?php if (isset($error)) echo "<div class='error'>$error</div>"; ?>
    <form method="POST">
      <input type="text" name="username" placeholder="Benutzername" required>
      <input type="password" name="password" placeholder="Passwort" required>
      <button type="submit">Einloggen</button>
    </form>
  </div>
</body>
</html>
