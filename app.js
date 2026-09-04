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
const roomUi = document.getElementById('room-ui');
const gameStatus = document.getElementById('game-status');
const playerCount = document.getElementById('player-count');
const opponentCount = document.getElementById('opponent-count');
const cardName = document.getElementById('card-name');
const statContainer = document.getElementById('stat-buttons-container');

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
      renderGame(data);
    }
  });
}

function renderGame(roomData) {
  if (roomData.status === 'waiting') {
    gameStatus.textContent = "Waiting for opponent to join...";
    roomUi.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    return;
  }

  if (roomData.status === 'playing') {
    roomUi.classList.add('hidden');
    gameBoard.classList.remove('hidden');

    const isMyTurn = roomData.currentTurn === playerId;
    gameStatus.textContent = isMyTurn ? "Your Turn! Pick a stat." : "Opponent's Turn... waiting.";
    gameStatus.style.background = isMyTurn ? "#27ae60" : "#e67e22";

    const opponentId = playerId === 'player1' ? 'player2' : 'player1';
    
    // Safely get decks (fallback to empty array if undefined)
    const myDeck = roomData.players[playerId]?.deck || [];
    const oppDeck = roomData.players[opponentId]?.deck || [];

    playerCount.textContent = myDeck.length;
    opponentCount.textContent = oppDeck.length;

    // Render active card if you have cards left
    if (myDeck.length > 0) {
      const topCard = myDeck[0];
      cardName.textContent = topCard.name;
      
      // Clear previous buttons
      statContainer.innerHTML = '';

      // Generate stat buttons
      for (const [stat, value] of Object.entries(topCard.stats)) {
        const btn = document.createElement('button');
        btn.className = 'stat-btn';
        btn.disabled = !isMyTurn; // Disable if it's not your turn
        
        btn.innerHTML = `
          <span class="stat-label">${stat}</span>
          <span class="stat-value">${value}</span>
        `;
        
        // Add click listener to trigger the move
        btn.addEventListener('click', () => handleStatClick(stat, topCard.stats[stat]));
        statContainer.appendChild(btn);
      }
    } else {
      cardName.textContent = "You are out of cards!";
      statContainer.innerHTML = '';
    }
  }
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

function handleStatClick(statKey, statValue) {
  console.log(`You chose ${statKey} with a value of ${statValue}`);
  
  const roomRef = ref(db, `rooms/${currentRoom}`);
  // Update Firebase to initiate the comparison phase
  update(roomRef, { 
    status: 'resolving',
    activeStat: statKey
  });
}
