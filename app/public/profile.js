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

async function fetchUserListings() {
    try {
        const response = await fetch('/api/user/listings'); 
        const listings = await response.json();
        const grid = document.getElementById("listingGrid");

        if (listings.length > 0) {
            listings.forEach(listing => {
                const card = document.createElement("div");
                card.className = "product-card";
                card.innerHTML = `
                    <a href="/product.html?id=${listing.listing_id}">
                        <h3>${listing.title}</h3>
                        <p>${listing.description}</p>
                        <p>Price: $${listing.price}</p>
                    </a>
                `;
                grid.appendChild(card);
            });
        } 
    } catch (error) {
        console.error("Error fetching user listings:", error);
        document.getElementById("userlistings").innerHTML = "<p>Error loading user listings.</p>";
    }
}
async function fetchUserBiddings() {
    try {
        const response = await fetch('api/user/biddings');
        const biddings = await response.json();
        const grid = document.getElementById("biddingGrid");

        if (biddings.length > 0) {
            biddings.forEach(bidding => {
                const card = document.createElement("div");
                card.className = "product-card";
                card.innerHTML = `
                    <a href="/product.html?id=${bidding.listing_id}">
                        <h3>${bidding.title}</h3>
                        <p>${bidding.description}</p>
                        <p>Price: $${bidding.price}</p>
                    </a>
                `;
                grid.appendChild(card);
            });
        } else {
            userBiddingsDiv.innerHTML = "<p>No biddings found.</p>";
        }
    } catch{
        console.error("Error fetching user biddings:", error);
        document.getElementById("userBiddings").innerHTML = "<p>Error loading user biddings.</p>";
    }
}

document.getElementById("profilePictureForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById("profilePicture");
    formData.append("profilePicture", fileInput.files[0]);
    try {
        const response = await fetch("/upload-profile-picture", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById("uploadMessage").textContent = "Profile picture uploaded successfully!";
            console.log("File path:", result.filePath);
        } else {
            document.getElementById("uploadMessage").textContent = "Failed to upload profile picture.";
        }
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        document.getElementById("uploadMessage").textContent = "Error uploading profile picture.";
    }
});
async function fetchProfilePicture() {
    try {
        const response = await fetch("/api/user/profile-picture"); // API endpoint to get the profile picture path
        const result = await response.json();
        if (response.ok) {
            const profilePicturePath = result.profilePicturePath;
            const profilePictureImg = document.getElementById("profilePictureDisplay");
            profilePictureImg.src = `/${profilePicturePath}`; // Set the src to the relative path
        } else {
            console.error(result.message);
            document.getElementById("profilePictureDisplay").src = "/default-profile.png"; // Default profile picture
        }
    } catch (error) {
        console.error("Error fetching profile picture:", error);
        document.getElementById("profilePictureDisplay").src = "/default-profile.png"; // Default profile picture
    }
}

fetchProfilePicture();
fetchUserListings();
fetchUserBiddings()