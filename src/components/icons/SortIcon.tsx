import React from 'react';

interface SortIconProps extends React.SVGProps<SVGSVGElement> {
  sortState?: 'asc' | 'desc' | false | null;
}

export const SortIcon = ({ sortState, className, ...props }: SortIconProps) => {
  // Colors from design:
  // Inactive/Default: opacity 0.4 (handled by parent class or internal style)
  // Active: opacity 1, fill #eeabbd (pink)
  
  const activeColor = "#eeabbd";
  
  // Determine opacity for each arrow based on sort state
  const upOpacity = sortState === 'asc' ? 1 : 0.4;
  const downOpacity = sortState === 'desc' ? 1 : 0.4;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" viewBox="0 0 5.997 10" className={className} {...props}>
      <g transform="translate(-212 -498)">
        {/* Up Arrow (Ascending) */}
        <path 
            d="M2.6.534a.5.5,0,0,1,.8,0L5.4,3.2A.5.5,0,0,1,5,4H1a.5.5,0,0,1-.4-.8Z" 
            transform="translate(217.997 508) rotate(180)"
            fill={activeColor}
            opacity={upOpacity}
        />
        {/* Down Arrow (Descending) */}
        <path 
            d="M2.6.534a.5.5,0,0,1,.8,0L5.4,3.2A.5.5,0,0,1,5,4H1a.5.5,0,0,1-.4-.8Z" 
            transform="translate(212 498)"
            fill={activeColor}
            opacity={downOpacity}
        />
      </g>
    </svg>
  );
};
