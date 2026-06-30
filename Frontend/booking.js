let selectedEventId = null;

async function initBooking() {
    // 1. Force Login redirect
    if (!isLoggedIn()) {
        EventProUI.toast("Please log in to book this event.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
        return;
    }

    // 2. Prefill user profile info
    const user = getCurrentUser();
    if (user) {
        document.getElementById("bookingName").value = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        document.getElementById("bookingEmail").value = user.email || "";
    }

    // 3. Extract event ID from query parameters
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("id");

    if (!eventId) {
        document.getElementById("bookingEventTitle").innerText = "No Event Selected. Please choose an event first.";
        document.getElementById("bookingEventTitle").classList.add("text-danger");
        return;
    }

    selectedEventId = eventId;

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        const data = await response.json();

        if (response.ok) {
            const event = data.data || data;
            document.getElementById("bookingEventTitle").innerHTML = `
                Booking tickets for: <strong class="text-warning">${event.title}</strong><br>
                Price per ticket: <strong class="text-warning">${event.price === 0 ? "Free" : `₹${event.price}`}</strong>
            `;
            document.getElementById("confirmBtn").disabled = false;
        } else {
            document.getElementById("bookingEventTitle").innerText = "Failed to load selected event details.";
            document.getElementById("bookingEventTitle").classList.add("text-danger");
        }
    } catch (err) {
        console.error("Load booking event details error:", err);
        document.getElementById("bookingEventTitle").innerText = "Could not connect to backend server.";
    }
}

document.getElementById("bookingForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!selectedEventId) {
        EventProUI.toast("No event selected.", "error");
        return;
    }

    const ticketsCount = document.getElementById("bookingTickets").value;
    const paymentMethod = document.getElementById("bookingPayment").value;

    if (!paymentMethod) {
        EventProUI.toast("Please select a payment method.", "error");
        return;
    }

    EventProUI.toast("Processing your booking...", "info");

    try {
        const response = await fetch(`${API_BASE}/registrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },
            body: JSON.stringify({
                eventId: selectedEventId
                // Optional: ticketTypeId could be added if ticketing types were supported in UI
            })
        });

        const data = await response.json();

        if (response.ok) {
            EventProUI.toast("🎉 Your Event Booking is Successful!", "success");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            const errMsg = data.error?.message || "Booking registration failed. Please try again.";
            EventProUI.toast(errMsg, "error");
        }
    } catch (err) {
        console.error("Booking submit error:", err);
        EventProUI.toast("Unable to connect to the server. Please try again later.", "error");
    }
});

// Initialize form
document.addEventListener("DOMContentLoaded", initBooking);