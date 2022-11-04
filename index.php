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
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
    <title>Index</title>
</head>
<body>
    <!--navigation bar using bootsrap-->
    <nav class="navbar navbar-inverse">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">WebSiteName</a>
            </div>
            <ul class="nav navbar-nav">
                <li class="active"><a href="#">Home</a></li>
                <li><a href="#">Library</a></li>
                <li><a href="#">Latest</a></li>
                <li><a href="#">Top</a></li>
            </ul>
        </div>
    </nav>

    <!--welcoming user-->
    <div class="dashbord">
    <?php
    echo "<h1>WELCOME $username </h1>
    <p>Username:$username</p>
    <p>Email:$email</p>
    ";
    
    ?>
    <a href="index.php?action=logout" class="btn-lg">Logout</a>
    </div>



    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
</body>
</html>