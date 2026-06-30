document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Login Successful!");
    window.location.href = "dashboard.html";
});