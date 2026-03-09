import { useState } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE } from './constants';
import { useTetris } from './useTetris';
import { useLeaderboard } from './useLeaderboard';
import type { Piece } from './types';
import './App.css';

function BoardCanvas({
  board,
  currentPiece,
  ghostY,
}: {
  board: (string | null)[][];
  currentPiece: Piece | null;
  ghostY: number | null;
}) {
  const cells: React.JSX.Element[] = [];

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let color = board[y][x];
      let isGhost = false;
      let isCurrent = false;

      if (currentPiece) {
        const px = x - currentPiece.x;
        const py = y - currentPiece.y;
        if (
          py >= 0 && py < currentPiece.shape.length &&
          px >= 0 && px < currentPiece.shape[py].length &&
          currentPiece.shape[py][px]
        ) {
          color = currentPiece.color;
          isCurrent = true;
        }

        if (!isCurrent && ghostY !== null) {
          const gy = y - ghostY;
          if (
            gy >= 0 && gy < currentPiece.shape.length &&
            px >= 0 && px < currentPiece.shape[gy].length &&
            currentPiece.shape[gy][px]
          ) {
            isGhost = true;
          }
        }
      }

      cells.push(
        <div
          key={`${y}-${x}`}
          className={`cell${color ? ' filled' : ''}${isGhost ? ' ghost' : ''}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: color || undefined,
            borderColor: color ? brighten(color, -30) : undefined,
          }}
        />
      );
    }
  }

  return (
    <div
      className="board"
      style={{
        width: BOARD_WIDTH * CELL_SIZE,
        height: BOARD_HEIGHT * CELL_SIZE,
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
      }}
    >
      {cells}
    </div>
  );
}

function PiecePreview({ piece }: { piece: Piece }) {
  const size = piece.shape.length;
  return (
    <div className="preview" style={{ gridTemplateColumns: `repeat(${size}, 24px)` }}>
      {piece.shape.flatMap((row, y) =>
        row.map((val, x) => (
          <div
            key={`${y}-${x}`}
            className={`cell preview-cell${val ? ' filled' : ''}`}
            style={{
              width: 24,
              height: 24,
              backgroundColor: val ? piece.color : undefined,
              borderColor: val ? brighten(piece.color, -30) : undefined,
            }}
          />
        ))
      )}
    </div>
  );
}

function brighten(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function App() {
  const game = useTetris();
  const { entries, addEntry, isHighScore } = useLeaderboard();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleSaveScore = () => {
    if (!playerName.trim()) return;
    addEntry({
      name: playerName.trim(),
      score: game.score,
      level: game.level,
      lines: game.lines,
      date: new Date().toLocaleDateString(),
    });
    setScoreSaved(true);
  };

  const handleNewGame = () => {
    setScoreSaved(false);
    setPlayerName('');
    setShowLeaderboard(false);
    game.startGame();
  };

  return (
    <div className="app">
      <h1 className="title">TETRIS</h1>

      <div className="game-container">
        <div className="sidebar sidebar-left">
          <div className="panel">
            <h3>HOLD</h3>
            {game.heldPiece ? (
              <PiecePreview piece={game.heldPiece} />
            ) : (
              <div className="empty-hold">-</div>
            )}
          </div>
        </div>

        <div className="board-wrapper">
          <BoardCanvas
            board={game.board}
            currentPiece={game.currentPiece}
            ghostY={game.ghostY}
          />
          {game.paused && (
            <div className="overlay">
              <div className="overlay-text">PAUSED</div>
            </div>
          )}
          {game.gameOver && (
            <div className="overlay">
              <div className="game-over-panel">
                <div className="overlay-text">GAME OVER</div>
                <p className="final-score">Score: {game.score.toLocaleString()}</p>
                {!scoreSaved && isHighScore(game.score) && (
                  <div className="save-score">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveScore()}
                      maxLength={15}
                      autoFocus
                    />
                    <button onClick={handleSaveScore}>SAVE</button>
                  </div>
                )}
                {scoreSaved && <p className="saved-msg">Score saved!</p>}
                <button className="btn" onClick={handleNewGame}>PLAY AGAIN</button>
              </div>
            </div>
          )}
          {!game.started && (
            <div className="overlay">
              <div className="start-panel">
                <div className="overlay-text">TETRIS</div>
                <button className="btn start-btn" onClick={handleNewGame}>START</button>
                <div className="controls-hint">
                  <p>&larr; &rarr; Move &nbsp; &uarr; Rotate</p>
                  <p>&darr; Soft Drop &nbsp; Space Hard Drop</p>
                  <p>C Hold &nbsp; P Pause</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="panel">
            <h3>NEXT</h3>
            <PiecePreview piece={game.nextPiece} />
          </div>
          <div className="panel">
            <h3>SCORE</h3>
            <p className="stat">{game.score.toLocaleString()}</p>
          </div>
          <div className="panel">
            <h3>LEVEL</h3>
            <p className="stat">{game.level}</p>
          </div>
          <div className="panel">
            <h3>LINES</h3>
            <p className="stat">{game.lines}</p>
          </div>
          <button
            className="btn leaderboard-btn"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? 'HIDE' : 'TOP SCORES'}
          </button>
        </div>
      </div>

      {showLeaderboard && (
        <div className="leaderboard">
          <h2>LEADERBOARD</h2>
          {entries.length === 0 ? (
            <p className="no-scores">No scores yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Lvl</th>
                  <th>Lines</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{e.name}</td>
                    <td>{e.score.toLocaleString()}</td>
                    <td>{e.level}</td>
                    <td>{e.lines}</td>
                    <td>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
