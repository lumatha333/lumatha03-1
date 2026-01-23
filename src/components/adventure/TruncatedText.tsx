import { useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxWords?: number;
  className?: string;
}

export function TruncatedText({ text, maxWords = 50, className = '' }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  
  const words = text.split(/\s+/);
  const shouldTruncate = words.length > maxWords;
  
  if (!shouldTruncate || expanded) {
    return (
      <p className={className}>
        {text}
        {shouldTruncate && (
          <button 
            onClick={() => setExpanded(false)}
            className="text-primary text-xs font-medium ml-1 hover:underline"
          >
            see less
          </button>
        )}
      </p>
    );
  }
  
  const truncatedText = words.slice(0, maxWords).join(' ');
  
  return (
    <p className={className}>
      {truncatedText}...
      <button 
        onClick={() => setExpanded(true)}
        className="text-primary text-xs font-medium ml-1 hover:underline"
      >
        see more
      </button>
    </p>
  );
}
