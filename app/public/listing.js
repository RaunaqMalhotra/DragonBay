/*
CLIENT-SIDE CODE FOR listing.html
*/

document.getElementById("listingForm").addEventListener("submit", function(event) {
    event.preventDefault();

    // Capture form data
    let itemName = document.getElementById("itemName").value;
    let itemDescription = document.getElementById("itemDescription").value;
    let itemPrice = parseFloat(document.getElementById("itemPrice").value);
    let itemTags = document.getElementById("itemTags").value.split(" ");
    let itemPhoto = document.getElementById("itemPhoto").files[0] ? document.getElementById("itemPhoto").files[0].name : null;

    // Create form data object to send to server
    let formData = {
        name: itemName,
        description: itemDescription,
        price: itemPrice,
        tags: itemTags,
        photo: itemPhoto
    };

    // Send data to server with fetch
    fetch("/add-listing", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === "Listing added successfully") {
            document.getElementById("message").textContent = "Listing added successfully!";
            document.getElementById("listingForm").reset();
        } else {
            document.getElementById("message").textContent = `Error: ${result.message}`;
        }
    })
    .catch(error => {
        console.error("Error submitting form:", error);
        document.getElementById("message").textContent = "Failed to submit listing.";
    });
});