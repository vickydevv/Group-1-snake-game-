// =============================================================================
// SNAKE GAME - Index.js
// This file runs all game logic: movement, scoring, drawing, and keyboard control.
// =============================================================================

// --- Connect to HTML elements ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); // "ctx" is the drawing tool for the canvas
const scoreText = document.getElementById("score");
const modeText = document.getElementById("modeText");

// --- Game settings (change these to tweak difficulty and size) ---
const box = 30; // Pixels per grid square (snake moves in steps of this size)
const canvasSize = 480; // Board width and height in pixels
const gridCount = canvasSize / box; // How many cells fit across (16 x 16)
const INITIAL_SNAKE_LENGTH = 6; // Body parts when the game starts
const GAME_SPEED = 250; // Milliseconds between moves (higher number = slower snake)

// --- Game state (these change while you play) ---
let snake; // Array of {x, y} objects; snake[0] is always the head
let food; // {x, y} position of the apple
let direction; // Current move direction: "UP", "DOWN", "LEFT", or "RIGHT"
let score;
let game; // Stores the timer ID from setInterval so we can stop it
let gameActive = false; // false after game over, true while playing
let gameMode = 1; // 1 = wrap through walls, 2 = die on walls

// Called when user clicks Mode 1 or Mode 2 button in HTML
function startGame(mode) {
  clearInterval(game); // Stop any previous game timer
  gameActive = true;
  gameMode = mode;
  modeText.innerText =
    mode === 1
      ? "Mode 1: Use arrow keys to steer (no wall death)"
      : "Mode 2: Use arrow keys to steer (classic rules)";

  snake = createInitialSnake();
  direction = "RIGHT";
  score = 0;
  scoreText.innerText = "Score: 0";

  food = randomFood();
  // Run gameLoop every GAME_SPEED ms — this makes the snake move on its own
  game = setInterval(gameLoop, GAME_SPEED);
}

// Builds the starting snake: head in center, body segments to the left
function createInitialSnake() {
  const headX = Math.floor(gridCount / 2) * box;
  const headY = Math.floor(gridCount / 2) * box;
  const segments = [];

  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    segments.push({ x: headX - i * box, y: headY });
  }

  return segments;
}

// Places apple on a random grid cell, but never on top of the snake
function randomFood() {
  let newFood;
  let onSnake;

  do {
    newFood = {
      x: Math.floor(Math.random() * gridCount) * box,
      y: Math.floor(Math.random() * gridCount) * box,
    };
    onSnake = snake.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y
    );
  } while (onSnake);

  return newFood;
}

// Arrow keys only change direction — they do not move the snake directly
function handleKey(event) {
  if (!gameActive) return;

  // Block instant 180° turns (can't go right into left, etc.)
  if (event.key === "ArrowUp" && direction !== "DOWN") {
    direction = "UP";
    event.preventDefault();
  } else if (event.key === "ArrowDown" && direction !== "UP") {
    direction = "DOWN";
    event.preventDefault();
  } else if (event.key === "ArrowLeft" && direction !== "RIGHT") {
    direction = "LEFT";
    event.preventDefault();
  } else if (event.key === "ArrowRight" && direction !== "LEFT") {
    direction = "RIGHT";
    event.preventDefault();
  }
}

// Runs automatically on a timer: update positions, then redraw
function gameLoop() {
  moveSnake();
  render();
}

// Draws the apple (red circle with highlight and stem)
function drawFood() {
  const cx = food.x + box / 2;
  const cy = food.y + box / 2;
  const r = box / 2 - 2;

  const grad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
  grad.addColorStop(0, "#ff7675");
  grad.addColorStop(1, "#c0392b");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#27ae60";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 1);
  ctx.quadraticCurveTo(cx + 4, cy - r - 6, cx + 6, cy - r - 4);
  ctx.stroke();
}

// Thick green line between two body segments so the snake looks connected
function drawSnakeConnector(x1, y1, x2, y2) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, "#44bd32");
  grad.addColorStop(1, "#1e8449");

  ctx.strokeStyle = grad;
  ctx.lineWidth = box - 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = "#145a32";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// One round body part with gradient and scale pattern
