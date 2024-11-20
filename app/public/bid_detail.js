/* 
CLIENT side code for bid_detail.html
*/

const urlParams = new URLSearchParams(window.location.search);
const auctionId = urlParams.get('id');

// Dynamic User ID
const userId = localStorage.getItem('userId') || 1234;

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
fetchAuctionDetails();

function fetchAuctionDetails() {
    fetch(`/auction/${auctionId}`)
    .then(response => response.json())
    .then(auction => {
        const auctionDetails = document.getElementById('auctionDetails');
        if (auction.error) {
            auctionDetails.innerHTML = `<p>${auction.error}</p>`;
            document.getElementById('bidForm').style.display = 'none';
            return;
        }
        auctionDetails.innerHTML = `
            <h3>${auction.title}</h3>
            <p>${auction.description}</p>
            <p id="minimumBid" data-value="${auction.minimum_bid}">Minimum Bid: $${auction.minimum_bid}</p>
            <p>Ends: ${new Date(auction.auction_end_date).toLocaleString()}</p>
        `;
        /*
        if (new Date() > new Date(auction.auction_end_date)) {
            document.getElementById('bidForm').style.display = 'none';
            showMessage('error', 'This auction has ended.');
        }
        */
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
    listItem.textContent = `User ${bid.user_id}: $${bid.bid_amount}`;
    bidList.prepend(listItem);
}

// Submit bid form
document.getElementById('bidForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    const bidAmount = parseFloat(document.getElementById('bidAmount').value);

    const minBid = parseFloat(document.getElementById('minimumBid').dataset.value);
    const highestBid = parseFloat(document.getElementById('highestBid')?.dataset.value || 0);

    if (bidAmount < minBid || bidAmount <= highestBid) {
        showMessage('error', 'Bid must be higher than the current highest bid or minimum bid.');
        return;
    }

    submitButton.disabled = true;

    fetch('/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: auctionId, userId, bidAmount })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showMessage('success', 'Bid placed successfully!');
            document.getElementById('bidForm').reset();
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
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = type === 'success' ? 'success' : 'error';

    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = '';
    }, 3000);
}