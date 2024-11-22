const socket = new io("ws://localhost:3500");

const buyer_username = '';
let room_id = '';
let seller_username = '';
const productDetails = document.getElementById("productDetails");
const button = document.querySelector('.contact-seller');

async function fetchProduct() {
    try {
        const response = await fetch(`/api/listings/${productId}`);
        const product = await response.json();

        if (product) {
            seller_username = product.seller_username;
            buyer_username = product.account_username;
            productDetails.innerHTML = `
                <h1>${product.title}</h1>
                <h2>${product.price}</h2>
                <div class="product-description">
                    <p>${product.description}</p>
                    <p><strong>Date Listed:</strong> ${new Date(product.listing_date).toLocaleDateString()}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Status:</strong> ${product.status}</p>
                </div>
                <h3>Sold by: ${seller_username}</h3>
            `;
            room_id = buyer_username+seller_username;
        } else {
            productDetails.innerHTML = "<p>Product not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        productDetails.innerHTML = "<p>Error loading product details.</p>";
    }
}


button.addEventListener('click', () => {
    window.location.href = `chat.html?room=${room_id}&username=${buyer_username}&seller=${seller_username}`;
});