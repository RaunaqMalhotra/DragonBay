async function fetchProfile() {
    try {
        const response = await fetch('/profile');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('username').textContent = data.username;
            document.getElementById('email').textContent = data.email;
        } else if (response.status === 403) {
            // Redirect to login page if not authorized
            window.location.href = '/';
        } else {
            alert("Failed to fetch profile details");
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

async function updatePassword(event) {
    event.preventDefault();
    const newPassword = document.getElementById('password').value;
    try {
        const response = await fetch('/profile/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });
        if (response.ok) {
            const data = await response.json();
            alert(data.message);
        } else {
            alert("Failed to update password");
        }
    } catch (error) {
        console.error("Error updating password:", error);
    }
}

window.onload = fetchProfile;
