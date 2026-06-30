document.getElementById("registerForm").addEventListener("submit", async function(e){
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if(name === "" || email === "" || password === "" || confirmPassword === ""){
        EventProUI.toast("Please fill in all fields.", "error");
        return;
    }

    if(password !== confirmPassword){
        EventProUI.toast("Passwords do not match.", "error");
        return;
    }

    if(password.length < 6){
        EventProUI.toast("Password must be at least 6 characters.", "error");
        return;
    }

    // Split first and last name
    const spaceIndex = name.indexOf(" ");
    let firstName = name;
    let lastName = "";
    if (spaceIndex !== -1) {
        firstName = name.substring(0, spaceIndex);
        lastName = name.substring(spaceIndex + 1);
    }

    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            EventProUI.toast("Registration Successful! Redirecting to login...", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            // API Error
            const errMsg = data.error?.message || "Registration failed. Please try again.";
            EventProUI.toast(errMsg, "error");
        }
    } catch (err) {
        console.error("Signup error:", err);
        EventProUI.toast("Unable to connect to the server. Please try again later.", "error");
    }
});