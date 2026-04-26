import { useNavigate } from 'react-router-dom';

/**
 * FunPun Page - Retro Gaming Console
 * Back icon handled by Layout component | Console positioned for full mobile view
 */
export default function FunPun() {
  return (
    <div className="w-full h-screen overflow-hidden bg-black flex flex-col">
      {/* Game Console - Optimized mobile positioning */}
      <div className="w-full flex-1 -mt-1 md:mt-0">
        <iframe 
          src="/funpun.html" 
          className="w-full h-full border-none"
          title="FunPun FP-333 Console"
        />
      </div>
    </div>
  );
}
