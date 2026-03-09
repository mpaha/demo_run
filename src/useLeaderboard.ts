import { useState, useCallback } from 'react';
import { LEADERBOARD_KEY, MAX_LEADERBOARD_ENTRIES } from './constants';
import type { LeaderboardEntry } from './types';

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(loadLeaderboard);

  const addEntry = useCallback((entry: LeaderboardEntry) => {
    setEntries(prev => {
      const updated = [...prev, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      saveLeaderboard(updated);
      return updated;
    });
  }, []);

  const isHighScore = useCallback((score: number) => {
    if (entries.length < MAX_LEADERBOARD_ENTRIES) return score > 0;
    return score > entries[entries.length - 1].score;
  }, [entries]);

  return { entries, addEntry, isHighScore };
}
