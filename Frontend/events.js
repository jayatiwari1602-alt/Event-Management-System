document.querySelectorAll(".btn-warning").forEach(button => {
    button.addEventListener("click", function() {
        window.location.href = "booking.html";
    });
});

// Live Event Search Filter
const searchInput = document.querySelector("input[placeholder*='Search']");
if (searchInput) {
    searchInput.addEventListener("input", function(e) {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll(".event-card").forEach(card => {
            const title = card.querySelector("h4").innerText.toLowerCase();
            const location = card.querySelector("p").innerText.toLowerCase();
            const parentCol = card.closest(".col-md-4");
            if (parentCol) {
                if (title.includes(query) || location.includes(query)) {
                    parentCol.style.display = "block";
                } else {
                    parentCol.style.display = "none";
                }
            }
        });
    });
}