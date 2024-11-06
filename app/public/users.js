// URL of the server (adjust if needed)
const serverUrl = "http://localhost:3000";

// Event listener for the signup form
document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
        const response = await fetch(`${serverUrl}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert("Signup successful! You are now logged in.");
            // You could redirect the user to a new page or display a welcome message
            window.location.href = "http://localhost:3000";

        } else {
            alert("Signup failed. Try a different username.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Event listener for the login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${serverUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert("Login successful!");
            // Redirect to a protected page or display a logged-in message
            window.location.href = "http://localhost:3000";

        } else {
            alert("Login failed. Check your username and password.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
