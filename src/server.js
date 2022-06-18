import http from "http";
import {Server} from "socket.io";
import {instrument} from "@socket.io/admin-ui";
import express from "express";

const app = express();
 
app.set('view engine', 'pug');
app.set('views', __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (_, res) => res.render("home"));
app.get("*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const ioServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    }
});
instrument(ioServer, {
    auth: false,
});

// 현재 생성된 Room을 알려주는 함수.
function publicRooms() {
    const publicRooms = [];
    const {
        sockets: {
            adapter: {sids, rooms}
        }
    } = ioServer;
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}
// 특정 방 안에 유저 인원 수 확인.
function roomUserCount(room) {
    return ioServer.sockets.adapter.rooms.get(room)?.size;
}
// Client와 연결됐을 때
ioServer.on('connection', socket => {
    socket["nickname"] = "Anonymous";
    // Socket에 있는 모든 이벤트 리스너.
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`)
    });
    // 방 생성, 참가 이후 메시지 전송.
    socket.on("room_join", (room, done) => {
        socket.join(room);
        done(roomUserCount(room));
        // 나를 제외한 방안의 사람들에게 메시지 전송!
        socket.to(room).emit("room_in", socket.nickname, roomUserCount(room));
        ioServer.sockets.emit("room_change", publicRooms());
    });
    // Client와의 연결이 끊어지기 전에.
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => 
            socket.to(room).emit("room_out", socket.nickname, roomUserCount(room)-1)
        );
    });
    // Client와의 연결이 끊어지면.
    socket.on("disconnect", () => { 
        ioServer.sockets.emit("room_change", publicRooms());
    });
    // Client => Server 메시지 전송.
    socket.on("send_message", (message, room, done) => {
        socket.to(room).emit("send_message", `${socket.nickname}: ${message}`);
        done();
    });
    // Client => Server Nick Name 설정.
    socket.on("init_ninkname", (nickname) => {
        socket["nickname"] = nickname;
    });
 
});

// Run Server 
const handleListen = () => console.log(`Listening on http://localhost:3000!`);
httpServer.listen(3000, handleListen);