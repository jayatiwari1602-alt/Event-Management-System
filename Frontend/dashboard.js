async function initDashboard() {
    // 1. Force Login redirect
    if (!isLoggedIn()) {
        EventProUI.toast("Please log in to view your dashboard.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
        return;
    }

    // 2. Personalize welcome header
    const user = getCurrentUser();
    if (user) {
        document.getElementById("welcomeUser").innerText = `Welcome Back, ${user.firstName || "User"} 👋`;
    }

    // 3. Load Stats & Events
    await Promise.all([
        loadRegistrations(),
        loadExploreEvents()
    ]);
}

async function loadRegistrations() {
    const bookedContainer = document.getElementById("bookedEventsContainer");
    const bookingsStat = document.getElementById("bookingsStat");

    try {
        const response = await fetch(`${API_BASE}/registrations/me`, {
            headers: authHeaders()
        });
        const data = await response.json();

        if (response.ok) {
            const regs = data.data || data; // handle wrapped response
            bookingsStat.innerText = regs.length;

            if (regs.length === 0) {
                bookedContainer.innerHTML = `
                    <div class="text-secondary w-100 py-3 text-center">
                        You haven't booked any events yet. <br>
                        <a href="events.html" class="text-warning fw-bold">Explore events and book your first ticket!</a>
                    </div>
                `;
            } else {
                bookedContainer.innerHTML = regs.map((reg, idx) => {
                    const event = reg.event || {};
                    const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short"
                    }) : "Date TBA";

                    return `
                        <div class="event-card">
                            <h3>🎟️ ${event.title || "Untitled Event"}</h3>
                            <p>📍 ${event.venueName || "Location TBA"} | 📅 ${dateStr}</p>
                            <p class="text-secondary mb-3" style="font-size: 13px;">Status: <strong class="text-warning">${reg.status}</strong> | Order ID: ${reg.orderId || "N/A"}</p>
                            <button class="btn btn-warning" onclick="viewEventDetails('${event.id}')">View Details</button>
                        </div>
                    `;
                }).join("");
            }
        } else {
            bookedContainer.innerHTML = `<div class="text-danger w-100 py-3 text-center">Error loading bookings.</div>`;
        }
    } catch (err) {
        console.error("Load registrations error:", err);
        bookedContainer.innerHTML = `<div class="text-danger w-100 py-3 text-center">Unable to load registered events.</div>`;
    }
}

async function loadExploreEvents() {
    const exploreContainer = document.getElementById("dashboardEventsContainer");
    const totalEventsStat = document.getElementById("totalEventsStat");

    try {
        const response = await fetch(`${API_BASE}/events`);
        const data = await response.json();

        if (response.ok) {
            const events = data.data || data;
            totalEventsStat.innerText = events.length;

            // Display top 3 events for exploration
            const top3 = events.slice(0, 3);
            if (top3.length === 0) {
                exploreContainer.innerHTML = `<div class="text-secondary w-100 py-3 text-center">No upcoming events available.</div>`;
            } else {
                exploreContainer.innerHTML = top3.map((event) => {
                    return `
                        <div class="event-card">
                            <h3>🎵 ${event.title}</h3>
                            <p>📍 ${event.venueName || "Location TBA"}</p>
                            <button class="btn btn-warning" onclick="viewEventDetails('${event.id}')">Explore</button>
                        </div>
                    `;
                }).join("");
            }
        } else {
            exploreContainer.innerHTML = `<div class="text-danger w-100 py-3 text-center">Error loading events.</div>`;
        }
    } catch (err) {
        console.error("Load explore events error:", err);
        exploreContainer.innerHTML = `<div class="text-danger w-100 py-3 text-center">Unable to load explore events.</div>`;
    }
}

function viewEventDetails(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

// Sidebar Navigation Wireframes
document.getElementById("dashboardBtn").addEventListener("click", function () {
    window.location.href = "dashboard.html";
});

document.getElementById("eventsBtn").addEventListener("click", function () {
    window.location.href = "events.html";
});

document.getElementById("bookingBtn").addEventListener("click", function () {
    // Redirect to events page where they can select and book
    window.location.href = "events.html";
});

document.getElementById("profileBtn").addEventListener("click", function () {
    EventProUI.toast("Profile settings are coming soon!", "info");
});

document.getElementById("aboutBtn").addEventListener("click", function () {
    window.location.href = "about.html";
});

document.getElementById("contactBtn").addEventListener("click", function () {
    window.location.href = "contact.html";
});

document.getElementById("logoutBtn").addEventListener("click", async function () {
    const confirmLogout = await EventProUI.confirm(
        "Confirm Logout",
        "Are you sure you want to log out of your session?"
    );
    if (confirmLogout) {
        logout();
    }
});

// Run initialization
document.addEventListener("DOMContentLoaded", initDashboard);