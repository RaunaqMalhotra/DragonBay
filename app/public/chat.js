document.addEventListener('DOMContentLoaded', () => {
    const socket = io(window.location.origin);

    let chatRoom = '';
    let userName = '';
    let otherUserUsername = '';
    let msgInput = document.querySelector('#message');
    const profileNameDisplay = document.getElementById('profileNameDisplay');
    const userActivity = document.querySelector('.user_activity');
    const chatDisplay = document.querySelector('.chat-display');

    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        //TODO: add server check to see if a room exists with that unique username combo in either order and update chatRoom accordingly
        chatRoom = params.get('room');
        userName = params.get('current_user');
        otherUserUsername = params.get('other_user');
        enterRoom(new Event('submit'));
    }

    let activityTimer;

    function canSendMessage() {
        return userName && msgInput.value && chatRoom;
    }

    function sendMessage(event) {
        event.preventDefault();
        console.log('sendMessage called');
        if (canSendMessage()) {
            console.log(`Sending message: ${msgInput.value} from ${userName}`);
            socket.emit('message', {
                name: userName,
                text: msgInput.value
            });
            msgInput.value = '';
        }
        msgInput.focus();
    }

    function enterRoom(event) {
        event.preventDefault();
        console.log('enterRoom called');
        if (userName && chatRoom) {
            console.log(`${userName} entering room: ${chatRoom}`);
            socket.emit('enterRoom', {
                name: userName,
                room: chatRoom
            });
        }
    }

    function setupEventListeners() {
        document.querySelector('.form-msg').addEventListener('submit', sendMessage);

        msgInput.addEventListener('keypress', () => {
            console.log(`${userName} is typing...`);
            socket.emit('activity', userName);
        });
    }

    setupEventListeners();

    function displayMessage(name, text, time) {
        console.log('Displaying message:', {name, text, time});
        let postElement = document.createElement('li');
        postElement.className = 'post';

        //convert timestamp to formatted date
        const date = new Date(time);
        const formattedTime = date.toLocaleTimeString([], {
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
        });

        //message sent by sender
        if (name === userName) {
            postElement.className = 'post--left';
        }

        //message sent by receiver
        if (name !== userName) {
            if (name !== 'Admin') {
                postElement.className = 'post--right';
                postElement.innerHTML = `<div class = "message-header">
                    <span class = "post_header--name">${name}</span>
                    <span class = "post_header--time">${formattedTime}</span>
                    </div>
                    <div class="post__text">${text}</div>`;
            } else {
                postElement.innerHTML = `<div class="post__text">${text}</div>`;
            }
        } else {
            postElement.className = 'post--left';
            postElement.innerHTML = `<div class = "message-header">
                <span class = "post_header--name">${name}</span>
                <span class = "post_header--time">${formattedTime}</span>
                </div>
                <div class="post__text">${text}</div>`;
        }
        chatDisplay.appendChild(postElement);
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    async function fetchChatHistory() {
        try {
            const response = await fetch(`messages/chat_history/${chatRoom}`);
            const messages = await response.json();

            if (messages && messages.length > 0) {
                otherUserUsername = messages[0].sender === userName ? messages[0].receiver : messages[0].sender;
                for (let message of messages) {
                    let name = message.sender;               
                    let time = message.message_timestamp;
                    let text = message.message_text;
                
                    displayMessage(name, text, time);
                }
                if (otherUserUsername) {
                    fetchProfilePicture(otherUserUsername); // Use the function here
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            chatDisplay.innerHTML = '';
            chatDisplay.innerHTML = `<p class="message-preview-none">Error loading messages.</p>`;
            console.log('Error fetching messages:', error);
        }
    }

    async function fetchProfilePicture(username) {
        try {
            profileNameDisplay.textContent = otherUserUsername || "Unknown User";
            const endpoint = username ? `/api/user/profile-picture?other_user=${username}` : "/api/user/profile-picture";
            const response = await fetch(endpoint);
            const result = await response.json();
            if (response.ok) {
                const profilePicturePath = result.profilePicturePath;
                const profilePictureImg = document.getElementById("profilePictureDisplay");
                if (profilePictureImg) {
                    profilePictureImg.src = `/${profilePicturePath}`; // Set the src to the relative path
                } else {
                    console.error("Profile picture element not found.");
                }
            } else {
                console.error(`Error fetching profile picture: ${result.message}`);
                const profilePictureImg = document.getElementById("profilePictureDisplay");
                if (profilePictureImg) {
                    profilePictureImg.src = "images/default-profile.png"; // Default profile picture
                }
            }
        } catch (error) {
            console.error("Error fetching profile picture:", error);
            const profilePictureImg = document.getElementById("profilePictureDisplay");
            if (profilePictureImg) {
                profilePictureImg.src = "images/default-profile.png"; // Default profile picture
            }
        }
    }

    //listen for messages
    socket.on("message", (data) => {
        console.log('Received message:', data);
        userActivity.textContent = '';
        displayMessage(data.name, data.text, data.time);
    });

    socket.on("activity", (name) => {
        console.log(`${name} is typing...`);
        userActivity.textContent = `${name} is typing...`;

        //clear after 2 seconds
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            userActivity.textContent = "";
        }, 2000);
    });

    socket.on('userList', ({users}) => {
        console.log('Received user list:', users);
    });

    window.onload = async function() {
        try {
            await fetchChatHistory();
            if (otherUserUsername) {
                await fetchProfilePicture(otherUserUsername);
            } else {
                console.warn('otherUserUsername is not set.');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    };
});
