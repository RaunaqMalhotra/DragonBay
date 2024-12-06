/* CLIENT SIDE CODE FOR product.html */

let buyer_username = '';
let room = '';
let seller_username = '';

// Extract product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");
const button = document.querySelector('.contact-seller');

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
                seller_username = product.seller_username;
                buyer_username = product.account_username;
                console.log('Seller:', seller_username);
                console.log('Buyer:', buyer_username);
                room = buyer_username+'_'+seller_username;

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

if (button) {
    button.addEventListener('click', () => {
        //TODO: redirection should not happen if any of user is undefined
        window.location.href = `chat.html?room=${room}&current_user=${buyer_username}&other_user=${seller_username}`;
    });
}