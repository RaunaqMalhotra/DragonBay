let buyer_username = '';
let room = '';
let seller_username = '';

const productDetails = document.getElementById("product-details");
const button = document.querySelector('.contact-seller');

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

async function fetchProduct() {
    try {
        const response = await fetch(`/api/listings/${productId}`);
        const product = await response.json();
        console.log('Product data:', product);

        if (product) {
            seller_username = product.seller_username;
            buyer_username = product.account_username;
            console.log('Seller:', seller_username);
            console.log('Buyer:', buyer_username);
            room = buyer_username+'_'+seller_username;

            productDetails.innerHTML = 
            `<h1>${product.title}</h1>
                <h2>$${product.price}</h2>
                <div class="product-description">
                    <p>${product.description}</p>
                    <p><strong>Date Listed:</strong> ${new Date(product.listing_date).toLocaleDateString()}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Status:</strong> ${product.status}</p>
                    <h3>Sold by: ${seller_username}</h3>
                </div>
            `;
        } else {
            productDetails.innerHTML = "<p>Product not found.</p>";
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        productDetails.innerHTML = "<p>Error loading product details.</p>";
    }
}

window.onload = fetchProduct;

if (button) {
    button.addEventListener('click', () => {
        //TODO: redirection shpuld not happen if any of user is undefined
        window.location.href = `chat.html?room=${room}&current_user=${buyer_username}&other_user=${seller_username}`;
    });
}


