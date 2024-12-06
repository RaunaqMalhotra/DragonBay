/* 
CLIENT side code for bid_detail.html
*/

const urlParams = new URLSearchParams(window.location.search);
const auctionId = urlParams.get('id');

// Connect to Socket.IO
const socket = io("ws://localhost:3000");

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
});

socket.on('disconnect', () => {
    console.warn('Disconnected from server. Attempting to reconnect...');
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
});

// Fetch and display auction details
function fetchAuctionDetails() {
    fetch(`/auction/${auctionId}`)
        .then(response => response.json())
        .then(auction => {
            let auctionDetails = document.getElementById('auctionDetails');
            let bidList = document.getElementById('bidList');
            let auctionImages = document.getElementById('auctionImages');

            if (auction.error) {
                auctionDetails.innerHTML = `<p>${auction.error}</p>`;
                document.getElementById('bidForm').style.display = 'none';
                return;
            }

            // Hide bid form if auction has ended
            if (new Date() > new Date(auction.auction_end_date)) {
                document.getElementById('bidForm').style.display = 'none';
                showMessage('error', 'This auction has ended.');
            }

            const username = auction.username;
            console.log(username);

            // Display auction details
            auctionDetails.innerHTML = `
                <h3>${auction.title}</h3>
                <p>${auction.description}</p>
                <p id="minimumBid" data-value="${auction.minimum_bid}">Minimum Bid: $${auction.minimum_bid}</p>
                <p>Ends: ${new Date(auction.auction_end_date).toLocaleString()}</p>
            `;

            // Display auction images
            if (auction.photos && auction.photos.length > 0) {
                auction.photos.forEach(photoUrl => {
                    const img = document.createElement("img");
                    img.src = `/${photoUrl}`;
                    img.alt = `${auction.title}`;
                    img.className = "auction-image"; // Add a class for styling
                    auctionImages.appendChild(img);
                });
            } else {
                auctionImages.innerHTML = "<p>No images available for this auction.</p>";
            }

            // Display current bids
            if (auction.bids && auction.bids.length > 0) {
                auction.bids.forEach(bid => {
                    let listItem = document.createElement('li');
                    listItem.textContent = `${username}: $${bid.bid_amount}`;
                    bidList.appendChild(listItem);
                });
            } else {
                bidList.innerHTML = "<li>No bids yet</li>";
            }
        })
        .catch(error => {
            console.error('Error fetching auction details:', error);
            document.getElementById('auctionDetails').innerHTML = '<p>Error loading auction details.</p>';
        });
}

// Handle real-time bid updates
socket.on('bid-update', (bid) => {
    if (bid.listing_id === parseInt(auctionId)) {
        updateBidList(bid);
    }
});

function updateBidList(bid) {
    const bidList = document.getElementById('bidList');
    const listItem = document.createElement('li');
    listItem.textContent = `${bid.username}: $${bid.bid_amount}`;
    bidList.prepend(listItem);
}

// Submit bid form
document.getElementById('bidForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    const bidAmount = parseFloat(document.getElementById('bidAmount').value);

    submitButton.disabled = true;

    fetch('/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: auctionId, bidAmount })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('success', 'Bid placed successfully!');
            document.getElementById('bidForm').reset();
            // Clear the message after 5 seconds
            setTimeout(() => {
                showMessage('', ''); // Clear the message
            }, 3000);
        } else {
            showMessage('error', result.message);
        }
    })
    .catch(error => {
        console.error('Error placing bid:', error);
        showMessage('error', 'Failed to place bid.');
    })
    .finally(() => {
        submitButton.disabled = false;
    });
});

function showMessage(type, text) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = type === 'success' ? 'success' : 'error';
}

fetchAuctionDetails();