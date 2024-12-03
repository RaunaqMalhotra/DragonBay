/*
CLIENT SIDE CODE FOR bidding.html
*/

document.getElementById("biddingForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("itemName").value);
    formData.append("description", document.getElementById("itemDescription").value);
    formData.append("minimumBid", parseFloat(document.getElementById("minBidPrice").value));
    formData.append("minimumIncrease", parseFloat(document.getElementById("minBidIncrease").value));
    formData.append("auctionEndDate", document.getElementById("auctionEndDate").value);

    const photos = document.getElementById("itemPhotos").files;
    for (let i = 0; i < photos.length; i++) {
        formData.append("photos", photos[i]);
    }

    fetch("/add-bid-listing", {
        method: "POST",
        body: formData,
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            document.getElementById("message").textContent = result.message;
            document.getElementById("biddingForm").reset();
        } else {
            document.getElementById("message").textContent = `Error: ${result.message}`;
        }
    })
    .catch(error => {
        console.error("Error submitting form:", error);
        document.getElementById("message").textContent = "Failed to submit listing.";
    });
});
