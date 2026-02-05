import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Markdown renderer component with consistent styling
 * Handles bold, italic, headers, lists, code blocks, etc.
 */
export default function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  // Convert children to string if it's not already
  const content = typeof children === 'string' ? children : React.Children.toArray(children).join('');
  
  return (
    <div className={`prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-blockquote:text-gray-600 prose-blockquote:border-l-gray-300 ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
