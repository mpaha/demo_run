import { useState, useCallback, useEffect, useRef } from 'react';
import { BOARD_WIDTH, LEVEL_SPEEDS, TETROMINOES } from './constants';
import type { Board, Piece } from './types';
import {
  createEmptyBoard,
  randomPiece,
  isValidPosition,
  placePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  getGhostY,
  tryRotate,
} from './gameLogic';

export function useTetris() {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece>(randomPiece);
  const [heldPiece, setHeldPiece] = useState<Piece | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);

  const dropInterval = useRef<number | null>(null);

  const getSpeed = useCallback((lvl: number) => {
    return LEVEL_SPEEDS[Math.min(lvl, 20)] ?? 30;
  }, []);

  const spawnPiece = useCallback(() => {
    const piece = nextPiece;
    const next = randomPiece();
    if (!isValidPosition(board, piece.shape, piece.x, piece.y)) {
      setGameOver(true);
      return;
    }
    setCurrentPiece(piece);
    setNextPiece(next);
  }, [nextPiece, board]);

  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    const newBoard = placePiece(board, currentPiece);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
    const newLines = lines + linesCleared;
    const newLevel = calculateLevel(newLines);
    const points = calculateScore(linesCleared, level);

    setBoard(clearedBoard);
    setScore(prev => prev + points);
    setLines(newLines);
    setLevel(newLevel);
    setCurrentPiece(null);
    setCanHold(true);
  }, [currentPiece, board, lines, level]);

  // Spawn piece when currentPiece becomes null (after lock or start)
  useEffect(() => {
    if (started && !currentPiece && !gameOver) {
      spawnPiece();
    }
  }, [currentPiece, started, gameOver, spawnPiece]);

  const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece(p => p ? { ...p, x: p.x - 1 } : null);
    }
  }, [currentPiece, board, gameOver, paused]);

  const moveRight = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece(p => p ? { ...p, x: p.x + 1 } : null);
    }
  }, [currentPiece, board, gameOver, paused]);

  const moveDown = useCallback((): boolean => {
    if (!currentPiece || gameOver || paused) return false;
    if (isValidPosition(board, currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(p => p ? { ...p, y: p.y + 1 } : null);
      return true;
    }
    lockPiece();
    return false;
  }, [currentPiece, board, gameOver, paused, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    const ghostY = getGhostY(board, currentPiece);
    const dropDistance = ghostY - currentPiece.y;
    setScore(prev => prev + dropDistance * 2);
    setCurrentPiece(p => p ? { ...p, y: ghostY } : null);
    // Lock on next tick so the piece renders at the bottom briefly
    setTimeout(() => lockPiece(), 0);
  }, [currentPiece, board, gameOver, paused, lockPiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    const rotated = tryRotate(board, currentPiece);
    if (rotated) setCurrentPiece(rotated);
  }, [currentPiece, board, gameOver, paused]);

  const holdPiece = useCallback(() => {
    if (!currentPiece || gameOver || paused || !canHold) return;
    const resetPiece = (type: string): Piece => {
      const t = TETROMINOES[type];
      return {
        type,
        shape: t.shape.map(row => [...row]),
        color: t.color,
        x: Math.floor((BOARD_WIDTH - t.shape[0].length) / 2),
        y: 0,
        rotation: 0,
      };
    };
    if (heldPiece) {
      const swapped = resetPiece(heldPiece.type);
      if (!isValidPosition(board, swapped.shape, swapped.x, swapped.y)) return;
      setHeldPiece(resetPiece(currentPiece.type));
      setCurrentPiece(swapped);
    } else {
      setHeldPiece(resetPiece(currentPiece.type));
      setCurrentPiece(null);
    }
    setCanHold(false);
  }, [currentPiece, heldPiece, board, gameOver, paused, canHold]);

  const togglePause = useCallback(() => {
    if (gameOver || !started) return;
    setPaused(p => !p);
  }, [gameOver, started]);

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    setCurrentPiece(null);
    setNextPiece(randomPiece());
    setHeldPiece(null);
    setCanHold(true);
    setStarted(true);
  }, []);

  // Auto-drop timer
  useEffect(() => {
    if (dropInterval.current) clearInterval(dropInterval.current);
    if (!started || gameOver || paused || !currentPiece) return;

    dropInterval.current = window.setInterval(() => {
      moveDown();
    }, getSpeed(level));

    return () => {
      if (dropInterval.current) clearInterval(dropInterval.current);
    };
  }, [started, gameOver, paused, currentPiece, level, moveDown, getSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          holdPiece();
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveLeft, moveRight, moveDown, rotatePiece, hardDrop, holdPiece, togglePause]);

  const ghostY = currentPiece ? getGhostY(board, currentPiece) : null;

  return {
    board,
    currentPiece,
    nextPiece,
    heldPiece,
    score,
    level,
    lines,
    gameOver,
    paused,
    started,
    ghostY,
    startGame,
    togglePause,
  };
}
