const websocketURL =
  "wss://musical-succotash-pqp6qq7wj6qh7v9p-3000.app.github.dev";
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const messageBox = document.querySelector(".message-box");
const messageInput = document.querySelector(".message-input");
const messageSubmit = document.querySelector(".message-btn");
const roomInput = document.querySelector(".room-input");
const joinSubmit = document.querySelector(".join-btn");
const createSubmit = document.querySelector(".create-btn");
const roomIDShow = document.querySelector(".room-id");
let peerConnection;
let dataChannel;
let offer;
let answer;
let roomID;
let peerID;
let socket;

messageSubmit.addEventListener("click", () => {
  const message = messageInput.value;
  if (dataChannel) {
    dataChannel.send(message);
  }
});

createSubmit.addEventListener("click", async () => {
  try {
    await setupPeerConnection();
    socket.send(
      JSON.stringify({
        type: "create-room",
      })
    );
  } catch (error) {
    console.log(error);
  }
});

joinSubmit.addEventListener("click", async () => {
  try {
    roomID = roomInput.value;
    roomIDShow.innerHTML = roomID;
    if (!roomID) {
      console.log("Enter room ID please!");
      return;
    }
    await setupPeerConnection();
    socket.send(
      JSON.stringify({
        type: "join-room",
      })
    );
  } catch (error) {
    console.log(error);
  }
});

function handleSocketConnection() {
  socket = new WebSocket(websocketURL);

  socket.onopen = async () => console.log("client opened");
  socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);
    await handleMessage(data);
  };
  socket.onerror = (error) => {
    console.log(error);
  };
  socket.onclose = () => {
    console.log("WebSocket Closed");
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    socket.close();
  };
}

function handleDataChannel(dc) {
  dc.onopen = () => console.log("Data channel opened");
  dc.onmessage = (message) => {
    console.log(message);
    let textEl = document.createElement("h5");
    textEl.innerHTML = message.data;
    messageBox.appendChild(textEl);
  };
  dc.onerror = (err) => console.log(err);
  dc.close = () => console.log("Data channel closed");
}

async function setupPeerConnection() {
  try {
    peerConnection = new RTCPeerConnection(configuration);
    dataChannel = peerConnection.createDataChannel("msg");
    handleDataChannel(dataChannel);

    peerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      if (dataChannel) {
        handleDataChannel(dataChannel);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("local ICE candidate");
        socket.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
          })
        );
      }
    };
    peerConnection.oniceconnectionstatechange = () =>
      console.log(peerConnection.iceConnectionState);
  } catch (error) {
    console.log(error.message);
  }
}

async function handleMessage(message) {
  try {
    switch (message.type) {
      case "room-created":
        roomID = message.roomID;
        peerID = message.peerID;
        console.log(roomID, peerID);
        roomIDShow.innerHTML = roomID;
      case "peer-joined":
        peerID = message.peerID;
        break;
      case "other-joined":
        offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.send(
          JSON.stringify({
            type: "offer",
            offer,
          })
        );
        break;
      case "offer":
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );
        answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.send(
          JSON.stringify({
            type: "answer",
            answer,
          })
        );
        break;
      case "answer":
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(new RTCSessionDescription(message.answer))
        );
        break;
      case "ice-candidate":
        if (message.candidate) {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.log(error);
  }
}
handleSocketConnection();
