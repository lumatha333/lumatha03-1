import { useState, useCallback, useRef, useEffect } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props { onBack: () => void; }

const ACCENT = '#D4A574';
const STORAGE_KEY = 'lumatha_cd_best';

const PLAYER_COLORS = ['#4ECDC4', '#FFD166', '#FF6B6B', '#C084FC'];
const PLAYER_NAMES = ['You', 'Bot A', 'Bot B', 'Bot C'];

// Simplified path: 52 squares around the board perimeter, clockwise from top-left
// Positions as percentage of board size
function generatePath(): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  const margin = 8; // % from edge
  const step = 13; // 4 sides × 13 = 52
  // Top: left to right
  for (let i = 0; i < step; i++) path.push({ x: margin + (i / step) * (100 - 2 * margin), y: margin });
  // Right: top to bottom
  for (let i = 0; i < step; i++) path.push({ x: 100 - margin, y: margin + (i / step) * (100 - 2 * margin) });
  // Bottom: right to left
  for (let i = 0; i < step; i++) path.push({ x: 100 - margin - (i / step) * (100 - 2 * margin), y: 100 - margin });
  // Left: bottom to top
  for (let i = 0; i < step; i++) path.push({ x: margin, y: 100 - margin - (i / step) * (100 - 2 * margin) });
  return path;
}

const BOARD_PATH = generatePath();
const SAFE_SQUARES = [0, 13, 26, 39];
const ENTRY_SQUARES = [0, 13, 26, 39]; // per player

// Home columns: 6 squares leading to center for each player
function getHomeColumn(player: number): { x: number; y: number }[] {
  const cx = 50, cy = 50;
  const entry = BOARD_PATH[ENTRY_SQUARES[player]];
  const cols: { x: number; y: number }[] = [];
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    cols.push({ x: entry.x + (cx - entry.x) * t, y: entry.y + (cy - entry.y) * t });
  }
  return cols;
}

interface TokenState {
  player: number;
  id: number;
  pathIndex: number; // -1 = home, 0-51 = board, 52-57 = home column, 58 = finished
  state: 'home' | 'active' | 'finished';
}

function initTokens(): TokenState[] {
  const tokens: TokenState[] = [];
  for (let p = 0; p < 4; p++) {
    for (let i = 0; i < 4; i++) {
      tokens.push({ player: p, id: p * 4 + i, pathIndex: -1, state: 'home' });
    }
  }
  return tokens;
}

// Get absolute board position for a token
function getAbsoluteSquare(player: number, pathIndex: number): number {
  if (pathIndex < 0 || pathIndex >= 52) return -1;
  return (ENTRY_SQUARES[player] + pathIndex) % 52;
}

const DICE_DOTS: number[][][] = [
  [[50, 50]], // 1
  [[25, 25], [75, 75]], // 2
  [[25, 25], [50, 50], [75, 75]], // 3
  [[25, 25], [75, 25], [25, 75], [75, 75]], // 4
  [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], // 5
  [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]], // 6
];

