// Import Firebase Modular SDK directly from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const createBtn = document.getElementById('create-room-btn');
const joinBtn = document.getElementById('join-room-btn');
const roomInput = document.getElementById('room-code-input');
const gameBoard = document.getElementById('game-board');

let currentRoom = null;
let playerId = null;

// Create a new game room
createBtn.addEventListener('click', () => {
  currentRoom = Math.random().toString(36).substring(2, 6).toUpperCase(); // e.g., "A4X9"
  playerId = 'player1';
  
  const roomRef = ref(db, `rooms/${currentRoom}`);
  set(roomRef, {
    status: 'waiting',
    players: {
      player1: { name: 'Host', deck: [] }
    }
  });

  listenToRoom(currentRoom);
  alert(`Room Created! Share this code: ${currentRoom}`);
});

// Join an existing game room
joinBtn.addEventListener('click', () => {
  currentRoom = roomInput.value.trim().toUpperCase();
  if (!currentRoom) return;
  
  playerId = 'player2';
  
  const roomRef = ref(db, `rooms/${currentRoom}/players/player2`);
  update(roomRef, { name: 'Guest', deck: [] });
  
  listenToRoom(currentRoom);
});

// Sync game state in real-time
function listenToRoom(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`);
  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log("Firebase sync triggered. Room data:", data);
      // Here is where we'll eventually trigger UI updates to draw the cards
    }
  });
}
