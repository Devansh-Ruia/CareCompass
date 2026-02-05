'use client';

import React from 'react';

export const SkeletonCard = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`h-4 bg-gray-200 rounded animate-pulse ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonAvatar = () => (
  <div className="animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
  </div>
);

export const SkeletonButton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const AIThinkingIndicator = ({ message = 'Analyzing...' }: { message?: string }) => (
  <div className="flex items-center gap-3 text-gray-500 py-4">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
    </div>
    <span className="text-sm">{message}</span>
  </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500 ${sizeClasses[size]} ${className}`} />
  );
};

export const PageLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">Loading MedFin...</p>
    </div>
  </div>
);

export const CardLoading = ({ title }: { title?: string }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="animate-pulse space-y-4">
      {title && <div className="h-6 bg-gray-200 rounded w-1/3"></div>}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const FormLoading = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    ))}
    <div className="h-10 bg-gray-200 rounded w-32"></div>
  </div>
);
