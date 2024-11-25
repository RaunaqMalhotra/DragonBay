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
        const userListingsDiv = document.getElementById("userlistings");
        if (listings.length > 0) {
            userListingsDiv.innerHTML = listings.map(listing => `
                <div class="listing">
                    <h3>${listing.title}</h3>
                    <p><strong>Description:</strong> ${listing.description}</p>
                    <p><strong>Price:</strong> $${listing.price}</p>
                    <p><strong>Date Listed:</strong> ${new Date(listing.listing_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${listing.status}</p>
                </div>
            `).join("");
        } else {
            userListingsDiv.innerHTML = "<p>No listings found.</p>";
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
        const userBiddingsDiv = document.getElementById("userBiddings");
        if (biddings.length > 0) {
            userBiddingsDiv.innerHTML = biddings.map(bidding =>`
                <div class = "bidding">
                    <h3> ${bidding.title}</h3>
                    <p><strong>Description:</strong> ${bidding.description}</p>
                    <p><strong>Minimum bid:</strong> ${bidding.minimum_bid}
                    <p><strong>Date Listed:</strong> ${new Date(bidding.listing_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${bidding.status}</p>
                    <p><strong>Auction Ends:</strong> ${new Date(bidding.auction_end_date).toLocaleDateString()}</p>
                </div>`).join("");
        } else {
            userBiddingsDiv.innerHTML = "<p>No biddings found.</p>";
        }
    } catch{
        console.error("Error fetching user biddings:", error);
        document.getElementById("userBiddings").innerHTML = "<p>Error loading user biddings.</p>";
    }
}
fetchUserListings();
fetchUserBiddings()