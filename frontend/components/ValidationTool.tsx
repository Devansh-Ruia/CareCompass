'use client';

import { useState, useRef } from 'react';
import { api, PolicyData, BillValidationResult } from '../lib/api';

interface ValidationToolProps {
  policyData: PolicyData;
}

// Markdown parsing helpers
const formatInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
};

const parseMarkdownText = (text: string): JSX.Element[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const elements: JSX.Element[] = [];
  let currentList: { type: 'ordered' | 'unordered' | null; items: string[] } = { type: null, items: [] };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check for ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (currentList.type !== 'ordered') {
        if (currentList.items.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="space-y-1 mb-4">
              {currentList.items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
                </li>
              ))}
            </ul>
          );
        }
        currentList = { type: 'ordered', items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s/, ''));
      return;
    }
    
    // Check for unordered list
    if (/^[•\-\*]\s/.test(trimmed)) {
      if (currentList.type !== 'unordered') {
        if (currentList.items.length > 0) {
          elements.push(
            <ol key={`list-${index}`} className="space-y-1 mb-4 list-decimal list-inside">
              {currentList.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              ))}
            </ol>
          );
        }
        currentList = { type: 'unordered', items: [] };
      }
      currentList.items.push(trimmed.replace(/^[•\-\*]\s/, ''));
      return;
    }
    
    // Regular paragraph
    if (currentList.items.length > 0) {
      if (currentList.type === 'ordered') {
        elements.push(
          <ol key={`list-${index}`} className="space-y-1 mb-4 list-decimal list-inside">
            {currentList.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${index}`} className="space-y-1 mb-4">
            {currentList.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>
        );
      }
      currentList = { type: null, items: [] };
    }
    
    elements.push(
      <p key={`para-${index}`} className="mb-4" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
    );
  });
  
  // Handle remaining list
  if (currentList.items.length > 0) {
    if (currentList.type === 'ordered') {
      elements.push(
        <ol key="final-list" className="space-y-1 mb-4 list-decimal list-inside">
          {currentList.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key="final-list" className="space-y-1 mb-4">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            </li>
          ))}
        </ul>
      );
    }
  }
  
  return elements;
};

// FormattedText component
const FormattedText = ({ text }: { text: string }) => {
  const hasMarkdown = /\*\*.*?\*\*|`.*?`|^\d+\.\s|^[•\-\*]\s/m.test(text);
  
  if (hasMarkdown) {
    return <>{parseMarkdownText(text)}</>;
  }
  
  return <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />;
};

// Confidence Meter Component
function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';
  
  const getWidthClass = () => {
    if (value >= 90) return 'w-[90%]';
    if (value >= 80) return 'w-[80%]';
    if (value >= 70) return 'w-[70%]';
    if (value >= 60) return 'w-[60%]';
    if (value >= 50) return 'w-[50%]';
    if (value >= 40) return 'w-[40%]';
    if (value >= 30) return 'w-[30%]';
    if (value >= 20) return 'w-[20%]';
    if (value >= 10) return 'w-[10%]';
    return 'w-[5%]';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all ${getWidthClass()}`} />
      </div>
      <span className="text-sm font-medium text-gray-700">{value}%</span>
    </div>
  );
}

export default function ValidationTool({ policyData }: ValidationToolProps) {
  const [result, setResult] = useState<BillValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Analyze
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.uploadBill(file, policyData);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPreview(null);
    setError(null);
    setShowBillDetails(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!result && !loading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-subtle p-16 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload bill photo for validation"
            title="Upload bill photo for validation"
          />
          
          <div className="text-6xl mb-6">📸</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Take a Photo of Your Bill
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            AI will extract the details and validate against your policy
          </p>
          <button className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all">
            Upload Bill Photo
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-16 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl animate-bounce">🔍</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyzing your bill...</h3>
          <p className="text-gray-600">AI is extracting charges and validating against your policy</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
              <p className="text-sm text-gray-500 mb-1">Billed Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(result.financial_summary?.billed_amount || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
              <p className="text-sm text-gray-500 mb-1">Your Responsibility</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(result.financial_summary?.actual_patient_responsibility || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
              <p className="text-sm text-gray-500 mb-1">Expected Amount</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${(result.financial_summary?.expected_patient_responsibility || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
              <p className="text-sm text-gray-500 mb-1">Potential Savings</p>
              <p className="text-2xl font-bold text-blue-600">
                ${(result.financial_summary?.potential_savings || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Validation Results */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Validation Results</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-xl text-center ${
                result.validation_results?.deductible_applied_correctly 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="text-2xl">{result.validation_results?.deductible_applied_correctly ? '✓' : '✗'}</p>
                <p className="text-sm font-medium">Deductible</p>
              </div>
              <div className={`p-4 rounded-xl text-center ${
                result.validation_results?.copays_correct 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="text-2xl">{result.validation_results?.copays_correct ? '✓' : '✗'}</p>
                <p className="text-sm font-medium">Copays</p>
              </div>
              <div className={`p-4 rounded-xl text-center ${
                result.validation_results?.coinsurance_correct 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p className="text-2xl">{result.validation_results?.coinsurance_correct ? '✓' : '✗'}</p>
                <p className="text-sm font-medium">Coinsurance</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-blue-50 text-blue-700">
                <ConfidenceMeter value={result.confidence_score || 0} />
              </div>
            </div>

            {/* Issues Found */}
            {result.issues_found && result.issues_found.length > 0 && (
              <div className="mb-6 bg-error/10 border-l-4 border-error rounded-r-xl p-4">
                <h4 className="text-sm font-medium text-error mb-3">⚠️ Issues Found</h4>
                <ul className="text-sm text-error space-y-2">
                  {result.issues_found.map((issue, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-error mt-0.5">•</span>
                      <FormattedText text={issue} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-info/10 border-l-4 border-info rounded-r-xl p-4">
                <h4 className="text-sm font-medium text-info mb-3">💡 Recommendations</h4>
                <ul className="text-sm text-info space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-info mt-0.5">•</span>
                      <FormattedText text={rec} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Collapsible Bill Details */}
          {result.bill_extracted && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle overflow-hidden">
              <button
                onClick={() => setShowBillDetails(!showBillDetails)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Extracted Bill Details</span>
                <span className={`transition-transform ${showBillDetails ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showBillDetails && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <pre className="mt-4 p-4 bg-gray-50 rounded-xl text-sm overflow-x-auto">
                    {JSON.stringify(result.bill_extracted, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            onClick={reset}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            Validate Another Bill
          </button>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border-l-4 border-error rounded-r-xl p-4 text-error">
          {error}
          <button onClick={reset} className="ml-4 underline hover:no-underline">Try again</button>
        </div>
      )}
    </div>
  );
}
