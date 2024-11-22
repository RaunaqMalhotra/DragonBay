const socket = new io("ws://localhost:3500");

let button = document.querySelector('.contact-seller');
let seller_username = 'bigboi';
let buyer_username = 'ccikick';
let room_id = 'room1';

button.addEventListener('click', () => {
    /* console.log('Contact seller clicked');
    //hardcode adding the seller name, create a room id, put the seller and buyer in the room
    socket.emit('enterRoom', {
        name: seller_username,
        room: room_id
    });*/

    window.location.href = `index.html?room=${room_id}&username=${buyer_username}`;
})