import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOES, PIECE_TYPES, POINTS, LINES_PER_LEVEL } from './constants';
import type { Board, Piece } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

export function randomPiece(): Piece {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const tetromino = TETROMINOES[type];
  return {
    type,
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2),
    y: 0,
    rotation: 0,
  };
}

export function rotate(shape: number[][]): number[][] {
  const size = shape.length;
  const rotated: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      rotated[x][size - 1 - y] = shape[y][x];
    }
  }
  return rotated;
}

export function isValidPosition(board: Board, shape: number[][], x: number, y: number): boolean {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
        if (newY < 0) continue;
        if (board[newY][newX]) return false;
      }
    }
  }
  return true;
}

export function placePiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const y = piece.y + row;
        const x = piece.x + col;
        if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
          newBoard[y][x] = piece.color;
        }
      }
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const linesCleared = BOARD_HEIGHT - newBoard.length;
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { newBoard, linesCleared };
}

export function calculateScore(linesCleared: number, level: number): number {
  if (linesCleared === 0) return 0;
  return (POINTS[linesCleared] || 0) * (level + 1);
}

export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / LINES_PER_LEVEL);
}

export function getGhostY(board: Board, piece: Piece): number {
  let ghostY = piece.y;
  while (isValidPosition(board, piece.shape, piece.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}

// SRS wall kick data: offsets indexed by [fromRotation][toRotation]
// Each entry is an array of (dx, dy) kicks to try in order.
// Standard JLSTZ kicks
const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
  '1>0': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]],
  '1>2': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]],
  '2>1': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
  '2>3': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
  '3>2': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
  '3>0': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
  '0>3': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
};

// I-piece kicks
const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0>1': [[ 0, 0], [-2, 0], [ 1, 0], [-2, 1], [ 1,-2]],
  '1>0': [[ 0, 0], [ 2, 0], [-1, 0], [ 2,-1], [-1, 2]],
  '1>2': [[ 0, 0], [-1, 0], [ 2, 0], [-1,-2], [ 2, 1]],
  '2>1': [[ 0, 0], [ 1, 0], [-2, 0], [ 1, 2], [-2,-1]],
  '2>3': [[ 0, 0], [ 2, 0], [-1, 0], [ 2,-1], [-1, 2]],
  '3>2': [[ 0, 0], [-2, 0], [ 1, 0], [-2, 1], [ 1,-2]],
  '3>0': [[ 0, 0], [ 1, 0], [-2, 0], [ 1, 2], [-2,-1]],
  '0>3': [[ 0, 0], [-1, 0], [ 2, 0], [-1,-2], [ 2, 1]],
};

export function tryRotate(board: Board, piece: Piece): Piece | null {
  // O-piece doesn't rotate
  if (piece.type === 'O') return null;

  const rotated = rotate(piece.shape);
  const fromRot = piece.rotation;
  const toRot = (fromRot + 1) % 4;
  const key = `${fromRot}>${toRot}`;

  const kicks = piece.type === 'I' ? WALL_KICKS_I[key] : WALL_KICKS_JLSTZ[key];

  for (const [dx, dy] of kicks) {
    if (isValidPosition(board, rotated, piece.x + dx, piece.y - dy)) {
      return { ...piece, shape: rotated, x: piece.x + dx, y: piece.y - dy, rotation: toRot };
    }
  }
  return null;
}
