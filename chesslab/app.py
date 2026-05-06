from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import requests
import json
import os
import re
from collections import defaultdict

app = Flask(__name__)
CORS(app)

DATA_FILE = "user_data.json"

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {"username": "", "games": [], "stats": {}, "openings_weakness": []}

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ──────────────────────────────────────────────
# Chess.com API
# ──────────────────────────────────────────────

def fetch_chesscom_games(username, max_months=3):
    """Busca partidas reais do Chess.com"""
    headers = {"User-Agent": "ChessLab/1.0 (chess trainer app)"}
    
    # Busca os arquivos mensais disponíveis
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    res = requests.get(archives_url, headers=headers, timeout=10)
    
    if res.status_code == 404:
        return None, "Utilizador não encontrado no Chess.com"
    if res.status_code != 200:
        return None, f"Erro na API Chess.com: {res.status_code}"
    
    archives = res.json().get("archives", [])
    if not archives:
        return [], "Nenhuma partida encontrada"
    
    # Pega os últimos N meses
    recent = archives[-max_months:]
    all_games = []
    
    for archive_url in recent:
        r = requests.get(archive_url, headers=headers, timeout=10)
        if r.status_code == 200:
            games = r.json().get("games", [])
            all_games.extend(games)
    
    return all_games, None

def parse_opening_from_pgn(pgn):
    """Extrai nome da abertura do PGN"""
    match = re.search(r'\[ECOUrl "([^"]+)"\]', pgn)
    if match:
        url = match.group(1)
        name = url.split("/")[-1].replace("-", " ").title()
        return name
    match = re.search(r'\[Opening "([^"]+)"\]', pgn)
    if match:
        return match.group(1)
    return "Desconhecida"

def parse_eco_from_pgn(pgn):
    match = re.search(r'\[ECO "([^"]+)"\]', pgn)
    return match.group(1) if match else "?"

def get_first_moves(pgn, n=5):
    """Extrai os primeiros N lances do PGN"""
    moves_section = re.sub(r'\[.*?\]\s*', '', pgn, flags=re.DOTALL)
    tokens = moves_section.strip().split()
    moves = []
    for t in tokens:
        if re.match(r'^\d+\.', t):
            continue
        if t in ['1-0', '0-1', '1/2-1/2', '*']:
            break
        if re.match(r'^[KQRBNP]?[a-h]?[1-8]?x?[a-h][1-8][+#]?$|^O-O(-O)?[+#]?$', t):
            moves.append(t)
        if len(moves) >= n:
            break
    return moves

def analyze_weaknesses(games, username):
    """Analisa onde o utilizador perde nas aberturas"""
    opening_stats = defaultdict(lambda: {"wins": 0, "losses": 0, "draws": 0, "games": []})
    
    for g in games:
        pgn = g.get("pgn", "")
        if not pgn:
            continue
        
        white = g.get("white", {}).get("username", "").lower()
        black = g.get("black", {}).get("username", "").lower()
        user_lower = username.lower()
        
        if user_lower not in [white, black]:
            continue
        
        is_white = user_lower == white
        result = g.get("white" if is_white else "black", {}).get("result", "")
        
        opening = parse_opening_from_pgn(pgn)
        eco = parse_eco_from_pgn(pgn)
        first_moves = get_first_moves(pgn, 6)
        
        key = f"{eco} - {opening}"
        
        if result == "win":
            opening_stats[key]["wins"] += 1
        elif result in ["checkmated", "resigned", "timeout", "abandoned"]:
            opening_stats[key]["losses"] += 1
        else:
            opening_stats[key]["draws"] += 1
        
        opening_stats[key]["games"].append({
            "url": g.get("url", ""),
            "result": result,
            "is_white": is_white,
            "moves": first_moves,
            "date": g.get("end_time", 0)
        })
    
    # Calcula taxa de derrota
    weaknesses = []
    for opening, stats in opening_stats.items():
        total = stats["wins"] + stats["losses"] + stats["draws"]
        if total < 2:
            continue
        loss_rate = stats["losses"] / total
        win_rate = stats["wins"] / total
        weaknesses.append({
            "opening": opening,
            "total": total,
            "wins": stats["wins"],
            "losses": stats["losses"],
            "draws": stats["draws"],
            "win_rate": round(win_rate * 100, 1),
            "loss_rate": round(loss_rate * 100, 1),
            "recent_games": sorted(stats["games"], key=lambda x: x["date"], reverse=True)[:3]
        })
    
    # Ordena por taxa de derrota (pior primeiro)
    weaknesses.sort(key=lambda x: x["loss_rate"], reverse=True)
    return weaknesses

# ──────────────────────────────────────────────
# ROTAS
# ──────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/import", methods=["POST"])
def import_games():
    body = request.get_json()
    username = body.get("username", "").strip()
    if not username:
        return jsonify({"error": "Username obrigatório"}), 400
    
    print(f"[ChessLab] A importar partidas de: {username}")
    games, error = fetch_chesscom_games(username, max_months=3)
    
    if error and games is None:
        return jsonify({"error": error}), 404
    
    print(f"[ChessLab] {len(games)} partidas encontradas")
    weaknesses = analyze_weaknesses(games, username)
    
    # Estatísticas gerais
    total = len(games)
    wins = sum(1 for g in games if g.get("white", {}).get("username", "").lower() == username.lower() and g.get("white", {}).get("result") == "win"
               or g.get("black", {}).get("username", "").lower() == username.lower() and g.get("black", {}).get("result") == "win")
    
    data = {
        "username": username,
        "total_games": total,
        "wins": wins,
        "weaknesses": weaknesses[:10],
        "imported_at": __import__("time").strftime("%Y-%m-%d %H:%M")
    }
    
    save_data(data)
    return jsonify(data)

@app.route("/api/data", methods=["GET"])
def get_data():
    return jsonify(load_data())

@app.route("/api/progress", methods=["POST"])
def save_progress():
    body = request.get_json()
    data = load_data()
    if "progress" not in data:
        data["progress"] = {}
    data["progress"].update(body)
    save_data(data)
    return jsonify({"ok": True})

@app.route("/api/progress", methods=["GET"])
def get_progress():
    data = load_data()
    return jsonify(data.get("progress", {}))

if __name__ == "__main__":
    print("╔══════════════════════════════╗")
    print("║   ChessLab - Backend v1.0    ║")
    print("║   http://localhost:5000      ║")
    print("╚══════════════════════════════╝")
    app.run(debug=True, port=5000)
