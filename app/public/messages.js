//TODO: Ensure message icon in html is href with username in query string
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

async function fetchAllChats(params) {
    try{
        const message_container = document.querySelector('.message-container');
        const response = await fetch(`messages/${username}`);
        const messages = await response.json();

        if (messages) {
            for (let message of messages.rows) {
                let receiver = message.receiver;
                let time = message.message_timestamp;
                let text = message.message_text;
            
                prevMessage = document.createElement('div');
                prevMessage.className = 'message-preview';

                prevMessage.innerHTML = `
                <h3>${receiver}</h3>
                <p>
                    <class="message-preview-time">${time}</span>
                    <class="message-preview-text">${text}</span>
                </p>
                `;

                message_container.appendChild(prevMessage);
            }
        } else {
            message_container.innerHTML = `<p class="message-preview-none">No chats found.</p>`;
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        document.querySelector('.message-container').innerHTML = `<p class="message-preview-none">Error loading messages.</p>`;
    }

}

