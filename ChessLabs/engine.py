import chess


class ChessEngine:
    def __init__(self):
        self.board = chess.Board()
        self.move_history = []  # lista de strings UCI

    def reset(self):
        self.board = chess.Board()
        self.move_history = []

    def move(self, move_uci):
        move = chess.Move.from_uci(move_uci)
        if move in self.board.legal_moves:
            san = self.board.san(move)  # notação antes de empurrar
            self.board.push(move)
            self.move_history.append(san)
            return True
        return False

    def get_legal_moves_from(self, square):
        """Retorna movimentos legais a partir de uma casa."""
        return [m for m in self.board.legal_moves if m.from_square == square]

    def get_board(self):
        return self.board

    def is_promotion(self, from_sq, to_sq):
        """Verifica se o movimento é uma promoção de peão."""
        piece = self.board.piece_at(from_sq)
        if piece and piece.piece_type == chess.PAWN:
            if chess.square_rank(to_sq) in (0, 7):
                return True
        return False

    def move_with_promotion(self, from_sq, to_sq, promotion_piece):
        """Executa movimento com promoção."""
        promo = {
            'q': chess.QUEEN,
            'r': chess.ROOK,
            'b': chess.BISHOP,
            'n': chess.KNIGHT,
        }.get(promotion_piece, chess.QUEEN)

        uci = chess.square_name(from_sq) + chess.square_name(to_sq) + promotion_piece
        move = chess.Move.from_uci(uci)

        if move in self.board.legal_moves:
            san = self.board.san(move)
            self.board.push(move)
            self.move_history.append(san)
            return True
        return False

    def get_game_status(self):
        """
        Retorna o estado actual do jogo.
        'playing', 'check', 'checkmate', 'stalemate', 'draw'
        """
        if self.board.is_checkmate():
            winner = "Brancas" if self.board.turn == chess.BLACK else "Pretas"
            return "checkmate", f"Xeque-Mate! {winner} vencem."
        if self.board.is_stalemate():
            return "stalemate", "Empate por afogamento!"
        if self.board.is_insufficient_material():
            return "draw", "Empate por material insuficiente!"
        if self.board.is_seventyfive_moves():
            return "draw", "Empate pela regra dos 75 movimentos!"
        if self.board.is_fivefold_repetition():
            return "draw", "Empate por repetição!"
        if self.board.is_check():
            return "check", "Xeque!"
        return "playing", ""

    def get_turn_label(self):
        return "Brancas" if self.board.turn == chess.WHITE else "Pretas"

    def get_king_square(self):
        """Retorna a casa do rei que está em xeque (ou None)."""
        if self.board.is_check():
            return self.board.king(self.board.turn)
        return None

    def undo(self):
        """Desfaz o último movimento."""
        if self.move_history:
            self.board.pop()
            self.move_history.pop()
            return True
        return False