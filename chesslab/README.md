# ChessLab 🏰

App de treino de xadrez personalizado com integração Chess.com.

## Instalação

```bash
# 1. Instala as dependências Python
pip install -r requirements.txt

# 2. Corre o servidor
python app.py

# 3. Abre no browser
http://localhost:5000
```

## Funcionalidades

### Dashboard
- Insere o teu username do Chess.com
- Importa automaticamente as tuas últimas partidas (3 meses)
- Vê quais aberturas te custam mais derrotas
- Barra de vitórias/derrotas por abertura

### Aberturas
- Italiano, Siciliana, London System, Gambito da Rainha
- Treino lance a lance com dicas visuais
- Progresso guardado

### Puzzles
- Mate em 1, garfo de cavalo, captura decisiva
- Contador de acertos e erros

### Jogo Livre
- Joga livremente para estudar posições
- Histórico de lances

## Fase 2 (próximas funcionalidades)
- [ ] Stockfish para análise automática
- [ ] Mais aberturas baseadas nos teus pontos fracos
- [ ] Sistema de flashcards de linhas
- [ ] Progresso salvo por abertura
- [ ] Lichess API (alternativa ao Chess.com)

## Estrutura
```
chesslab/
├── app.py              # Backend Flask
├── requirements.txt    # Dependências
├── user_data.json      # Dados guardados (criado automaticamente)
└── templates/
    └── index.html      # Frontend completo
```
