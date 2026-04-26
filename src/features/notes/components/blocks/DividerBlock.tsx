import React from 'react';

export const DividerBlock: React.FC = () => {
  return (
    <div className="py-4 flex items-center justify-center">
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};
