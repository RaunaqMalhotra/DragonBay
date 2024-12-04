const socket = io("ws://localhost:3000");

let chatRoom = '';
let userName = '';
let otherUser_username = '';
let msgInput = document.querySelector('#message');
const user_activity = document.querySelector('.user_activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    //TODO: add server check to see if a room exists with that unique username combo in either order and update chatRoom accordingly
    chatRoom = params.get('room');
    userName = params.get('current_user');
    otherUser_username = params.get('other_user');
    enterRoom(new Event('submit'));
}

let activityTimer;

function sendMessage(event) {
    event.preventDefault();
    console.log('sendMessage called');
    if (userName && msgInput.value && chatRoom) {
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
        postElement.className = 'post post--left';
    }

    //message sent by receiver
    if (name !== userName && name !== 'Admin') {
        postElement.className = 'post post--right';
    }

    if (name !== 'Admin') {
        postElement.innerHTML = `
            <div class = "post__header ${name === userName ? 'post__header--user' : 'post__header--reply'}">
            <span class = "post_header--name">${name}</span>
            <span class = "post_header--time">${formattedTime}</span>
            </div>
            <div class="post__text">${text}</div>`;
    } else {
        postElement.innerHTML = `<div class="post__text">${text}</div>`;
    }
    chatDisplay.appendChild(postElement);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

async function fetchChatHistory() {
    try {
        const response = await fetch(`messages/chat_history/${chatRoom}`);
        const messages = await response.json();

        if (messages) {
            for (let message of messages) {
                let name = message.sender;               
                let time = message.message_timestamp;
                let text = message.message_text;
            
                displayMessage(name, text, time);
            }
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        document.querySelector('.message-container').innerHTML = `<p class="message-preview-none">Error loading messages.</p>`;
    }
}

//listen for messages
socket.on("message", (data) => {
    console.log('Received message:', data);
    user_activity.textContent = '';
    displayMessage(data.name, data.text, data.time);
});

socket.on("activity", (name) => {
    console.log(`${name} is typing...`);
    user_activity.textContent = `${name} is typing...`;

    //clear after 2 seconds
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        user_activity.textContent = "";
    }, 2000);
});

socket.on('userList', ({users}) => {
    console.log('Received user list:', users);
});

function updateList(element, title, items) {
    console.log(`Updating list: ${title}`, items);
    element.textContent = '';
    if (items) {
        element.innerHTML = `<em>${title}</em>`;
        items.forEach((item, i) => {
            if (item) {
                element.textContent += ` ${item.name || item}${i < items.length - 1 ? ',' : ''}`;
            }
        });
    }
}

window.onload = function() {
    fetchChatHistory();
};