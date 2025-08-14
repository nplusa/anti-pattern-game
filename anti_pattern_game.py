class AntiPatternGame:
    def __init__(self):
        self.sequence = []
        self.current_player = 1
        self.game_over = False
        self.winner = None
        self.losing_pattern = None
        self.losing_pattern_start = None
    
    def add_move(self, move):
        """Add a move (B or W) to the sequence and check for losing patterns"""
        if self.game_over:
            return False
        
        if move not in ['B', 'W']:
            return False
        
        self.sequence.append(move)
        
        # Check for patterns after the move
        pattern_result = self.check_patterns()
        if pattern_result:
            self.game_over = True
            self.winner = 2 if self.current_player == 1 else 1
            self.losing_pattern = pattern_result['pattern']
            self.losing_pattern_start = pattern_result['start_index']
            return True
        
        # Switch players
        self.current_player = 2 if self.current_player == 1 else 1
        return True
    
    def check_patterns(self):
        """Check for patterns that repeat 3 times consecutively"""
        sequence_length = len(self.sequence)
        
        # Check patterns from length 1 to floor(sequence_length/3)
        for pattern_length in range(1, sequence_length // 3 + 1):
            # Check if we have enough elements for 3 repetitions
            if sequence_length >= 3 * pattern_length:
                # Extract the last (3 * pattern_length) elements
                last_elements = self.sequence[-(3 * pattern_length):]
                
                # Split into 3 equal segments
                segment_size = pattern_length
                segment1 = last_elements[:segment_size]
                segment2 = last_elements[segment_size:2*segment_size]
                segment3 = last_elements[2*segment_size:]
                
                # Check if all 3 segments are identical
                if segment1 == segment2 == segment3:
                    return {
                        'pattern': ''.join(segment1),
                        'start_index': sequence_length - 3 * pattern_length
                    }
        
        return None
    
    def get_sequence_string(self):
        """Get the current sequence as a string"""
        return ''.join(self.sequence)
    
    def get_sequence_display(self):
        """Get the current sequence with visual symbols"""
        display = []
        for move in self.sequence:
            if move == 'B':
                display.append('●')
            else:
                display.append('○')
        return ' '.join(display)
    
    def get_losing_pattern_display(self):
        """Get a display showing the losing pattern highlighted"""
        if not self.losing_pattern or self.losing_pattern_start is None:
            return ""
        
        sequence_str = self.get_sequence_string()
        pattern = self.losing_pattern
        start_idx = self.losing_pattern_start
        
        # Create display with pattern segments separated
        segments = []
        for i in range(3):
            segment_start = start_idx + i * len(pattern)
            segment_end = segment_start + len(pattern)
            segments.append(sequence_str[segment_start:segment_end])
        
        return f"Pattern '{pattern}' repeated 3 times: {' | '.join(segments)}"
    
    def reset(self):
        """Reset the game to initial state"""
        self.sequence = []
        self.current_player = 1
        self.game_over = False
        self.winner = None
        self.losing_pattern = None
        self.losing_pattern_start = None


def main():
    game = AntiPatternGame()
    
    print("=== Anti-Pattern Game ===")
    print("Rules: Players alternate placing black (●) or white (○) pebbles")
    print("Lose if any pattern repeats 3 times consecutively")
    print("Enter 'B' for black, 'W' for white, 'quit' to exit")
    print()
    
    while not game.game_over:
        print(f"Current sequence: {game.get_sequence_display()}")
        print(f"Player {game.current_player}'s turn ({'●' if game.current_player == 1 else '○'})")
        
        move = input("Enter your move (B/W): ").upper().strip()
        
        if move == 'QUIT':
            break
        
        if move not in ['B', 'W']:
            print("Invalid move! Please enter 'B' or 'W'")
            continue
        
        success = game.add_move(move)
        if success and game.game_over:
            print()
            print(f"Final sequence: {game.get_sequence_display()}")
            print(f"Player {game.current_player} loses!")
            print(f"Player {game.winner} wins!")
            print(f"Losing pattern: {game.get_losing_pattern_display()}")
            break
        elif not success:
            print("Invalid move!")
        else:
            print()


if __name__ == "__main__":
    main()