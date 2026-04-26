const LEVEL_NAMES: Record<number, string> = {
  1: 'First Console',
  3: 'After School Player',
  6: 'Arcade Regular',
  10: 'Weekend Champion',
  15: 'Retro Master',
  25: 'Memory Keeper',
};

export function getLevelName(level: number): string {
  const keys = Object.keys(LEVEL_NAMES).map(Number).sort((a, b) => b - a);
  for (const k of keys) if (level >= k) return LEVEL_NAMES[k];
  return 'First Console';
}

export function getXPForLevel(level: number): number {
  return level * 80 + (level - 1) * 40;
}

export function getLevelData() {
  const total = parseInt(localStorage.getItem('lumatha_xp_total') || '0', 10);
  let level = 1;
  let used = 0;
  while (true) {
    const need = getXPForLevel(level);
    if (used + need > total) {
      return {
        level,
        levelName: getLevelName(level),
        currentXP: total - used,
        xpNeeded: need,
        percent: Math.round(((total - used) / need) * 100),
        total,
      };
    }
    used += need;
    level++;
  }
}

export function addXP(amount: number) {
  const before = getLevelData();
  const cur = parseInt(localStorage.getItem('lumatha_xp_total') || '0', 10);
  localStorage.setItem('lumatha_xp_total', String(cur + amount));
  const after = getLevelData();
  return { leveledUp: after.level > before.level, newLevel: after.level, newLevelName: after.levelName };
}
