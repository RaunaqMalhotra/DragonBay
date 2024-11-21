/* 
CLIENT SIDE CODE FOR bidding.js
*/

let submitButton = document.getElementById("bidSubmit");

submitButton.addEventListener("click", function (event) {
    event.preventDefault();

    let formData = {
        name: document.getElementById("itemName").value,
        description: document.getElementById("itemDescription").value,
        minimumBid: parseFloat(document.getElementById("minBidPrice").value),
        minimumIncrease: parseFloat(document.getElementById("minBidIncrease").value),
        auctionEndDate: document.getElementById("auctionEndDate").value,
        photo: document.getElementById("itemPhoto").files[0] ? document.getElementById("itemPhoto").files[0].name : null
    };

    fetch("/add-bid-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        document.getElementById("message").textContent = result.message;
        if (result.success) document.getElementById("biddingForm").reset();
    })
    .catch(error => {
        console.error("Error submitting form:", error);
        document.getElementById("message").textContent = "Failed to submit listing.";
    });
});