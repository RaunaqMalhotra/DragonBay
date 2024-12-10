// Dynamically load the navigation bar from navbar.html
document.addEventListener("DOMContentLoaded", function() {
    fetch("navbar.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load navbar");
            }
            return response.text();
        })
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            var menuBtn = document.getElementById("menuBtn");
            var sideNav = document.getElementById("sideNav");
            var menu = document.getElementById("menu");

            sideNav.style.right = "-250px";

            menuBtn.onclick = function() {
                if (sideNav.style.right == "-250px") {
                    sideNav.style.right = "0px";
                    menu.src = "images/close.png";
                } else {
                    sideNav.style.right = "-250px";
                    menu.src = "images/menu.png";
                }
            };

            const logoutLink = document.querySelector('a[href="/logout"]');
            if (logoutLink) {
                logoutLink.addEventListener("click", function (event) {
                    event.preventDefault(); 

                    // Send a POST request to the logout endpoint
                    fetch("/logout", {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })
                        .then(response => {
                            if (response.ok) {
                                console.log("Logout successful");
                                window.location.href = "/welcome.html";
                            } else {
                                console.error("Logout failed");
                                alert("Logout failed. Please try again.");
                            }
                        })
                        .catch(error => {
                            console.error("Error during logout:", error);
                            alert("An error occurred while logging out.");
                        });
                });
            }
        })
        .catch(error => console.error("Error loading navbar:", error));
});


