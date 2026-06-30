document.getElementById("bookingForm").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("🎉 Your Event Booking is Successful!");
    window.location.href = "dashboard.html";
});