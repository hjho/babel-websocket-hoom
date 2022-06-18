const socket = io();

const divMain = document.getElementById("main");
const divRoom = document.getElementById("room");
divRoom.hidden = true;

const formMain = divMain.querySelector("form");

let roomName;

function setRoomTitle(count) {
    const h3 = divRoom.querySelector("h3");
    h3.innerText = `Room: ${roomName} (${count})`;
}
// 방 생성 및 참가!
formMain.addEventListener('submit', handleSubmitRoom);
function handleSubmitRoom(event) {
    event.preventDefault();
    const inputNick = formMain.querySelector("#nickname");
    const inputRoom = formMain.querySelector("#roomname");

    // 닉네임 설정.
    socket.emit("init_ninkname", inputNick.value);

    // 방 생성 or 참가
    roomName = inputRoom.value;
    // 첫번째는 임의의 이벤트이름.
    // 마지막은 Back-end에서 제어하는 함수.
    // 중간은 여러개 들어가도 상관 없음.
    socket.emit("room_join", roomName, afterJoinRoom);

    inputNick.value = "";
    inputRoom.value = "";
}
// 방 생성 및 참가 이후
function afterJoinRoom(count) {
    divMain.hidden = true;
    divRoom.hidden = false;
    
    setRoomTitle(count);

    const formRoom = divRoom.querySelector("form");
    formRoom.addEventListener("submit", handleSubmitMessage);
}
// 방 참가 이후 메시지 전송.
function handleSubmitMessage(event) {
    event.preventDefault();
    const inputMessage = document.getElementById('message');
    socket.emit("send_message", inputMessage.value, roomName, () => {
        addMessage(`Me: ${inputMessage.value}`);
        inputMessage.value = "";
    });
}
// Server => Client 방 참가 메시지.
socket.on("room_in", (user, count) => {
    setRoomTitle(count);
    addMessage(`${user}님이 참가하였습니다.`);
});
// Server => Client 방 퇴장 메시지.
socket.on("room_out", (user, count) => {
    setRoomTitle(count);
    addMessage(`${user}님이 퇴장하였습니다.`);
});
// Server => Client 메시지 전송.
socket.on("send_message", addMessage);

// 메시지 내용
function addMessage(message) {
    const ul = divRoom.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = message;
    ul.append(li);
}
// 채팅방 목록
socket.on("room_change", (rooms) => {
    const ul = divMain.querySelector("ul");
    ul.innerHTML = "";
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        ul.append(li);
    })
});
