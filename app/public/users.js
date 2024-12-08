const serverUrl = "http://localhost:3000";

// Event listener for the signup form
const signupForm = document.getElementById("signup-form");
if (signupForm) {
signupForm.addEventListener("submit", async (e) => {
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
             const errorData = await response.json();
             alert(`Signup failed: ${errorData.error || "Try a different username."}`);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
}

// Event listener for the login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    console.log("user:", username);

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
            window.location.href = "http://localhost:3000/index.html";

        } else {
            alert("Login failed. Check your username and password.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
}

