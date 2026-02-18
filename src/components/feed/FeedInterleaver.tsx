import { ReactNode } from 'react';
import { AdventureTeasersInsert } from './AdventureTeasersInsert';
import { QuickConnectInsert } from './QuickConnectInsert';
import { GameHighScoresInsert } from './GameHighScoresInsert';
import { DailyStreakInsert } from './DailyStreakInsert';
import { QuickNavInsert } from './QuickNavWidgets';
import { StopPointCard } from './StopPointCard';

interface FeedInterleaverProps {
  posts: any[];
  renderPost: (post: any, index: number) => ReactNode;
}

// Deterministic rotation: every 4 posts inject a mini-section
const INSERT_CYCLE = [
  { Component: AdventureTeasersInsert, key: 'adventure' },
  { Component: QuickConnectInsert, key: 'connect' },
  { Component: GameHighScoresInsert, key: 'scores' },
  { Component: DailyStreakInsert, key: 'streak' },
];

const STOP_POINT_INTERVAL = 16;

export function FeedInterleaver({ posts, renderPost }: FeedInterleaverProps) {
  const elements: ReactNode[] = [];
  let insertIndex = 0;
  let totalItems = 0;
  let quickNavCount = 0;

  for (let i = 0; i < posts.length; i++) {
    elements.push(renderPost(posts[i], i));
    totalItems++;

    // Insert mini-section after every 4 posts
    if ((i + 1) % 4 === 0 && i < posts.length - 1) {
      const { Component, key } = INSERT_CYCLE[insertIndex % INSERT_CYCLE.length];
      elements.push(<Component key={`insert-${key}-${i}`} />);
      insertIndex++;
      totalItems++;

      // After every 2 inserts, also add QuickNav widgets
      if (insertIndex % 2 === 0) {
        elements.push(<QuickNavInsert key={`quicknav-${i}`} insertIndex={quickNavCount} />);
        quickNavCount++;
        totalItems++;
      }
    }

    // Show stop point after STOP_POINT_INTERVAL items
    if (totalItems === STOP_POINT_INTERVAL && i < posts.length - 1) {
      elements.push(<StopPointCard key={`stop-${i}`} />);
      totalItems++;
    }
  }

  return <div className="space-y-3 animate-stagger">{elements}</div>;
}
