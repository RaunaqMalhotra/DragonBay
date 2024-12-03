let allListings = []; // Store all fetched listings

async function fetchListings() {
    try {
        const response = await fetch("/api/listings");
        allListings = await response.json(); // Store fetched listings globally
        displayListings(allListings); // Display all listings initially
    } catch (error) {
        console.error("Error fetching listings:", error);
    }
}

function displayListings(listings) {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = ""; // Clear the grid
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

function filterListings() {
    const query = document.getElementById("searchBar").value.toLowerCase();
    const filteredListings = allListings.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        (listing.description && listing.description.toLowerCase().includes(query))
    );
    displayListings(filteredListings);
}

// Load listings on page load
window.onload = fetchListings;
