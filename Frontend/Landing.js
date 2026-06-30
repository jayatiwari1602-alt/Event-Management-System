document.addEventListener("DOMContentLoaded", function () {
    EventProUI.toast("Welcome to EventPro! Discover amazing events today.", "info");
});

// Get Tickets Button
const ticketBtn = document.getElementById("ticketBtn");
if (ticketBtn) {
    ticketBtn.addEventListener("click", function () {
        window.location.href = "login.html";
    });
}

// Explore Events Button
const exploreBtn = document.getElementById("exploreBtn");
if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
        window.location.href = "events.html";
    });
}

// Learn More Button
const learnBtn = document.getElementById("learnBtn");
if (learnBtn) {
    learnBtn.addEventListener("click", function () {
        window.location.href = "about.html";
    });
}

