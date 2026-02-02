'use client';

import { useState } from 'react';

interface PrivacyPanelProps {
  onClearData?: () => void;
  onExportData?: () => void;
  onImportData?: (data: string) => void;
}

export default function PrivacyPanel({ onClearData, onExportData, onImportData }: PrivacyPanelProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');

  const handleImport = () => {
    if (importData.trim() && onImportData) {
      try {
        // Validate JSON before importing
        JSON.parse(importData);
        onImportData(importData);
        setImportData('');
        setShowImportDialog(false);
      } catch (error) {
        alert('Invalid data format. Please ensure you are importing valid JSON data.');
      }
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportData) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          JSON.parse(content);
          onImportData(content);
          setShowImportDialog(false);
        } catch (error) {
          alert('Invalid file format. Please ensure you are importing a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🔒</span>
        Your Privacy Controls
      </h3>
      
      <div className="space-y-4">
        {/* Data Storage */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Data Storage</p>
            <p className="text-sm text-gray-500">Your policy data is stored only in your browser</p>
          </div>
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Local Only ✓
          </span>
        </div>
        
        {/* AI Processing */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="font-medium text-gray-900">AI Processing</p>
            <p className="text-sm text-gray-500">Policy analyzed via secure API, not stored</p>
          </div>
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Ephemeral ✓
          </span>
        </div>
        
        {/* Account Required */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Account Required</p>
            <p className="text-sm text-gray-500">No login or insurance credentials needed</p>
          </div>
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            None ✓
          </span>
        </div>
        
        <hr className="border-gray-200" />
        
        {/* Data Management Actions */}
        <div className="space-y-2">
          <button 
            onClick={onClearData}
            className="w-full py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            Clear All Data
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={onExportData}
              className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <span>📤</span>
              Export My Data
            </button>
            <button 
              onClick={() => setShowImportDialog(true)}
              className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <span>📥</span>
              Import Data
            </button>
          </div>
        </div>
        
        {/* Privacy Details */}
        <details className="bg-white rounded-lg">
          <summary className="p-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 rounded-lg">
            Learn more about our privacy approach
          </summary>
          <div className="p-3 pt-0 text-sm text-gray-600 space-y-2">
            <p>
              <strong>Local Storage:</strong> All your policy information, analysis results, and personal data are stored locally in your browser using IndexedDB. We never upload or store your data on our servers.
            </p>
            <p>
              <strong>AI Privacy:</strong> When you analyze a policy, only the relevant text is sent to Google's Gemini API for processing. The text is not stored, logged, or used for training. Each request is isolated and ephemeral.
            </p>
            <p>
              <strong>No Tracking:</strong> We don't use analytics, cookies, or tracking pixels. Your usage patterns and personal information remain private.
            </p>
            <p>
              <strong>Data Portability:</strong> You can export all your data at any time in JSON format and import it to restore your setup on any device.
            </p>
            <p>
              <strong>Security:</strong> All API communications use HTTPS encryption. Your data is never transmitted over insecure connections.
            </p>
          </div>
        </details>
      </div>
      
      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h4 className="font-semibold text-gray-900 mb-4">Import Your Data</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option 1: Paste JSON data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your exported JSON data here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={6}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Option 2: Upload JSON file
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-label="Import JSON file with your data"
                  title="Select a JSON file to import your MedFin data"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleImport}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
