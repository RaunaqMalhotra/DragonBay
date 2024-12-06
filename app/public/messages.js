//TODO: Ensure message icon in html is href with username in query string
let username;

async function fetchUsername() {
    try {
        const response = await fetch(`/api/username`);
        const data = await response.json();
        console.log('Username:', data);
        if (response.ok) {
            username = data.username;
            fetchRecentMessages();
        } else {
            console.error('Failed to fetch username:', data.error);
        }
    } catch (error) {
        console.error('Error fetching username:', error);
    }
}

const message_container = document.querySelector('.message-container');

async function fetchRecentMessages() {
    try {
        const response = await fetch(`/messages/recent`);
        const messages = await response.json();

        if (messages.length === 0) {
            console.log('No chats started.');
            noChats = document.createElement('p');
            noChats.className = 'message-preview-none';
            noChats.innerHTML = 'No chats started.';
            message_container.appendChild(noChats);
            return;
        }

        messages.forEach(message => {
            const otherUser = message.sender === username ? message.receiver : message.sender;
            const chatUrl = `chat.html?room=${message.room}&current_user=${username}&other_user=${otherUser}`
            //convert timestamp to formatted date
            const date = new Date(message.message_timestamp);
            const formattedTime = date.toLocaleTimeString([], {
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit'
            });

            let recentMessageWrapper = document.createElement('a');
            recentMessageWrapper.href = chatUrl;

            let recentMessage = document.createElement('div');
            recentMessage.className = 'message-preview';
            recentMessage.innerHTML = `
                <div class="message-content">
                    <h3>${otherUser}</h3>
                    <p class="message-preview-text">${message.message_text}</p>
                </div>
                <p class="message-preview-time">${formattedTime}</p>
        `;

        recentMessageWrapper.appendChild(recentMessage);
        message_container.appendChild(recentMessageWrapper);
        });
    } catch (error) {
        console.error("Error fetching recent messages:", error);
    }
}

window.onload = fetchUsername;
