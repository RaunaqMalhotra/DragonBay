// Extract product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

async function fetchProduct() {
    try {
        const response = await fetch(`/api/listings/${productId}`);
        const product = await response.json();
        const productDetails = document.getElementById("productDetails");

        if (product) {
            productDetails.innerHTML = `
                <h2>${product.title}</h2>
                <p><strong>Description:</strong> ${product.description}</p>
                <p><strong>Price:</strong> $${product.price}</p>
                <p><strong>Date Listed:</strong> ${new Date(product.listing_date).toLocaleDateString()}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Status:</strong> ${product.status}</p>
            `;
        } else {
            productDetails.innerHTML = "<p>Product not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        document.getElementById("productDetails").innerHTML = "<p>Error loading product details.</p>";
    }
}

// Fetch product details on page load
if (productId) {
    fetchProduct();
} else {
    document.getElementById("productDetails").innerHTML = "<p>No product ID provided.</p>";
}