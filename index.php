<?php
require_once "header.php";

if(isset($_GET["action"]) && $_GET["action"]== "logout" && $_SERVER["REQUEST_METHOD"] == "GET"){
session_destroy();
header("Location:login.php");

}

if(!isset($_SESSION["id"])){
header("Location:login.php");
}else{
$id = $_SESSION["id"];
$query = mysqli_query($connect,"SELECT * FROM users WHERE id=$id");
if(mysqli_num_rows($query) == 0){
header("Location:login.php");

}else if(mysqli_num_rows($query) > 0){
$row = mysqli_fetch_assoc($query);
$username = $row["username"];
$email= $row["email"];

}
}




?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Index</title>
</head>
<body>
    
    <div class="dashbord">
    <?php
    echo "<h1>WELCOME $username </h1>
    <p>Username:$username</p>
    <p>Email:$email</p>
    
    
    ";
    
    ?>
    <a href="index.php?action=logout" class="btn-lg">Logout</a>
    </div>
</body>
</html>