export type Cell = string | null;
export type Board = Cell[][];

export interface Piece {
  type: string;
  shape: number[][];
  color: string;
  x: number;
  y: number;
  rotation: number; // 0=spawn, 1=R, 2=180, 3=L
}

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPiece: Piece;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  lines: number;
  date: string;
}
