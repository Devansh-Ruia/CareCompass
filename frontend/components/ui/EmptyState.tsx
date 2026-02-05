'use client';

import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-500 mt-1 max-w-sm">{description}</p>
      {action && (
        <button 
          onClick={action.onClick} 
          className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Common empty state configurations
export const EmptyStates = {
  NoPolicies: ({ onUpload }: { onUpload: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="No insurance policies"
      description="Get started by uploading your insurance policy documents to begin analyzing your coverage."
      action={{ label: 'Upload Policy', onClick: onUpload }}
    />
  ),

  NoQuestions: ({ onAsk }: { onAsk: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="No questions yet"
      description="Ask questions about your insurance coverage, deductibles, or medical costs."
      action={{ label: 'Ask a Question', onClick: onAsk }}
    />
  ),

  NoBills: ({ onUpload }: { onUpload: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14h6m-2-9v12m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="No medical bills"
      description="Upload your medical bills to validate charges and identify potential savings."
      action={{ label: 'Upload Bill', onClick: onUpload }}
    />
  ),

  NoFamilyMembers: ({ onAdd }: { onAdd: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No family members"
      description="Add family members to track insurance coverage and healthcare costs for everyone."
      action={{ label: 'Add Family Member', onClick: onAdd }}
    />
  ),

  NoSavings: ({ onTrack }: { onTrack: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="No savings tracked yet"
      description="Start tracking your healthcare savings by validating bills and optimizing your insurance."
      action={{ label: 'Start Tracking', onClick: onTrack }}
    />
  ),

  NoAppeals: ({ onCreate }: { onCreate: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h7a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zm10 0h7a1 1 0 011 1v5a1 1 0 01-1 1h-7a1 1 0 01-1-1V9a1 1 0 011-1z" />
        </svg>
      }
      title="No appeals created"
      description="Create appeal letters for denied claims to fight for the coverage you deserve."
      action={{ label: 'Create Appeal', onClick: onCreate }}
    />
  ),

  NoResults: ({ query }: { query: string }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={`No results found for "${query}". Try adjusting your search terms.`}
    />
  ),

  NetworkError: ({ onRetry }: { onRetry: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      }
      title="Connection error"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={{ label: 'Try Again', onClick: onRetry }}
    />
  ),

  Error: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <EmptyState
      icon={
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="Something went wrong"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  ),
};

export default EmptyState;
