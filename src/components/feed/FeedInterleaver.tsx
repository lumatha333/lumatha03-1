import { memo, ReactNode, useMemo } from 'react';
import { StopPointCard } from './StopPointCard';
import { PromotionalCard } from './PromotionalCards';

interface FeedInterleaverProps {
  posts: any[];
  renderPost: (post: any, index: number) => ReactNode;
  widgets?: ReactNode[];
}

const WIDGET_INTERVAL = 2; // Insert one vertically every 2 posts
const STOP_POINT_INTERVAL = 16;

export const FeedInterleaver = memo(function FeedInterleaver({ posts, renderPost, widgets = [] }: FeedInterleaverProps) {
  const elements = useMemo(() => {
    const rendered: ReactNode[] = [];
    let totalItems = 0;
    let widgetIndex = 0;

    for (let i = 0; i < posts.length; i++) {
      rendered.push(renderPost(posts[i], i));
      totalItems++;

      // Interleave one premium widget vertically after posts
      if ((i + 1) % WIDGET_INTERVAL === 0 && widgetIndex < widgets.length) {
        rendered.push(
          <div key={`widget-${widgetIndex}`} className="w-full flex-shrink-0 animate-stagger mb-4">
            {widgets[widgetIndex]}
          </div>
        );
        widgetIndex++;
        totalItems++;
      }

      // Show stop point after STOP_POINT_INTERVAL items
      if (totalItems === STOP_POINT_INTERVAL && i < posts.length - 1) {
        rendered.push(<StopPointCard key={`stop-${i}`} />);
        totalItems++;
      }
    }

    return rendered;
  }, [posts, renderPost]);

  return <div className="space-y-4 animate-stagger">{elements}</div>;
});
