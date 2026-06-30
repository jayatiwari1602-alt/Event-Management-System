document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if(email === "" || password === ""){
        EventProUI.toast("Please enter both email and password.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            EventProUI.toast("Login Successful! Redirecting...", "success");
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const redir = params.get("redirect");
                if (redir) {
                    window.location.href = redir;
                } else {
                    window.location.href = "dashboard.html";
                }
            }, 1000);
        } else {
            // Error
            const errMsg = data.error?.message || "Invalid email or password.";
            EventProUI.toast(errMsg, "error");
        }
    } catch (err) {
        console.error("Login error:", err);
        EventProUI.toast("Unable to connect to the server. Please try again later.", "error");
    }
});