import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft } from 'lucide-react';
import { NotesSection } from './NotesSection';

export default function Diary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070B14] flex flex-col">
      {/* Texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Main Content */}
      <div className="flex-1 relative z-10">
        <NotesSection />
      </div>

      {/* Back Button Overlay (in case NotesSection doesn't handle top exit) */}
      <div className="absolute top-4 left-4 z-[10000]">
         <button 
           onClick={() => navigate(-1)} 
           className="p-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-90"
         >
           <ChevronLeft className="w-6 h-6 text-white" />
         </button>
      </div>
    </div>
  );
}
