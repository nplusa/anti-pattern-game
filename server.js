const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'multiplayer.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', rooms: gameRooms.size });
});

// Game rooms storage
const gameRooms = new Map();

class AntiPatternGame {
    constructor() {
        this.sequence = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.losingPattern = null;
        this.losingPatternStart = null;
        this.players = [];
    }

    addPlayer(playerId) {
        if (this.players.length < 2) {
            this.players.push(playerId);
            return true;
        }
        return false;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(id => id !== playerId);
    }

    addMove(move) {
        if (this.gameOver) {
            return { success: false, reason: 'Game is over' };
        }

        if (move !== 'X' && move !== 'O') {
            return { success: false, reason: 'Invalid move' };
        }

        this.sequence.push(move);

        const patternResult = this.checkPatterns();
        if (patternResult) {
            this.gameOver = true;
            this.winner = this.currentPlayer === 1 ? 2 : 1;
            this.losingPattern = patternResult.pattern;
            this.losingPatternStart = patternResult.startIndex;
            return { success: true, gameOver: true };
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        return { success: true, gameOver: false };
    }

    checkPatterns() {
        const sequenceLength = this.sequence.length;

        for (let patternLength = 1; patternLength <= Math.floor(sequenceLength / 3); patternLength++) {
            if (sequenceLength >= 3 * patternLength) {
                const lastElements = this.sequence.slice(-(3 * patternLength));
                
                const segment1 = lastElements.slice(0, patternLength);
                const segment2 = lastElements.slice(patternLength, 2 * patternLength);
                const segment3 = lastElements.slice(2 * patternLength);

                if (this.arraysEqual(segment1, segment2) && this.arraysEqual(segment2, segment3)) {
                    return {
                        pattern: segment1.join(''),
                        startIndex: sequenceLength - 3 * patternLength
                    };
                }
            }
        }

        return null;
    }

    arraysEqual(arr1, arr2) {
        return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
    }

    getLosingPatternDisplay() {
        if (!this.losingPattern || this.losingPatternStart === null) {
            return "";
        }

        const sequenceStr = this.sequence.join('');
        const pattern = this.losingPattern;
        const startIdx = this.losingPatternStart;

        const segments = [];
        for (let i = 0; i < 3; i++) {
            const segmentStart = startIdx + i * pattern.length;
            const segmentEnd = segmentStart + pattern.length;
            segments.push(sequenceStr.slice(segmentStart, segmentEnd));
        }

        return `Pattern '${pattern}' repeated 3 times: ${segments.join(' | ')}`;
    }

    getGameState() {
        return {
            sequence: this.sequence,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            losingPattern: this.losingPattern,
            losingPatternStart: this.losingPatternStart,
            losingPatternDisplay: this.getLosingPatternDisplay(),
            playerCount: this.players.length
        };
    }

    reset() {
        this.sequence = [];
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.losingPattern = null;
        this.losingPatternStart = null;
    }
}

// Generate unique room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create game room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        const game = new AntiPatternGame();
        game.addPlayer(socket.id);
        
        gameRooms.set(roomCode, game);
        socket.join(roomCode);
        
        socket.emit('roomCreated', {
            roomCode,
            playerNumber: 1,
            gameState: game.getGameState()
        });
        
        console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    // Join game room
    socket.on('joinRoom', (roomCode) => {
        const game = gameRooms.get(roomCode);
        
        if (!game) {
            socket.emit('joinError', 'Room not found');
            return;
        }

        if (game.players.length >= 2) {
            socket.emit('joinError', 'Room is full');
            return;
        }

        game.addPlayer(socket.id);
        socket.join(roomCode);
        
        const playerNumber = game.players.length;
        
        socket.emit('roomJoined', {
            roomCode,
            playerNumber,
            gameState: game.getGameState()
        });

        // Notify other player in room
        socket.to(roomCode).emit('playerJoined', {
            gameState: game.getGameState()
        });
        
        console.log(`${socket.id} joined room ${roomCode} as player ${playerNumber}`);
    });

    // Make a move
    socket.on('makeMove', (data) => {
        const { roomCode, move } = data;
        const game = gameRooms.get(roomCode);
        
        if (!game) {
            socket.emit('moveError', 'Room not found');
            return;
        }

        if (game.players.length < 2) {
            socket.emit('moveError', 'Waiting for second player');
            return;
        }

        const result = game.addMove(move);
        
        if (result.success) {
            // Broadcast game state to all players in room
            io.to(roomCode).emit('gameUpdate', {
                gameState: game.getGameState(),
                lastMove: move
            });
            
            console.log(`Move ${move} made in room ${roomCode}`);
        } else {
            socket.emit('moveError', result.reason);
        }
    });

    // Reset game
    socket.on('resetGame', (roomCode) => {
        const game = gameRooms.get(roomCode);
        
        if (!game) {
            socket.emit('resetError', 'Room not found');
            return;
        }

        game.reset();
        
        // Broadcast reset to all players in room
        io.to(roomCode).emit('gameReset', {
            gameState: game.getGameState()
        });
        
        console.log(`Game reset in room ${roomCode}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove player from all rooms and clean up empty rooms
        for (const [roomCode, game] of gameRooms.entries()) {
            if (game.players.includes(socket.id)) {
                game.removePlayer(socket.id);
                
                // Notify remaining players
                socket.to(roomCode).emit('playerDisconnected', {
                    gameState: game.getGameState()
                });
                
                // Remove empty rooms
                if (game.players.length === 0) {
                    gameRooms.delete(roomCode);
                    console.log(`Room ${roomCode} deleted - no players remaining`);
                } else {
                    console.log(`Player removed from room ${roomCode}`);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to play the game`);
});