import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getLevelData } from '@/utils/xp';

interface Props { onBack: () => void; }

const BADGES = [
  { id: 'first_boot', icon: '🎮', name: 'First Boot', desc: 'Play any game', check: () => parseInt(localStorage.getItem('lumatha_games_total') || '0', 10) >= 1 },
  { id: 'after_school', icon: '🏫', name: 'After School', desc: 'Play all 7 games', check: () => {
    return ['lumatha_bb_plays', 'lumatha_neon-trail_plays', 'lumatha_echo-flip_plays', 'lumatha_cd_plays', 'lumatha_sc_plays', 'lumatha_ss_plays', 'lumatha_pf_plays'].every(k => parseInt(localStorage.getItem(k) || '0', 10) > 0);
  }},
  { id: 'lab_reg', icon: '🧱', name: 'Lab Regular', desc: 'Score 200+ in Brick Bounce', check: () => parseInt(localStorage.getItem('lumatha_bb_best') || '0', 10) >= 200 },
  { id: 'neon_vet', icon: '🐍', name: 'Neon Veteran', desc: 'Score 100+ in Neon Trail', check: () => parseInt(localStorage.getItem('lumatha_nt_best') || '0', 10) >= 100 },
  { id: 'perfect_mem', icon: '🧠', name: 'Perfect Memory', desc: '8 moves or less in Echo Flip', check: () => localStorage.getItem('lumatha_ef_perfect') === '1' },
  { id: 'dice_master', icon: '🎲', name: 'Dice Master', desc: 'Win 5 Courtyard Dice games', check: () => parseInt(localStorage.getItem('lumatha_cd_wins') || '0', 10) >= 5 },
  { id: 'sharp_striker', icon: '🎯', name: 'Sharp Striker', desc: 'Score 15+ in Strike Circle', check: () => parseInt(localStorage.getItem('lumatha_sc_best') || '0', 10) >= 15 },
  { id: 'street_legend', icon: '🏏', name: 'Street Legend', desc: 'Score 50+ in Street Six', check: () => parseInt(localStorage.getItem('lumatha_ss_best') || '0', 10) >= 50 },
  { id: 'paper_champ', icon: '📄', name: 'Paper Champion', desc: 'Win 5 Paper Flick games', check: () => parseInt(localStorage.getItem('lumatha_pf_wins') || '0', 10) >= 5 },
  { id: 'night_owl', icon: '🌙', name: 'Night Owl', desc: 'Play after 10 PM', check: () => localStorage.getItem('lumatha_night_owl') === '1' },
  { id: 'on_fire', icon: '🔥', name: 'On Fire', desc: '3 different games in one day', check: () => localStorage.getItem('lumatha_on_fire') === '1' },
  { id: 'retro_master', icon: '⭐', name: 'Retro Master', desc: 'Reach Level 10', check: () => getLevelData().level >= 10 },
];

const GAME_EMOJIS: Record<string, string> = {
  'lumatha_bb_plays': '🧱', 'lumatha_neon-trail_plays': '🐍', 'lumatha_echo-flip_plays': '🃏',
  'lumatha_cd_plays': '🎲', 'lumatha_sc_plays': '🎯', 'lumatha_ss_plays': '🏏', 'lumatha_pf_plays': '✈️',
};

export function ProfileScreen({ onBack }: Props) {
  const [name, setName] = useState(() => localStorage.getItem('lumatha_name') || 'Player');
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ld = getLevelData();

  const gamesTotal = parseInt(localStorage.getItem('lumatha_games_total') || '0', 10);
  const bestScores = [
    parseInt(localStorage.getItem('lumatha_bb_best') || '0', 10),
    parseInt(localStorage.getItem('lumatha_nt_best') || '0', 10),
    parseInt(localStorage.getItem('lumatha_ef_best') || '0', 10),
    parseInt(localStorage.getItem('lumatha_sc_best') || '0', 10),
    parseInt(localStorage.getItem('lumatha_ss_best') || '0', 10),
  ];
  const best = Math.max(...bestScores, 0);

  let favEmoji = '🎮', maxPlays = 0;
  for (const [key, emoji] of Object.entries(GAME_EMOJIS)) {
    const c = parseInt(localStorage.getItem(key) || '0', 10);
    if (c > maxPlays) { maxPlays = c; favEmoji = emoji; }
  }

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const saveName = (v: string) => { const t = v.trim() || 'Player'; setName(t); localStorage.setItem('lumatha_name', t); setEditing(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%', minHeight: '100%', background: '#0B132B', overflow: 'auto', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: '#111d3a', padding: '32px 24px', borderRadius: '0 0 28px 28px', position: 'relative' }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 10,
          background: '#1C2541', border: '1px solid #243057', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 22, color: '#7a8ab5',
        }}>‹</button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, #4ECDC4, #00F5FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Outfit, sans-serif',
          }}>{name[0]?.toUpperCase() || 'P'}</div>

          {editing ? (
            <input autoFocus defaultValue={name} onBlur={(e) => saveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName((e.target as HTMLInputElement).value)}
              style={{ background: 'transparent', border: 'none', borderBottom: '1.5px solid #4ECDC4', fontSize: 20, fontWeight: 700, color: '#E8EAF6', fontFamily: 'Outfit, sans-serif', textAlign: 'center', outline: 'none', width: 160 }} />
          ) : (
            <span onClick={() => setEditing(true)} style={{ fontSize: 20, fontWeight: 700, color: '#E8EAF6', fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}>{name}</span>
          )}

          <span style={{ background: 'rgba(255,209,102,0.13)', border: '1px solid #FFD166', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: '#FFD166', fontFamily: 'Outfit, sans-serif' }}>{ld.levelName}</span>

          <div style={{ width: '100%', marginTop: 6 }}>
            <div style={{ height: 8, background: '#243057', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #4ECDC4, #00F5FF)', borderRadius: 4, width: mounted ? `${ld.percent}%` : '0%', transition: 'width 1.2s ease-out' }} />
            </div>
            <div style={{ textAlign: 'right', marginTop: 4, fontSize: 11, color: '#7a8ab5', fontFamily: 'Outfit, sans-serif' }}>
              {ld.currentXP} / {ld.xpNeeded} XP
            </div>
          </div>
        </div>
      </div>

      {gamesTotal === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🎮</span>
          <span style={{ fontSize: 15, color: '#7a8ab5', fontFamily: 'Outfit, sans-serif' }}>No games played yet</span>
          <button onClick={onBack} style={{ background: '#4ECDC4', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 700, color: '#0B132B', fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}>Go play something →</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0' }}>
            {[{ value: gamesTotal, label: 'Games' }, { value: best, label: 'Best' }, { value: favEmoji, label: 'Fav Game' }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: '#1C2541', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: typeof s.value === 'number' ? 22 : 28, fontWeight: 700, color: '#E8EAF6', fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#7a8ab5', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '20px 20px 0' }}>
            <span style={{ fontSize: 11, letterSpacing: 3, color: '#4ECDC4', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif', fontWeight: 700, display: 'block', marginBottom: 16 }}>BADGES</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {BADGES.map(b => {
                const unlocked = b.check();
                return (
                  <div key={b.id} style={{
                    background: '#1C2541', borderRadius: 14, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    opacity: unlocked ? 1 : 0.28, filter: unlocked ? 'none' : 'grayscale(1)',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(78,205,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{b.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAF6', fontFamily: 'Outfit, sans-serif' }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#7a8ab5', fontFamily: 'Outfit, sans-serif' }}>{b.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
