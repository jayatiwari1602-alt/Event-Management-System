let eventsList = [];

async function fetchEvents() {
    const container = document.getElementById("eventsContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-warning" role="status">
                <span class="visually-hidden">Loading events...</span>
            </div>
            <p class="mt-2 text-secondary">Fetching upcoming events...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/events`);
        const data = await response.json();

        if (response.ok) {
            eventsList = data.data || data; // handle both wrapped and raw response formats
            renderEvents(eventsList);
        } else {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Failed to load events: ${data.error?.message || "Server Error"}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error("Fetch events error:", err);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">Unable to connect to backend server. Make sure it is running on port 4000.</p>
            </div>
        `;
    }
}

function renderEvents(events) {
    const container = document.getElementById("eventsContainer");
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-secondary">No events found matching your criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map((event, index) => {
        const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }) : "Date TBA";

        // Use standard unsplash placeholders if bannerUrl is empty or placeholder-ish
        const imgUrl = event.bannerUrl || `https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80&rand=${index}`;

        return `
            <div class="col-md-4 mb-4">
                <div class="card event-card h-100 bg-dark text-white border-0 shadow-lg">
                    <img src="${imgUrl}" class="card-img-top" alt="${event.title}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h4 class="card-title fw-bold text-warning">${event.title}</h4>
                        <p class="card-text text-secondary mb-1">📍 ${event.venueName || "Location TBA"}</p>
                        <p class="card-text text-secondary mb-3">📅 ${dateStr}</p>
                        <div class="mt-auto">
                            <button class="btn btn-warning w-100 fw-bold" onclick="viewEventDetails('${event.id}')">View Details</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function viewEventDetails(eventId) {
    window.location.href = `event-detail.html?id=${eventId}`;
}

// Search filtering
const searchInput = document.querySelector("input[placeholder*='Search']");
if (searchInput) {
    searchInput.addEventListener("input", function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = eventsList.filter(event => {
            const title = (event.title || "").toLowerCase();
            const location = (event.venueName || "").toLowerCase();
            return title.includes(query) || location.includes(query);
        });
        renderEvents(filtered);
    });
}

// Initial fetch on load
document.addEventListener("DOMContentLoaded", fetchEvents);