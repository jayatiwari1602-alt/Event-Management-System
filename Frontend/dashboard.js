// Welcome Message
window.onload = function () {
    alert("👋 Welcome to EventPro Dashboard!");
};

// Dashboard
document.getElementById("dashboardBtn").addEventListener("click", function () {
    window.location.href = "dashboard.html";
});

// Events
document.getElementById("eventsBtn").addEventListener("click", function () {
    window.location.href = "events.html";
});

// Bookings
document.getElementById("bookingBtn").addEventListener("click", function () {
    window.location.href = "booking.html";
});

// Profile
document.getElementById("profileBtn").addEventListener("click", function () {
    alert("Profile page is coming soon...");
});

// About
document.getElementById("aboutBtn").addEventListener("click", function () {
    window.location.href = "about.html";
});

// Contact
document.getElementById("contactBtn").addEventListener("click", function () {
    window.location.href = "contact.html";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", function () {
    let logout = confirm("Are you sure you want to logout?");
    if (logout) {
        window.location.href = "landing.html";
    }
});

// View Details Buttons
document.querySelectorAll(".btn-warning").forEach(function(button){
    button.addEventListener("click", function(){
        if(this.innerText === "View Details"){
            window.location.href = "event-details.html";
        }

        if(this.innerText === "Book Now"){
            window.location.href = "booking.html";
        }

        if(this.innerText === "Explore"){
            window.location.href = "events.html";
        }
    });
});