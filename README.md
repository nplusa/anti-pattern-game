# Anti-Pattern Game - Multiplayer

A real-time multiplayer game where players alternate placing X or O symbols, trying to avoid creating patterns that repeat 3 times consecutively.

## How to Play

1. **Create Game**: Click "Create New Game" to get a 6-digit room code
2. **Share Code**: Give the room code to another player
3. **Join Game**: Enter the room code to join an existing game
4. **Play**: Take turns placing X or O - lose if any pattern repeats 3 times!

## Game Rules

- Players alternate turns placing either X or O symbols
- Any pattern that appears 3 times consecutively causes the current player to lose
- Patterns can be any length from 1 to floor(sequence_length ÷ 3)
- Examples of losing sequences:
  - "XXX" (pattern "X" repeated 3 times)
  - "XOXOXO" (pattern "XO" repeated 3 times)

## Development

### Local Setup
```bash
npm install
npm start
```

Visit `http://localhost:3000` to play locally.

### Features
- Real-time multiplayer using Socket.io
- Room-based gameplay with unique codes
- Cross-device compatibility
- Responsive UI with Tailwind CSS
- Connection status indicators
- Pattern detection and highlighting

## Deployment

This app is ready to deploy to Railway, Render, or similar Node.js hosting services.

### Environment Variables
- `PORT` - Server port (default: 3000)

## Technology Stack
- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Real-time**: WebSockets via Socket.io