import chess
from PyQt5.QtWidgets import (
    QWidget, QPushButton, QGridLayout, QHBoxLayout,
    QVBoxLayout, QLabel, QDialog, QListWidget, QListWidgetItem,
    QSizePolicy, QFrame
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont


# ── Cores do tabuleiro ──────────────────────────────────────────────────────
COLOR_LIGHT       = "#f0d9b5"
COLOR_DARK        = "#b58863"
COLOR_SELECTED    = "#f6f669"   # amarelo — casa seleccionada
COLOR_LEGAL       = "#cdd16b"   # verde-amarelo — destinos possíveis
COLOR_CHECK       = "#e74c3c"   # vermelho — rei em xeque
COLOR_LAST_FROM   = "#aaa23a"   # ouro escuro — origem do último lance
COLOR_LAST_TO     = "#cdd26a"   # ouro claro  — destino do último lance

PIECE_SYMBOLS = {
    'P': '♙', 'N': '♘', 'B': '♗',
    'R': '♖', 'Q': '♕', 'K': '♔',
    'p': '♟', 'n': '♞', 'b': '♝',
    'r': '♜', 'q': '♛', 'k': '♚',
}


# ── Diálogo de promoção ──────────────────────────────────────────────────────
class PromotionDialog(QDialog):
    def __init__(self, color, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Promover peão")
        self.setModal(True)
        self.choice = 'q'

        layout = QHBoxLayout(self)
        options = [('q', '♕'), ('r', '♖'), ('b', '♗'), ('n', '♘')] \
                  if color == chess.WHITE else \
                  [('q', '♛'), ('r', '♜'), ('b', '♝'), ('n', '♞')]

        for code, symbol in options:
            btn = QPushButton(symbol)
            btn.setFixedSize(70, 70)
            btn.setFont(QFont("Segoe UI Symbol", 30))
            btn.setStyleSheet("""
                QPushButton {
                    background: #f0d9b5;
                    border: 2px solid #b58863;
                    border-radius: 6px;
                }
                QPushButton:hover { background: #e8c99a; }
            """)
            btn.clicked.connect(lambda _, c=code: self._choose(c))
            layout.addWidget(btn)

    def _choose(self, code):
        self.choice = code
        self.accept()


# ── Tabuleiro (widget de casas) ───────────────────────────────────────────────
class BoardWidget(QWidget):
    def __init__(self, engine, on_move_callback):
        super().__init__()
        self.engine = engine
        self.board = engine.get_board()
        self.on_move_callback = on_move_callback

        self.selected_square = None
        self.legal_targets = set()
        self.last_move = None          # tuplo (from_sq, to_sq) ou None

        self.squares = {}
        self._build_grid()
        self.refresh()

    def _build_grid(self):
        grid = QGridLayout(self)
        grid.setSpacing(0)
        grid.setContentsMargins(0, 0, 0, 0)

        for row in range(8):
            for col in range(8):
                btn = QPushButton()
                btn.setFixedSize(68, 68)
                btn.setFont(QFont("Segoe UI Symbol", 26))
                btn.setFocusPolicy(Qt.NoFocus)

                square = chess.square(col, 7 - row)
                btn.clicked.connect(lambda _, s=square: self._on_click(s))

                grid.addWidget(btn, row, col)
                self.squares[square] = btn

    # ── Lógica de clique ─────────────────────────────────────────────────────
    def _on_click(self, square):
        board = self.board

        # Nenhuma peça seleccionada ainda
        if self.selected_square is None:
            piece = board.piece_at(square)
            if piece and piece.color == board.turn:
                self.selected_square = square
                self.legal_targets = {m.to_square for m in
                                      self.engine.get_legal_moves_from(square)}
                self.refresh()
            return

        from_sq = self.selected_square

        # Clicar na mesma casa cancela selecção
        if square == from_sq:
            self._deselect()
            return

        # Clicar noutra peça da mesma cor muda selecção
        piece = board.piece_at(square)
        if piece and piece.color == board.turn:
            self.selected_square = square
            self.legal_targets = {m.to_square for m in
                                  self.engine.get_legal_moves_from(square)}
            self.refresh()
            return

        # Tentar mover
        if square in self.legal_targets:
            if self.engine.is_promotion(from_sq, square):
                dlg = PromotionDialog(board.turn, self)
                dlg.exec_()
                success = self.engine.move_with_promotion(from_sq, square, dlg.choice)
            else:
                uci = chess.square_name(from_sq) + chess.square_name(square)
                success = self.engine.move(uci)

            if success:
                self.last_move = (from_sq, square)
                self._deselect()
                self.on_move_callback()
                return

        self._deselect()

    def _deselect(self):
        self.selected_square = None
        self.legal_targets = set()
        self.refresh()

    # ── Pintura do tabuleiro ─────────────────────────────────────────────────
    def refresh(self):
        board = self.board
        king_sq = self.engine.get_king_square()
        last_from, last_to = self.last_move if self.last_move else (None, None)

        for square, btn in self.squares.items():
            row = 7 - chess.square_rank(square)
            col = chess.square_file(square)
            base = COLOR_LIGHT if (row + col) % 2 == 0 else COLOR_DARK

            # Prioridade de highlight
            if square == king_sq:
                bg = COLOR_CHECK
            elif square == self.selected_square:
                bg = COLOR_SELECTED
            elif square in self.legal_targets:
                bg = COLOR_LEGAL
            elif square == last_from:
                bg = COLOR_LAST_FROM
            elif square == last_to:
                bg = COLOR_LAST_TO
            else:
                bg = base

            piece = board.piece_at(square)
            text = PIECE_SYMBOLS.get(piece.symbol(), '') if piece else ''

            btn.setText(text)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {bg};
                    border: none;
                    color: {'#1a1a1a' if piece and piece.color == chess.WHITE else '#222'};
                }}
                QPushButton:hover {{ background-color: {self._hover(bg)}; }}
            """)

    @staticmethod
    def _hover(color):
        """Escurece ligeiramente a cor para hover."""
        mapping = {
            COLOR_LIGHT: "#e8c99a",
            COLOR_DARK:  "#9a7350",
            COLOR_SELECTED: "#e8e640",
            COLOR_LEGAL:    "#b8c240",
            COLOR_CHECK:    "#c0392b",
            COLOR_LAST_FROM: "#8a8220",
            COLOR_LAST_TO:   "#b8c030",
        }
        return mapping.get(color, color)


# ── Painel lateral ────────────────────────────────────────────────────────────
class SidePanel(QWidget):
    def __init__(self, engine, on_undo, on_reset):
        super().__init__()
        self.engine = engine
        self.setFixedWidth(200)

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignTop)
        layout.setSpacing(12)

        # Título
        title = QLabel("♔ Xadrez")
        title.setFont(QFont("Segoe UI", 18, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        sep = QFrame()
        sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("color: #ccc;")
        layout.addWidget(sep)

        # Estado do jogo
        self.status_label = QLabel("Brancas jogam")
        self.status_label.setFont(QFont("Segoe UI", 11))
        self.status_label.setWordWrap(True)
        self.status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.status_label)

        sep2 = QFrame()
        sep2.setFrameShape(QFrame.HLine)
        sep2.setStyleSheet("color: #ccc;")
        layout.addWidget(sep2)

        # Histórico
        hist_lbl = QLabel("Histórico")
        hist_lbl.setFont(QFont("Segoe UI", 10, QFont.Bold))
        layout.addWidget(hist_lbl)

        self.history_list = QListWidget()
        self.history_list.setFont(QFont("Courier New", 10))
        self.history_list.setFixedHeight(280)
        self.history_list.setStyleSheet("""
            QListWidget {
                background: #fafafa;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
        """)
        layout.addWidget(self.history_list)

        # Botões
        btn_style = """
            QPushButton {
                background: #b58863;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px;
                font-size: 12px;
                font-family: 'Segoe UI';
            }
            QPushButton:hover { background: #9a7350; }
            QPushButton:pressed { background: #7a5330; }
        """

        undo_btn = QPushButton("↩  Desfazer")
        undo_btn.setStyleSheet(btn_style)
        undo_btn.clicked.connect(on_undo)
        layout.addWidget(undo_btn)

        reset_btn = QPushButton("⟳  Novo Jogo")
        reset_btn.setStyleSheet(btn_style)
        reset_btn.clicked.connect(on_reset)
        layout.addWidget(reset_btn)

        layout.addStretch()

    def update(self, status_text, history):
        self.status_label.setText(status_text)

        self.history_list.clear()
        for i in range(0, len(history), 2):
            move_num = i // 2 + 1
            white = history[i]
            black = history[i + 1] if i + 1 < len(history) else ''
            item = QListWidgetItem(f"{move_num:>2}. {white:<8} {black}")
            self.history_list.addItem(item)

        self.history_list.scrollToBottom()


# ── Janela principal ──────────────────────────────────────────────────────────
class ChessUI(QWidget):
    def __init__(self, engine):
        super().__init__()
        self.engine = engine
        self.setWindowTitle("Xadrez PyQt5")

        outer = QHBoxLayout(self)
        outer.setSpacing(16)
        outer.setContentsMargins(12, 12, 12, 12)

        self.board_widget = BoardWidget(engine, self._on_move)
        outer.addWidget(self.board_widget)

        self.side_panel = SidePanel(engine, self._on_undo, self._on_reset)
        outer.addWidget(self.side_panel)

        self.adjustSize()
        self.setFixedSize(self.sizeHint())
        self._refresh_side()

    # ── Callbacks ─────────────────────────────────────────────────────────────
    def _on_move(self):
        self._refresh_side()

    def _on_undo(self):
        if self.engine.undo():
            self.board_widget.last_move = None
            self.board_widget._deselect()
            self._refresh_side()

    def _on_reset(self):
        self.engine.reset()
        self.board_widget.last_move = None
        self.board_widget._deselect()
        self._refresh_side()

    def _refresh_side(self):
        status_code, msg = self.engine.get_game_status()

        if status_code in ("checkmate", "stalemate", "draw"):
            status_text = msg
        elif status_code == "check":
            status_text = f"{self.engine.get_turn_label()} jogam\n⚠ {msg}"
        else:
            status_text = f"{self.engine.get_turn_label()} jogam"

        self.side_panel.update(status_text, self.engine.move_history)
        self.board_widget.refresh()