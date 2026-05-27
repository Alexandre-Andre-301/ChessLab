import sys
from PyQt5.QtWidgets import QApplication

from engine import ChessEngine
from ui import ChessUI

app = QApplication(sys.argv)

engine = ChessEngine()
window = ChessUI(engine)

window.show()

sys.exit(app.exec_())
