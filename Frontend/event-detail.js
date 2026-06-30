let currentEventId = null;

async function loadEventDetail() {
    // Extract ID from URL query param
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("id");

    if (!eventId) {
        // Fallback or show error
        document.getElementById("eventTitle").innerText = "Event Not Found";
        document.getElementById("eventDescription").innerText = "No valid event ID was provided in the URL.";
        return;
    }

    currentEventId = eventId;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        const data = await response.json();

        if (response.ok) {
            const event = data.data || data; // handle wrapped response
            
            document.getElementById("eventTitle").innerText = event.title;
            document.getElementById("eventDescription").innerText = event.description || "No description provided.";
            
            const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric"
            }) : "TBA";
            document.getElementById("eventDate").innerText = dateStr;
            
            const timeStr = event.startTime ? `${event.startTime} - ${event.endTime || ""}` : "TBA";
            document.getElementById("eventTime").innerText = timeStr;
            
            document.getElementById("eventLocation").innerText = event.venueName || "TBA";
            document.getElementById("eventPrice").innerText = event.price === 0 ? "Free" : `₹${event.price}`;
            
            // Available seats
            const spotsLeft = event.spotsLeft !== null ? event.spotsLeft : (event.capacity || "Unlimited");
            document.getElementById("eventSeats").innerText = spotsLeft;

            // Update banner bannerUrl if it exists
            if (event.bannerUrl) {
                document.getElementById("eventBanner").src = event.bannerUrl;
            } else {
                document.getElementById("eventBanner").src = `https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80`;
            }

            // Enable booking button
            const bookBtn = document.getElementById("bookBtn");
            bookBtn.disabled = false;
        } else {
            document.getElementById("eventTitle").innerText = "Error Loading Event";
            document.getElementById("eventDescription").innerText = data.error?.message || "Failed to query details.";
        }
    } catch (err) {
        console.error("Load event detail error:", err);
        document.getElementById("eventTitle").innerText = "Connection Error";
        document.getElementById("eventDescription").innerText = "Could not connect to the backend server.";
    }
}

document.getElementById("bookBtn").addEventListener("click", async function() {
    if (!currentEventId) return;

    if (!isLoggedIn()) {
        const proceed = await EventProUI.confirm(
            "Authentication Required",
            "You need to log in to book a ticket. Would you like to log in now?"
        );
        if (proceed) {
            window.location.href = `login.html?redirect=event-detail.html?id=${currentEventId}`;
        }
    } else {
        EventProUI.toast("Opening booking form...", "info");
        setTimeout(() => {
            window.location.href = `booking.html?id=${currentEventId}`;
        }, 800);
    }
});

// Load details on document ready
document.addEventListener("DOMContentLoaded", loadEventDetail);