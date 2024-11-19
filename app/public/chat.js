const socket = new io("ws://localhost:3500");

let msgInput = document.querySelector('#message');
let userName = document.querySelector('#name');
let chatRoom = document.querySelector('#room');
const user_activity = document.querySelector('.user_activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    chatRoom.value =  params.get('room');
    userName.value = params.get('username');
    enterRoom(new Event('submit'));
}

let activityTimer;

function sendMessage(event) {
    event.preventDefault();
    console.log('sendMessage called');
    if (userName.value && msgInput.value && chatRoom.value) {
        console.log(`Sending message: ${msgInput.value} from ${userName.value}`);
        socket.emit('message', {
            name: userName.value,
            text: msgInput.value
        });
        msgInput.value = '';
    }
    msgInput.focus();
}

function enterRoom(event){
    event.preventDefault();
    console.log('enterRoom called');
    if (userName.value && chatRoom.value) {
        console.log(`${userName.value} entering room: ${chatRoom.value}`);
        socket.emit('enterRoom', {
            name: userName.value,
            room: chatRoom.value
        });
    }
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage);

document.querySelector('.form-join').addEventListener('submit', enterRoom);

msgInput.addEventListener('keypress', () => {
    console.log(`${userName} is typing...`);
    socket.emit('activity', userName);
});

//listen for messages
socket.on("message", (data) => {
    console.log('Received message:', data);
    user_activity.textContent = '';
    const {name, text, time} = data;
    let postElement = document.createElement('li');
    postElement.className  = 'post';

    //message sent by sender
    if (name === userName.value) {
        postElement.className = 'post post--left'; 
    }

    //message sent by receiver
    if (name !== userName.value && name !== 'Admin') {
        postElement.className = 'post post--right';
    }

    if (name !== 'Admin') {
        postElement.innerHTML = `
            <div class = "post__header ${name === userName ? 'post__header--user' : 'post__header--reply'}">
            <span class = "post_header--name">${name}</span>
            <span class = "post_header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>`;
    } else {
        postElement.innerHTML = `<div class="post__text">${text}</div>`;
    }
    document.querySelector('.chat-display').appendChild(postElement);

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on("activity", (name) => {
    console.log(`${name} is typing...`);
    user_activity.textContent = `${name} is typing...`;

    //clear after 3 seconds
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        user_activity.textContent = "";
    }, 2000);
});

socket.on('userList', ({users}) => {
    console.log('Received user list:', users);
    showUsers(users);
});

socket.on('roomList', ({rooms}) => {
    console.log('Received room list:', rooms);
    showRooms(rooms);
});

function updateList(element, title, items) {
    console.log(`Updating list: ${title}`, items);
    element.textContent = '';
    if (items) {
        element.innerHTML = `<em>${title}</em>`;
        items.forEach((item, i) => {
            if (item) {
                element.textContent += ` ${item.name || item}`;
                element.textContent += 1 < i < items.length - 1 ? ',' : '';
            }
        });
    }
}

function showUsers(users) {
    updateList(usersList, `Users in ${chatRoom.value}:`, users);
}

function showRooms(rooms) {
    updateList(roomList, 'Active Rooms:', rooms);
}
