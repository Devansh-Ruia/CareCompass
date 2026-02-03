'use client';

import { useState } from 'react';
import { PolicyData } from '../lib/api';
import PolicySummary from './PolicySummary';
import EstimationTool from './EstimationTool';
import ValidationTool from './ValidationTool';
import OptimizationTool from './OptimizationTool';
import PreVisitTool from './PreVisitTool';
import AppealTool from './AppealTool';
import FamilyDashboard from './FamilyDashboard';
import SavingsTracker from './SavingsTracker';
import PrivacyPanel from './PrivacyPanel';
import { useSavings } from '../contexts/SavingsContext';
import { useFamily } from '../contexts/FamilyContext';

interface AIWorkspaceProps {
  policyData: PolicyData;
  onReset: () => void;
}

type TabType = 'dashboard' | 'pre-visit' | 'estimation' | 'validation' | 'appeal' | 'optimization' | 'family';

export default function AIWorkspace({ policyData, onReset }: AIWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { getSavingsStats } = useSavings();
  const { getPendingActions } = useFamily();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Overview & savings' },
    { id: 'pre-visit', label: 'Plan a Visit', icon: '�', description: 'Pre-visit checklist' },
    { id: 'estimation', label: 'Ask AI', icon: '💬', description: 'Coverage questions' },
    { id: 'validation', label: 'Validate Bill', icon: '📸', description: 'Check your bills' },
    { id: 'appeal', label: 'Appeal Denial', icon: '⚖️', description: 'Fight denied claims' },
    { id: 'optimization', label: 'Optimize', icon: '✨', description: 'Save money' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Manage family' },
  ];

  const savingsStats = getSavingsStats();
  const pendingActions = getPendingActions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🏥</span>
              </div>
              <div>
                <h1 className="font-semibold text-xl text-gray-900">MedFin</h1>
                <p className="text-sm text-gray-500">
                  {policyData.insurance_company || 'Policy'} • {policyData.plan_name || 'Analyzed'}
                </p>
              </div>
            </div>
            {/* Actions */}
            <button
              onClick={onReset}
              className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Upload New Policy
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* AI Status Indicator */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">AI Ready</span>
          </div>
          <span className="text-sm text-gray-500">
            Policy Score: <span className="font-semibold text-gray-900">{policyData.policy_strength_score || 'N/A'}/100</span>
          </span>
        </div>

        {/* Policy Summary Card */}
        <div className="mb-8 animate-stagger-1">
          <PolicySummary policyData={policyData} />
        </div>

        {/* Tabs */}
        <div className="animate-stagger-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6 animate-stagger-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <SavingsTracker stats={savingsStats} />
                {pendingActions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Pending Actions</h3>
                    <div className="space-y-3">
                      {pendingActions.slice(0, 5).map((action, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            action.priority === 'high' ? 'bg-red-500' :
                            action.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.description}</p>
                            <p className="text-xs text-gray-500">{action.memberName} • {action.actionType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <PrivacyPanel 
                  onClearData={() => {/* Handle clear */}}
                  onExportData={() => {/* Handle export */}}
                  onImportData={(data) => {/* Handle import */}}
                />
              </div>
            )}
            {activeTab === 'pre-visit' && (
              <PreVisitTool policyData={policyData} />
            )}
            {activeTab === 'estimation' && (
              <EstimationTool policyData={policyData} />
            )}
            {activeTab === 'validation' && (
              <ValidationTool policyData={policyData} />
            )}
            {activeTab === 'appeal' && (
              <AppealTool policyData={policyData} />
            )}
            {activeTab === 'optimization' && (
              <OptimizationTool policyData={policyData} />
            )}
            {activeTab === 'family' && (
              <FamilyDashboard policyData={policyData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
