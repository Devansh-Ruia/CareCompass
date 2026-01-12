'use client';

import { useState } from 'react';
import NavigationPlan from '../components/NavigationPlan';
import CostEstimation from '../components/CostEstimation';
import BillAnalysis from '../components/BillAnalysis';
import InsuranceAnalysis from '../components/InsuranceAnalysis';
import AssistancePrograms from '../components/AssistancePrograms';
import PaymentPlans from '../components/PaymentPlans';
import { InsuranceInfo, MedicalBill } from '../lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo>({
    insurance_type: 'private',
    annual_deductible: 2000,
    deductible_met: 500,
    annual_out_of_pocket_max: 6000,
    out_of_pocket_met: 1200,
    copay_amount: 30,
    coinsurance_rate: 0.2,
    coverage_percentage: 0.8,
  });

  const [bills, setBills] = useState<MedicalBill[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [householdSize, setHouseholdSize] = useState(1);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cost', label: 'Cost Estimation', icon: '💰' },
    { id: 'bills', label: 'Bill Analysis', icon: '📋' },
    { id: 'insurance', label: 'Insurance', icon: '🏥' },
    { id: 'assistance', label: 'Assistance', icon: '🤝' },
    { id: 'payment', label: 'Payment Plans', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">MedFin</h1>
              <span className="ml-2 text-sm text-gray-500">Healthcare Financial Navigator</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-secondary text-sm">Settings</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 border border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <main className="space-y-6">
          {activeTab === 'dashboard' && (
            <NavigationPlan
              insuranceInfo={insuranceInfo}
              bills={bills}
              monthlyIncome={monthlyIncome}
              householdSize={householdSize}
              onInsuranceChange={setInsuranceInfo}
              onBillsChange={setBills}
              onIncomeChange={setMonthlyIncome}
              onHouseholdSizeChange={setHouseholdSize}
            />
          )}

          {activeTab === 'cost' && (
            <CostEstimation insuranceInfo={insuranceInfo} />
          )}

          {activeTab === 'bills' && (
            <BillAnalysis bills={bills} onBillsChange={setBills} />
          )}

          {activeTab === 'insurance' && (
            <InsuranceAnalysis
              insuranceInfo={insuranceInfo}
              bills={bills}
              onInsuranceChange={setInsuranceInfo}
            />
          )}

          {activeTab === 'assistance' && (
            <AssistancePrograms
              insuranceInfo={insuranceInfo}
              bills={bills}
              monthlyIncome={monthlyIncome}
              householdSize={householdSize}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentPlans
              bills={bills}
              monthlyIncome={monthlyIncome}
            />
          )}
        </main>
      </div>

      <footer className="mt-16 py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© 2024 MedFin. This tool provides estimates and recommendations only. Not financial or medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