export function CourtyardDiceGame({ onBack }: Props) {
  const [tokens, setTokens] = useState<TokenState[]>(initTokens);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [phase, setPhase] = useState<'roll' | 'move' | 'animating' | 'bot' | 'won'>('roll');
  const [movableTokens, setMovableTokens] = useState<number[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollDisplay, setRollDisplay] = useState(1);
  const [capturePos, setCapturePos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const bestScore = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) bestScore.current = parseInt(s, 10) || 0; } catch {}
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const getMovableTokenIds = useCallback((player: number, dice: number, toks: TokenState[]): number[] => {
    const playerTokens = toks.filter(t => t.player === player);
    const movable: number[] = [];
    for (const token of playerTokens) {
      if (token.state === 'finished') continue;
      if (token.state === 'home') {
        if (dice === 6) movable.push(token.id);
      } else {
        const newIndex = token.pathIndex + dice;
        if (newIndex <= 57) movable.push(token.id); // Can move within home column or on board
      }
    }
    return movable;
  }, []);

  const checkWin = useCallback((toks: TokenState[], player: number): boolean => {
    return toks.filter(t => t.player === player).every(t => t.state === 'finished');
  }, []);

  const moveToken = useCallback((tokenId: number, dice: number, toks: TokenState[]): { newTokens: TokenState[]; captured: boolean; capturedPos?: { x: number; y: number } } => {
    const newTokens = toks.map(t => ({ ...t }));
    const token = newTokens.find(t => t.id === tokenId)!;
    let captured = false;
    let capturedPos: { x: number; y: number } | undefined;

    if (token.state === 'home' && dice === 6) {
      token.state = 'active';
      token.pathIndex = 0;
    } else if (token.state === 'active') {
      token.pathIndex += dice;
      if (token.pathIndex >= 57) {
        token.pathIndex = 58;
        token.state = 'finished';
      }
    }

    // Check capture (only on main board path, not home column or safe squares)
    if (token.state === 'active' && token.pathIndex >= 0 && token.pathIndex < 52) {
      const absSquare = getAbsoluteSquare(token.player, token.pathIndex);
      if (!SAFE_SQUARES.includes(absSquare)) {
        for (const other of newTokens) {
          if (other.player !== token.player && other.state === 'active' && other.pathIndex >= 0 && other.pathIndex < 52) {
            const otherAbs = getAbsoluteSquare(other.player, other.pathIndex);
            if (otherAbs === absSquare) {
              // Capture!
              const pos = BOARD_PATH[absSquare];
              capturedPos = pos;
              other.state = 'home';
              other.pathIndex = -1;
              captured = true;
              break;
            }
          }
        }
      }
    }

    return { newTokens, captured, capturedPos };
  }, []);

  const nextPlayer = useCallback((current: number, gotSix: boolean) => {
    if (gotSix) {
      // Extra turn
      if (current === 0) {
        setPhase('roll');
        setDiceValue(null);
      } else {
        setPhase('bot');
      }
    } else {
      const next = (current + 1) % 4;
      setCurrentPlayer(next);
      setDiceValue(null);
      if (next === 0) {
        setPhase('roll');
      } else {
        setPhase('bot');
      }
    }
  }, []);

  // Human roll
  const rollDice = useCallback(() => {
    if (phase !== 'roll' || currentPlayer !== 0) return;
    setRolling(true);
    let frames = 0;
    const interval = setInterval(() => {
      setRollDisplay(Math.floor(Math.random() * 6) + 1);
      frames++;
      if (frames >= 12) {
        clearInterval(interval);
        const val = Math.floor(Math.random() * 6) + 1;
        setDiceValue(val);
        setRollDisplay(val);
        setRolling(false);
        try { navigator.vibrate?.(20); } catch {}

        const movable = getMovableTokenIds(0, val, tokens);
        if (movable.length === 0) {
          timeoutRef.current = setTimeout(() => nextPlayer(0, false), 800);
        } else if (movable.length === 1) {
          // Auto-move single option
          timeoutRef.current = setTimeout(() => {
            const { newTokens, captured, capturedPos: cp } = moveToken(movable[0], val, tokens);
            if (captured && cp) { setCapturePos(cp); setTimeout(() => setCapturePos(null), 600); }
            const pts = captured ? 20 : (val === 6 ? 5 : 0) + (newTokens.find(t => t.id === movable[0])?.state === 'finished' ? 10 : 0);
            setScore(s => s + pts);
            setTokens(newTokens);
            if (checkWin(newTokens, 0)) {
              setWinner(0); setPhase('won');
              if (score + pts > bestScore.current) { bestScore.current = score + pts; try { localStorage.setItem(STORAGE_KEY, String(score + pts)); } catch {} }
            } else {
              nextPlayer(0, val === 6);
            }
          }, 400);
        } else {
          setMovableTokens(movable);
          setPhase('move');
        }
      }
    }, 60);
  }, [phase, currentPlayer, tokens, getMovableTokenIds, moveToken, nextPlayer, checkWin, score]);

  // Human selects token
  const selectToken = useCallback((tokenId: number) => {
    if (phase !== 'move' || !movableTokens.includes(tokenId) || diceValue === null) return;
    const { newTokens, captured, capturedPos: cp } = moveToken(tokenId, diceValue, tokens);
    if (captured && cp) { setCapturePos(cp); setTimeout(() => setCapturePos(null), 600); }
    const pts = captured ? 20 : (diceValue === 6 ? 5 : 0) + (newTokens.find(t => t.id === tokenId)?.state === 'finished' ? 10 : 0);
    setScore(s => s + pts);
    setTokens(newTokens);
    setMovableTokens([]);
    if (checkWin(newTokens, 0)) {
      setWinner(0); setPhase('won');
      if (score + pts > bestScore.current) { bestScore.current = score + pts; try { localStorage.setItem(STORAGE_KEY, String(score + pts)); } catch {} }
    } else {
      nextPlayer(0, diceValue === 6);
    }
  }, [phase, movableTokens, diceValue, tokens, moveToken, nextPlayer, checkWin, score]);

  // Bot AI
  useEffect(() => {
    if (phase !== 'bot' || currentPlayer === 0) return;

    const botTurn = () => {
      const dice = Math.floor(Math.random() * 6) + 1;
      setDiceValue(dice);
      setRollDisplay(dice);

      timeoutRef.current = setTimeout(() => {
        const movable = getMovableTokenIds(currentPlayer, dice, tokens);
        if (movable.length === 0) {
          nextPlayer(currentPlayer, false);
          return;
        }

        // Bot priority: capture > furthest along > bring out on 6
        let chosen = movable[0];
        const playerTokens = tokens.filter(t => movable.includes(t.id));

        // Try to capture
        for (const tid of movable) {
          const { captured } = moveToken(tid, dice, tokens);
          if (captured) { chosen = tid; break; }
        }

        // Prefer furthest token
        if (chosen === movable[0]) {
          let maxPath = -2;
          for (const t of playerTokens) {
            if (t.pathIndex > maxPath) { maxPath = t.pathIndex; chosen = t.id; }
          }
        }

        // Bring out on 6
        if (dice === 6) {
          const homeToken = playerTokens.find(t => t.state === 'home');
          if (homeToken) chosen = homeToken.id;
        }

        const { newTokens, captured, capturedPos: cp } = moveToken(chosen, dice, tokens);
        if (captured && cp) { setCapturePos(cp); setTimeout(() => setCapturePos(null), 600); }
        setTokens(newTokens);

        if (checkWin(newTokens, currentPlayer)) {
          setWinner(currentPlayer); setPhase('won');
        } else {
          nextPlayer(currentPlayer, dice === 6);
        }
      }, 1000);
    };

    timeoutRef.current = setTimeout(botTurn, 1200);
  }, [phase, currentPlayer, tokens, getMovableTokenIds, moveToken, nextPlayer, checkWin]);

  const boardSize = Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 380, 420);
  const homeColumns = [0, 1, 2, 3].map(p => getHomeColumn(p));

  // Get token screen position
  const getTokenPos = (token: TokenState): { x: number; y: number } | null => {
    if (token.state === 'home') return null; // rendered in home base
    if (token.state === 'finished') return null;
    if (token.pathIndex >= 0 && token.pathIndex < 52) {
      const absSquare = getAbsoluteSquare(token.player, token.pathIndex);
      return BOARD_PATH[absSquare];
    }
    if (token.pathIndex >= 52 && token.pathIndex < 58) {
      const col = homeColumns[token.player];
      return col[token.pathIndex - 52];
    }
    return null;
  };

  const homeBasePositions = [
    { x: 12, y: 12 }, // P0 top-left
    { x: 70, y: 12 }, // P1 top-right
    { x: 70, y: 70 }, // P2 bottom-right
    { x: 12, y: 70 }, // P3 bottom-left
  ];

  const resetGame = useCallback(() => {
    setTokens(initTokens());
    setCurrentPlayer(0);
    setDiceValue(null);
    setPhase('roll');
    setMovableTokens([]);
    setWinner(null);
    setScore(0);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0B132B', position: 'relative', overflow: 'auto' }}>
      <GameHeader score={score} accentColor={ACCENT} onBack={onBack} extraInfo={PLAYER_NAMES[currentPlayer]} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 70, gap: 16 }}>
        {/* Board */}
        <div
          ref={boardRef}
          style={{
            width: boardSize, height: boardSize, position: 'relative',
            background: `repeating-linear-gradient(92deg, rgba(255,255,255,0.03) 0px, transparent 2px), repeating-linear-gradient(178deg, rgba(0,0,0,0.05) 0px, transparent 3px), #8B6914`,
            border: '4px solid #6B4F10', borderRadius: 16,
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* Path squares */}
          {BOARD_PATH.map((pos, i) => (
            <div
              key={`sq-${i}`}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%,-50%)',
                width: 26, height: 26, borderRadius: 6,
                background: SAFE_SQUARES.includes(i)
                  ? 'rgba(255,215,0,0.25)'
                  : ENTRY_SQUARES.includes(i)
                    ? `${PLAYER_COLORS[ENTRY_SQUARES.indexOf(i)]}33`
                    : 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9,
              }}
            >
              {SAFE_SQUARES.includes(i) && '⭐'}
            </div>
          ))}

          {/* Home columns */}
          {homeColumns.map((col, p) =>
            col.map((pos, i) => (
              <div
                key={`hc-${p}-${i}`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 24, height: 24, borderRadius: 6,
                  background: `${PLAYER_COLORS[p]}33`,
                  border: `1px solid ${PLAYER_COLORS[p]}55`,
                }}
              />
            ))
          )}

          {/* Home bases */}
          {[0, 1, 2, 3].map(p => {
            const base = homeBasePositions[p];
            const homeTokens = tokens.filter(t => t.player === p && t.state === 'home');
            return (
              <div
                key={`base-${p}`}
                style={{
                  position: 'absolute',
                  left: `${base.x}%`, top: `${base.y}%`,
                  width: 60, height: 60, borderRadius: 12,
                  background: `${PLAYER_COLORS[p]}15`,
                  border: `1.5px solid ${PLAYER_COLORS[p]}44`,
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                  padding: 6, alignItems: 'center', justifyItems: 'center',
                }}
              >
                {[0, 1, 2, 3].map(slot => {
                  const tok = homeTokens[slot];
                  return (
                    <div
                      key={slot}
                      onClick={() => tok && selectToken(tok.id)}
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: tok ? PLAYER_COLORS[p] : `${PLAYER_COLORS[p]}22`,
                        border: tok ? '2px solid white' : `1px solid ${PLAYER_COLORS[p]}33`,
                        boxShadow: tok ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
                        cursor: tok && movableTokens.includes(tok.id) ? 'pointer' : 'default',
                        animation: tok && movableTokens.includes(tok.id) ? 'pulse 1s infinite' : 'none',
                        transition: 'transform 0.15s',
                      }}
                    />
                  );
                })}
              </div>
            );
          })}

          {/* Active tokens on board */}
          {tokens.filter(t => t.state === 'active').map(token => {
            const pos = getTokenPos(token);
            if (!pos) return null;
            const isMovable = movableTokens.includes(token.id);
            // Stack offset for tokens on same square
            const sameSquare = tokens.filter(t => t.state === 'active' && t.id !== token.id && getTokenPos(t)?.x === pos.x && getTokenPos(t)?.y === pos.y);
            const stackOffset = sameSquare.length > 0 ? (token.id % 2 === 0 ? -4 : 4) : 0;
            return (
              <div
                key={token.id}
                onClick={() => isMovable && selectToken(token.id)}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: `translate(-50%,-50%) translate(${stackOffset}px, ${stackOffset}px)`,
                  width: 20, height: 20, borderRadius: '50%',
                  background: PLAYER_COLORS[token.player],
                  border: '2px solid white',
                  boxShadow: `0 2px 6px rgba(0,0,0,0.5)${isMovable ? `, 0 0 8px ${PLAYER_COLORS[token.player]}` : ''}`,
                  cursor: isMovable ? 'pointer' : 'default',
                  animation: isMovable ? 'pulse 1s infinite' : 'none',
                  transition: 'left 0.3s ease, top 0.3s ease',
                  zIndex: isMovable ? 10 : 5,
                }}
              />
            );
          })}

          {/* Capture effect */}
          {capturePos && (
            <div style={{
              position: 'absolute',
              left: `${capturePos.x}%`, top: `${capturePos.y}%`,
              transform: 'translate(-50%,-50%)',
              fontSize: 24, zIndex: 20,
              animation: 'celebPop 0.6s ease-out forwards',
            }}>💥</div>
          )}

          {/* Dice in center */}
          <div
            onClick={rollDice}
            style={{
              position: 'absolute',
              left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
              width: 58, height: 58, borderRadius: 14,
              background: '#1C2541',
              border: `2px solid ${PLAYER_COLORS[currentPlayer]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: phase === 'roll' && currentPlayer === 0 ? 'pointer' : 'default',
              boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
              transition: 'border-color 0.25s, transform 0.1s',
              ...(rolling ? { animation: 'wrongShake 0.15s infinite' } : {}),
            }}
          >
            <div style={{ position: 'relative', width: 40, height: 40 }}>
              {DICE_DOTS[rollDisplay - 1]?.map((dot, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${dot[0]}%`, top: `${dot[1]}%`,
                    transform: 'translate(-50%,-50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#E8EAF6',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
        }}>
          {[0, 1, 2, 3].map(p => {
            const finished = tokens.filter(t => t.player === p && t.state === 'finished').length;
            return (
              <div key={p} style={{
                background: currentPlayer === p ? `${PLAYER_COLORS[p]}22` : '#1C2541',
                border: `1.5px solid ${currentPlayer === p ? PLAYER_COLORS[p] : '#243057'}`,
                borderRadius: 12, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[p] }} />
                <span style={{ fontSize: 11, color: '#E8EAF6', fontFamily: 'Outfit, sans-serif' }}>
                  {finished}/4
                </span>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        {phase === 'roll' && currentPlayer === 0 && (
          <div style={{ fontSize: 13, color: '#7a8ab5', fontFamily: 'Outfit, sans-serif', textAlign: 'center' }}>
            Tap dice to roll
          </div>
        )}
        {phase === 'move' && (
          <div style={{ fontSize: 13, color: ACCENT, fontFamily: 'Outfit, sans-serif', textAlign: 'center' }}>
            Tap a token to move ({diceValue})
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes celebPop { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 50%{transform:translate(-50%,-50%) scale(1.4);opacity:1} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
        @keyframes wrongShake { 0%,100%{transform:translate(-50%,-50%) rotate(0)} 25%{transform:translate(-50%,-50%) rotate(-8deg)} 75%{transform:translate(-50%,-50%) rotate(8deg)} }
      `}</style>

      <GameOverModal
        visible={winner !== null}
        score={score}
        bestScore={bestScore.current}
        xpEarned={winner === 0 ? 20 : 10}
        accentColor={ACCENT}
        onRetry={resetGame}
        onMenu={onBack}
      />
    </div>
  );
}
