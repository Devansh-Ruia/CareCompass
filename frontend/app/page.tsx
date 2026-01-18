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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    category: 'general',
    rating: 5,
    comments: ''
  });

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
              <button 
                onClick={() => setShowFeedback(true)}
                className="btn-secondary text-sm"
              >
                Feedback
              </button>
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
          <p>© 2024 MedFin. MedFin provides informational assistance only and is not medical or financial advice.</p>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Send Feedback</h2>
              <button 
                onClick={() => setShowFeedback(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={feedbackData.name}
                  onChange={(e) => setFeedbackData({...feedbackData, name: e.target.value})}
                  className="input-field"
                  title="Your Name"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={feedbackData.email}
                  onChange={(e) => setFeedbackData({...feedbackData, email: e.target.value})}
                  className="input-field"
                  title="Your Email"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={feedbackData.category}
                  onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                  className="input-field"
                  title="Feedback Category"
                >
                  <option value="general">General</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData({...feedbackData, rating: star})}
                      className={`text-2xl ${star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData({...feedbackData, comments: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  title="Your Feedback"
                  placeholder="Share your thoughts, suggestions, or report issues..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between space-x-3">
              <button 
                onClick={() => setShowFeedback(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Feedback submitted:', feedbackData);
                  alert('Thank you for your feedback! We appreciate your input.');
                  setFeedbackData({
                    name: '',
                    email: '',
                    category: 'general',
                    rating: 5,
                    comments: ''
                  });
                  setShowFeedback(false);
                }}
                className="btn-primary"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
