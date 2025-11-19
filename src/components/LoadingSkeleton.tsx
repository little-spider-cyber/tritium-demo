import React from 'react';

export const LoadingSkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-black h-screen flex flex-col text-text-primary">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 flex-none">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="h-10 w-64 bg-gray-800 rounded-full animate-pulse" />
      </div>

      {/* Table Header Skeleton */}
      <div className="border border-border-custom rounded-lg flex-1 overflow-hidden">
        <div className="flex border-b border-border-custom bg-black p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="flex-1 h-6 bg-gray-800 rounded animate-pulse mx-2" />
            ))}
        </div>
        
        {/* Table Rows Skeleton */}
        <div className="p-4 space-y-4">
           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
             <div key={row} className="flex items-center space-x-4">
               <div className="h-12 w-12 rounded-full bg-gray-800 animate-pulse" />
               <div className="flex-1 space-y-2">
                 <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                 <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
               </div>
               <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" />
               <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" />
               <div className="w-32 h-8 bg-gray-800 rounded animate-pulse" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