function drawSnakeBodySegment(cx, cy, scale, index) {
  const radius = (box / 2 - 1) * scale;

  const grad = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, radius);
  grad.addColorStop(0, "#a8e6a1");
  grad.addColorStop(0.45, "#44bd32");
  grad.addColorStop(1, "#1b5e20");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#145a32";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (index % 2 === 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 1, 2.5, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Head with eyes and tongue; faces whichever way `direction` points
function drawSnakeHead(cx, cy) {
  const radius = box / 2 - 1;

  const grad = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, radius);
  grad.addColorStop(0, "#b8f5a8");
  grad.addColorStop(0.4, "#55efc4");
  grad.addColorStop(1, "#00b894");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#00695c";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const eyeOffsets = {
    UP: [
      [-4, -5],
      [4, -5],
    ],
    DOWN: [
      [-4, 5],
      [4, 5],
    ],
    LEFT: [
      [-5, -4],
      [-5, 4],
    ],
    RIGHT: [
      [5, -4],
      [5, 4],
    ],
  };
  const offsets = eyeOffsets[direction];

  for (const [ex, ey] of offsets) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx + ex, cy + ey, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(cx + ex + ex * 0.15, cy + ey + ey * 0.15, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#e74c3c";
  const tongue = {
    UP: [0, -radius - 2, -2, -radius - 6, 0, -radius - 8, 2, -radius - 6],
    DOWN: [0, radius + 2, -2, radius + 6, 0, radius + 8, 2, radius + 6],
    LEFT: [-radius - 2, 0, -radius - 6, -2, -radius - 8, 0, -radius - 6, 2],
    RIGHT: [radius + 2, 0, radius + 6, -2, radius + 8, 0, radius + 6, 2],
  }[direction];

  ctx.beginPath();
  ctx.moveTo(cx + tongue[0], cy + tongue[1]);
  ctx.lineTo(cx + tongue[2], cy + tongue[3]);
  ctx.lineTo(cx + tongue[4], cy + tongue[5]);
  ctx.lineTo(cx + tongue[6], cy + tongue[7]);
  ctx.closePath();
  ctx.fill();
}

// Draw full snake: links first, body from tail to neck, head on top
function drawSnake() {
  for (let i = 0; i < snake.length - 1; i++) {
    const x1 = snake[i].x + box / 2;
    const y1 = snake[i].y + box / 2;
    const x2 = snake[i + 1].x + box / 2;
    const y2 = snake[i + 1].y + box / 2;
    drawSnakeConnector(x1, y1, x2, y2);
  }

  for (let i = snake.length - 1; i >= 1; i--) {
    const cx = snake[i].x + box / 2;
    const cy = snake[i].y + box / 2;
    const isTail = i === snake.length - 1;
    const scale = isTail ? 0.78 : 0.92;
    drawSnakeBodySegment(cx, cy, scale, i);
  }

  const headCx = snake[0].x + box / 2;
  const headCy = snake[0].y + box / 2;
  drawSnakeHead(headCx, headCy);
}

// Clear canvas and draw food + snake (called every game tick)
function render() {
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  drawFood();
  drawSnake();
}

// Core rules: move head, check walls, eat food, grow or shrink tail, detect crash
function moveSnake() {
  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;
  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;

  // MODE 1 → Snake passes through walls (wrap to opposite side)
  if (gameMode === 1) {
    if (headX < 0) headX = canvasSize - box;
    if (headX >= canvasSize) headX = 0;
    if (headY < 0) headY = canvasSize - box;
    if (headY >= canvasSize) headY = 0;
  }

  // MODE 2 → Snake dies if it hits a wall
  if (
    gameMode === 2 &&
    (headX < 0 ||
      headY < 0 ||
      headX >= canvasSize ||
      headY >= canvasSize)
  ) {
    gameOver();
    return;
  }

  let newHead = { x: headX, y: headY };

  // Eat food: grow (skip pop) and spawn new apple
  if (headX === food.x && headY === food.y) {
    score++;
    scoreText.innerText = "Score: " + score;
    food = randomFood();
  } else {
    snake.pop(); // Remove tail so length stays the same when not eating
  }

  // Hit your own body → game over
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(newHead); // Add new head at the front of the array
}

function gameOver() {
  gameActive = false;
  clearInterval(game);
  alert("Game Over! Your score is: " + score);
}

// Listen for arrow keys for the whole page
document.addEventListener("keydown", handleKey);
