/* 
Client Side code for bidding product
*/
fetch("/auctions")
.then(response => response.json())
.then(auctions => {
    let grid = document.getElementById("auctionGrid");

    if (auctions.length === 0) {
        grid.innerHTML = "<p>No active auctions at the moment.</p>";
        return;
    }

    auctions.forEach(auction => {
        let card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `<a href="/bid_detail.html?id=${auction.listing_id}">
        <h3>${auction.title}</h3>
        <p>${auction.description}</p>
        <p>Minimum Bid: $${auction.minimum_bid}</p>
        <p>Ends: ${new Date(auction.auction_end_date).toLocaleString()}</p>
        </a>`;
        grid.appendChild(card);
    });
})
.catch(error => {
    console.error("Error fetching auctions:", error);
    document.getElementById("auctionGrid").innerHTML = "<p>Failed to load auctions. Please try again later.</p>";
});