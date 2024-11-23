const { WebSocketServer } = require("ws");
const ShortUniqueId = require("short-unique-id");
const socket = new WebSocketServer({ port: 3000 });
const room = new Map();
const uid = new ShortUniqueId({ length: 10 });
let peerID;
socket.on("connection", (ws) => {
  ws.on("error", console.error);
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "create-room":
        const roomID = uid.rnd();
        peerID = uid.rnd();
        room.set("room-id", roomID);
        room.set("host", [ws, peerID]);
        // console.log(room);
        ws.send(
          JSON.stringify({
            type: "room-created",
            roomID,
            peerID,
          })
        );
        break;
      case "join-room":
        peerID = uid.rnd();
        room.set("peer", [ws, peerID]);
        // console.log(room);
        ws.send(
          JSON.stringify({
            type: "peer-joined",
            peerID,
          })
        );
        room.get("host")[0].send(
          JSON.stringify({
            type: "other-joined",
          })
        );
        break;
      case "offer":
        room
          .get("peer")[0]
          .send(JSON.stringify({ type: "offer", offer: data.offer }));
        break;
      case "answer":
        room
          .get("host")[0]
          .send(JSON.stringify({ type: "answer", answer: data.answer }));
        break;
      case "ice-candidate":
        if (ws != room.get("peer")[0]) {
          room.get("peer")[0].send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: data.candidate,
            })
          );
        } else {
          room.get("host")[0].send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: data.candidate,
            })
          );
        }
        break;
      default:
        break;
    }
  });
  ws.on("close", () => {
    console.log("client disconnect");
    room.set();
  });
});
