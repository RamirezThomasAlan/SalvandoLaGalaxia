// Variables globales del juego
let board = [];
let boardSize = 9;
let mineCount = 10;
let flagsPlaced = 0;
let cellsRevealed = 0;
let gameStarted = false;
let gameOver = false;
let timer = 0;
let timerInterval;

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear estrellas de fondo
    createStars();
    
    // Inicializar el juego
    initializeGame();
    
    // Event Listeners
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('restart-game').addEventListener('click', function() {
        location.reload();
    });
    document.getElementById('try-again').addEventListener('click', function() {
        location.reload();
    });
    document.getElementById('play-again').addEventListener('click', function() {
        location.reload();
    });
    document.getElementById('mines-slider').addEventListener('input', updateMinesCount);
});

// Función para crear estrellas de fondo
function createStars() {
    const starsContainer = document.getElementById('stars');
    const starsCount = 100;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 5 + 's';
        star.style.animationDuration = Math.random() * 3 + 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Función para inicializar el juego
function initializeGame() {
    updateMinesCount();
    createBoard();
}

// Función para actualizar el contador de minas
function updateMinesCount() {
    mineCount = parseInt(document.getElementById('mines-slider').value);
    document.getElementById('mines-value').textContent = mineCount;
    document.getElementById('mines-count').textContent = mineCount;
}

// Función para comenzar el juego
function startGame() {
    document.getElementById('hood').classList.add('hidden');
    document.getElementById('game-container').style.display = 'block';
    gameStarted = true;
    startTimer();
}

// Función para crear el tablero
function createBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    // Inicializar el array del tablero
    board = Array(boardSize * boardSize).fill(0);
    
    // Colocar minas
    placeMines();
    
    // Calcular números de pistas
    calculateHints();
    
    // Crear celdas
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.dataset.value = board[i];
        
        // Eventos para desktop
        cell.addEventListener('click', function() {
            revealCell(parseInt(this.dataset.index));
        });
        
        cell.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            placeFlag(parseInt(this.dataset.index));
        });
        
        // Eventos para móvil
        let touchTimer;
        let isLongTouch = false;
        
        cell.addEventListener('touchstart', function(e) {
            isLongTouch = false;
            const index = parseInt(this.dataset.index);
            touchTimer = setTimeout(() => {
                isLongTouch = true;
                placeFlag(index);
                e.preventDefault();
            }, 500);
        }, {passive: true});
        
        cell.addEventListener('touchend', function(e) {
            clearTimeout(touchTimer);
            const index = parseInt(this.dataset.index);
            
            if (!isLongTouch) {
                revealCell(index);
                e.preventDefault();
            }
        }, {passive: false});
        
        cell.addEventListener('touchmove', function() {
            clearTimeout(touchTimer);
        }, {passive: true});
        
        gameBoard.appendChild(cell);
    }
}

// Función para colocar minas
function placeMines() {
    let minesPlaced = 0;
    
    while (minesPlaced < mineCount) {
        const randomIndex = Math.floor(Math.random() * boardSize * boardSize);
        
        if (board[randomIndex] !== 'X') {
            board[randomIndex] = 'X';
            minesPlaced++;
        }
    }
}

// Función para calcular pistas
function calculateHints() {
    for (let i = 0; i < boardSize * boardSize; i++) {
        if (board[i] === 'X') continue;
        
        let count = 0;
        const neighbors = getNeighbors(i);
        
        for (const neighbor of neighbors) {
            if (board[neighbor] === 'X') {
                count++;
            }
        }
        
        if (count > 0) {
            board[i] = count;
        }
    }
}

// Función para obtener vecinos
function getNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;
    
    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            if (r === 0 && c === 0) continue;
            
            const newRow = row + r;
            const newCol = col + c;
            
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                neighbors.push(newRow * boardSize + newCol);
            }
        }
    }
    
    return neighbors;
}

// Función para revelar celda
function revealCell(index) {
    if (!gameStarted || gameOver) return;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell.classList.contains('revealed') || cell.classList.contains('flag')) return;
    
    cell.classList.add('revealed');
    
    if (board[index] === 'X') {
        cell.classList.add('mine');
        revealAllMines();
        endGame(false);
        return;
    }
    
    cellsRevealed++;
    
    if (board[index] !== 0) {
        cell.textContent = board[index];
        cell.classList.add(`adjacent-${board[index]}`);
    } else {
        // Revelar celdas adyacentes si es cero
        const neighbors = getNeighbors(index);
        for (const neighbor of neighbors) {
            const neighborCell = document.querySelector(`.cell[data-index="${neighbor}"]`);
            if (!neighborCell.classList.contains('revealed') && !neighborCell.classList.contains('flag')) {
                setTimeout(() => revealCell(neighbor), 50);
            }
        }
    }
    
    // Verificar victoria
    if (cellsRevealed === boardSize * boardSize - mineCount) {
        endGame(true);
    }
}

// Función para revelar todas las minas
function revealAllMines() {
    for (let i = 0; i < boardSize * boardSize; i++) {
        if (board[i] === 'X') {
            const cell = document.querySelector(`.cell[data-index="${i}"]`);
            if (!cell.classList.contains('flag')) {
                cell.classList.add('revealed', 'mine');
            }
        }
    }
}

// Función para colocar bandera
function placeFlag(index) {
    if (!gameStarted || gameOver) return;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell.classList.contains('revealed')) return;
    
    if (cell.classList.contains('flag')) {
        cell.classList.remove('flag');
        flagsPlaced--;
    } else {
        cell.classList.add('flag');
        flagsPlaced++;
    }
    
    updateMinesCounter();
}

// Función para actualizar contador de minas
function updateMinesCounter() {
    document.getElementById('mines-count').textContent = mineCount - flagsPlaced;
}

// Función para iniciar temporizador
function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    document.getElementById('timer').textContent = timer;
    
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = timer;
    }, 1000);
}

// Función para terminar el juego
function endGame(isWin) {
    gameOver = true;
    clearInterval(timerInterval);
    
    if (isWin) {
        setTimeout(() => {
            document.getElementById('game-win').style.display = 'flex';
        }, 500);
    } else {
        setTimeout(() => {
            document.getElementById('game-over').style.display = 'flex';
        }, 500);
    }
}