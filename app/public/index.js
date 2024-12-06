document.getElementById("message-button").addEventListener("click", function() {
    window.location.href = "/messages.html";
});

async function fetchListings() {
    try {
        const response = await fetch("/api/listings");
        const listings = await response.json();
        const grid = document.getElementById("productGrid");

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
    } catch (error) {
        console.error("Error fetching listings:", error);
    }
}

// Load listings on page load
window.onload = fetchListings;