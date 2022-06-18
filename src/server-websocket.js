import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();
 
app.set('view engine', 'pug');
app.set('views', __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_, res) => res.render("home"));
app.get("*", (_, res) => res.redirect("/"));

const server = http.createServer(app);
// server 인자는 필 수 아님.. http와 ws를 같이 하려고.
// 두 서버가 같은 서버였으면 좋겠어서.
// http 서버 위에 ws 서버
const wss = new WebSocket.Server({ server });

// Client들
const clients = [];
let clientsNumber = 0;

// Client와 연결이 끊겼을때
function onSocketClose() {
    console.log("Disconnencted from the Client ❌");
}

// Client에게 메시지 받았을 때
function onSocketMessage(message) {
    const data = JSON.parse(message.toString('utf8'));

    switch(data.type) {
        case"message":
            clients.forEach((client) => {
                if(client !== this) {
                    sendMessage(client, `${this.nickname}: ${data.payload}`);
                }
            });
            break;
        case "nickname":
            // "this" is client(WebSocket!!)
            let changeNickName = data.payload.toLowerCase().replaceAll(' ', '');
            if(changeNickName === "me") {
                data.payload = this.nickname;
            }
            clients.forEach((client) => {
                sendMessage(client, `${this.nickname}님이 ${data.payload}님으로 변경되었습니다.`);
            });
            this["nickname"] = data.payload;
            break;
    }
}

// Client에게 메시지 전송 할 때
function sendMessage(client, message) {
    client.send(message); 
}

// Client와 연결됐을 때
wss.on("connection", (socket) => {
    console.log("Connencted to Client ✅");
    
    socket["nickname"] = `Unknown${++clientsNumber}`;
    clients.push(socket);

    socket.send(`${socket.nickname}님! 반갑습니다.`); 

    socket.on("close", onSocketClose);

    socket.on("message", onSocketMessage);
});

// Run Server
const handleListen = () => console.log(`Listening on http://localhost:3000!`);
server.listen(3000, handleListen);