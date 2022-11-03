<?php 
require_once "header.php";
 if(isset($_POST["submit"]) && $_SERVER["REQUEST_METHOD"] == "POST"){
    $username = mysqli_escape_string($connect,$_POST["username"]);
    $email = mysqli_escape_string($connect,$_POST["email"]);
    $password= mysqli_escape_string($connect,$_POST["password"]);
    $error = "";
    $success = "";
 
 if(empty($username)){
 $error = "Please Input Username!";

 }else if(empty($email)){
 $error = "Please Input Email!";

 }else if(filter_var($email,FILTER_VALIDATE_EMAIL) == false){
 $error = "Please Input a Valid Email!";

 }else if(empty($password)){
 $error = "Please Input Password!";

 }else{
$query = mysqli_query($connect,"SELECT * FROM users WHERE username='$username'");
if(mysqli_num_rows($query) > 0){
$error = "Username already exist please try again!";

}else{
$query = mysqli_query($connect,"SELECT * FROM users WHERE email='$email'"); 
if(mysqli_num_rows($query) > 0){
$error = "Email already exist please try again!";

}else{
$passwordHash = password_hash($password,PASSWORD_DEFAULT); 
mysqli_query($connect,"INSERT INTO users(username,email,password)VALUE('$username','$email','$passwordHash')");
$success = "<h2>Register Success!</h2>";
header('Refresh: 2; url=login.php'); 

}  
}
    
 }
 }


?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.php">
    <title>Document</title>
</head>
<body>
    <form class="" action="register.php" method="POST">
    <div class="box">
        <div class="form">
            <h2>SIGN UP</h2>
            
            <?php
            if(!empty($error)){
            echo $error;
            }
            if(!empty($success)){
            echo $success;
            }
            ?>

            <div class="inputBox">
                <input type="text" required name="email">
                <span>Email</span>
                <i></i>
            </div>
            <div class="inputBox">
                <input type="text" name="username">
                <span>Username</span>
                <i></i>
            </div>
            <div class="inputBox">
                <input type="password" name="password">
                <span>Password</span>
                <i></i>
            </div>
            <div class="links">
                <a href="login.php">Login</a>
            </div>
            <input type="submit" name="submit" value="Register">
        </div>
    </div>
</form>
</body>
</html>