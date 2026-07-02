document.getElementById("registerForm").addEventListener("submit", function(e){

    e.preventDefault();

    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    if(name=="" || email=="" || password=="" || confirmPassword==""){
        alert("Please fill all fields.");
    }
    else if(password !== confirmPassword){
        alert("Passwords do not match.");
    }
    else{
        alert("Registration Successful!");
    }

});