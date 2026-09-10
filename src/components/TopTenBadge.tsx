import React from 'react';

interface TopTenBadgeProps {
  rank: number; // 1 to 10
}

/**
 * Netflix-style stylized giant ranking number overlay (1-10)
 */
export const TopTenBadge: React.FC<TopTenBadgeProps> = ({ rank }) => {
  return (
    <div className="relative flex items-center select-none pointer-events-none shrink-0 w-20 sm:w-28 -mr-6 sm:-mr-8 z-10">
      <span
        className="text-7xl sm:text-9xl font-black tracking-tighter text-[#141414] leading-none"
        style={{
          WebkitTextStroke: '3.5px #595959',
          filter: 'drop-shadow(3px 4px 10px rgba(0,0,0,0.85))',
        }}
      >
        {rank}
      </span>
    </div>
  );
};
