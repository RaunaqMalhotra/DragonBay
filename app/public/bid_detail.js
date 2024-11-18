/* 
CLIENT side code for bid_detail.html
*/

// Extract auction ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const auctionId = urlParams.get("id");
console.log("id is", auctionId);

// Fetch auction details
function fetchAuctionDetails() {
    fetch(`/auction/${auctionId}`)
    .then(response => response.json())
    .then(auction => {
        let auctionDetails = document.getElementById("auctionDetails");
        if (auction.error) {
            auctionDetails.innerHTML = `<p>${auction.error}</p>`;
            return;
        }
        auctionDetails.innerHTML = `
        <h3>${auction.title}</h3>
        <p>${auction.description}</p>
        <p>Minimum Bid: $${auction.minimum_bid}</p>
        <p>Ends: ${new Date(auction.auction_end_date).toLocaleString()}</p>
        `;
    })
    .catch(error => {
        console.error("Error fetching auction details:", error);
        document.getElementById("auctionDetails").innerHTML = "<p>Error loading auction details.</p>";
    });
}

// Load auction details and bids
fetchAuctionDetails();
