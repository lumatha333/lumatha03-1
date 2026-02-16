import { useMemo } from 'react';

const doses = [
  { type: 'quote', text: '"The only way to do great work is to love what you do." — Steve Jobs' },
  { type: 'joke', text: 'Why do programmers prefer dark mode? Because light attracts bugs.' },
  { type: 'fact', text: 'Did you know? Honey never spoils. Archaeologists found 3000-year-old honey still edible.' },
  { type: 'quote', text: '"In the middle of difficulty lies opportunity." — Albert Einstein' },
  { type: 'joke', text: 'I told my computer I needed a break, and now it won\'t stop sending me Kit-Kat ads.' },
  { type: 'fact', text: 'Did you know? Octopuses have three hearts and blue blood.' },
  { type: 'quote', text: '"It does not matter how slowly you go as long as you do not stop." — Confucius' },
];

export function DailyDoseCard() {
  const dose = useMemo(() => {
    // Rotate once per day based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return doses[dayOfYear % doses.length];
  }, []);

  const label = dose.type === 'quote' ? '💭 Daily Quote' : dose.type === 'joke' ? '😄 Daily Smile' : '🧠 Did You Know?';

  return (
    <div className="rounded-2xl p-3.5 mt-4" style={{ background: 'hsl(220 45% 16%)' }}>
      <p className="text-[10px] font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-xs italic text-foreground/80 leading-relaxed">{dose.text}</p>
    </div>
  );
}
