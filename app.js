// Import Firebase Modular SDK directly from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { cardDeck } from './deck.js';

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

joinBtn.addEventListener('click', () => {
  currentRoom = roomInput.value.trim().toUpperCase();
  if (!currentRoom) return;
  
  playerId = 'player2';
  
  // 1. Shuffle the imported deck
  const shuffledDeck = shuffle([...cardDeck]);
  
  // 2. Split the deck in half
  const midPoint = Math.ceil(shuffledDeck.length / 2);
  const p1Cards = shuffledDeck.slice(0, midPoint);
  const p2Cards = shuffledDeck.slice(midPoint);

  // 3. Update the entire room state to start the game
  const roomRef = ref(db, `rooms/${currentRoom}`);
  update(roomRef, { 
    status: 'playing',
    currentTurn: 'player1', // Host goes first
    'players/player1/deck': p1Cards,
    'players/player2/name': 'Guest',
    'players/player2/deck': p2Cards
  });
  
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

// Fisher-Yates algorithm for a fair shuffle
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}
