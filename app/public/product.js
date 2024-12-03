/* CLIENT SIDE CODE FOR product.html */

// Extract product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

function fetchProductDetails() {
    fetch(`/api/listings/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch product details");
            }
            return response.json();
        })
        .then(product => {
            if (product) {
                // Display product details
                const productDetails = document.getElementById("productDetails");
                productDetails.innerHTML = `
                    <h2>${product.title}</h2>
                    <p><strong>Description:</strong> ${product.description}</p>
                    <p><strong>Price:</strong> $${product.price}</p>
                    <p><strong>Date Listed:</strong> ${new Date(product.listing_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${product.status}</p>
                `;

                // Display product images
                const productImages = document.getElementById("productImages");
                if (product.photos && product.photos.length > 0) {
                    product.photos.forEach(photoUrl => {
                        const img = document.createElement("img");
                        img.src = `/${photoUrl}`;
                        img.alt = `${product.title}`;
                        img.className = "product-image"; // Add a class for styling
                        productImages.appendChild(img);
                    });
                } else {
                    productImages.innerHTML = "<p>No images available for this product.</p>";
                }
            } else {
                document.getElementById("productDetails").innerHTML = "<p>Product not found.</p>";
            }
        })
        .catch(error => {
            console.error("Error fetching product details:", error);
            document.getElementById("productDetails").innerHTML = "<p>Error loading product details.</p>";
        });
}

// Fetch product details on page load
if (productId) {
    fetchProductDetails();
} else {
    document.getElementById("productDetails").innerHTML = "<p>No product ID provided.</p>";
}
