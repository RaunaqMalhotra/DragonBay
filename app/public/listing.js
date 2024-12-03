/*
CLIENT-SIDE CODE FOR listing.html
*/

document.getElementById("listingForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("itemName").value);
    formData.append("description", document.getElementById("itemDescription").value);
    formData.append("price", parseFloat(document.getElementById("itemPrice").value));
    const tags = document.getElementById("itemTags").value.split(" ");
    formData.append("tags", JSON.stringify(tags));

    const photos = document.getElementById("itemPhotos").files;
    for (let i = 0; i < photos.length; i++) {
        formData.append("photos", photos[i]);
    }

    fetch("/add-listing", {
        method: "POST",
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(result => {
                throw new Error(result.message || "Failed to submit listing.");
            });
        }
        return response.json();
    })
    .then(result => {
        document.getElementById("message").textContent = result.message;
        document.getElementById("listingForm").reset();
    })
    .catch(error => {
        console.error("Error submitting form:", error);
        document.getElementById("message").textContent = error.message || "Failed to submit listing.";
    });
});
