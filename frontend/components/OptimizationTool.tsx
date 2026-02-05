'use client';

import { useState } from 'react';
import { api, PolicyData, OptimizationResult } from '../lib/api';
import MarkdownRenderer from './MarkdownRenderer';

interface OptimizationToolProps {
  policyData: PolicyData;
}

export default function OptimizationTool({ policyData }: OptimizationToolProps) {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User needs form
  const [needs, setNeeds] = useState({
    annual_doctor_visits: 5,
    specialist_visits: 2,
    prescriptions_monthly: 1,
    planned_procedures: '',
    chronic_conditions: false,
    family_planning: false,
    mental_health_needs: false,
    priority: 'balanced', // 'low_premium', 'low_deductible', 'balanced'
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.optimizePolicy(policyData, needs);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <>
          {/* Needs Assessment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tell us about your healthcare needs
            </h3>
            <p className="text-gray-600 mb-6">
              Help AI understand your situation to provide personalized recommendations
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual doctor visits
                </label>
                <input
                  type="number"
                  value={needs.annual_doctor_visits}
                  onChange={(e) => setNeeds({ ...needs, annual_doctor_visits: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialist visits per year
                </label>
                <input
                  type="number"
                  value={needs.specialist_visits}
                  onChange={(e) => setNeeds({ ...needs, specialist_visits: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly prescriptions
                </label>
                <input
                  type="number"
                  value={needs.prescriptions_monthly}
                  onChange={(e) => setNeeds({ ...needs, prescriptions_monthly: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planned procedures (if any)
                </label>
                <input
                  type="text"
                  value={needs.planned_procedures}
                  onChange={(e) => setNeeds({ ...needs, planned_procedures: e.target.value })}
                  placeholder="e.g., surgery, MRI"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's most important to you?
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'low_premium', label: 'Lowest monthly cost' },
                    { value: 'low_deductible', label: 'Low out-of-pocket' },
                    { value: 'balanced', label: 'Balanced coverage' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNeeds({ ...needs, priority: opt.value })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                        needs.priority === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4">
                {[
                  { key: 'chronic_conditions', label: 'Chronic conditions' },
                  { key: 'family_planning', label: 'Family planning' },
                  { key: 'mental_health_needs', label: 'Mental health needs' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needs[opt.key as keyof typeof needs] as boolean}
                      onChange={(e) => setNeeds({ ...needs, [opt.key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </span>
              ) : (
                'Get AI Recommendations'
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Current Plan Rating</p>
              <p className={`text-4xl font-bold ${
                result.current_plan_rating >= 70 ? 'text-green-600' :
                result.current_plan_rating >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.current_plan_rating}/100
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Fit for Your Needs</p>
              <p className={`text-2xl font-bold capitalize ${
                result.fit_for_needs === 'good' ? 'text-green-600' :
                result.fit_for_needs === 'fair' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.fit_for_needs}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Potential Annual Savings</p>
              <p className="text-4xl font-bold text-blue-600">
                ${(result.annual_potential_savings || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Summary</h3>
            <p className="text-gray-700">{result.summary}</p>
          </div>

          {/* Optimizations */}
          {result.optimizations && result.optimizations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Opportunities</h3>
              <div className="space-y-4">
                {result.optimizations
                  .sort((a, b) => a.priority - b.priority)
                  .map((opt, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              opt.priority <= 2 ? 'bg-red-100 text-red-700' :
                              opt.priority <= 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              Priority {opt.priority}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{opt.category}</span>
                          </div>
                          <MarkdownRenderer className="font-medium text-gray-900">{opt.recommendation}</MarkdownRenderer>
                        </div>
                        {opt.potential_savings > 0 && (
                          <div className="text-right ml-4">
                            <p className="text-sm text-gray-500">Save up to</p>
                            <p className="text-lg font-bold text-green-600">${opt.potential_savings}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Effort: {opt.effort_level}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Alternative Plans */}
          {result.alternative_plans && result.alternative_plans.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Plans to Consider</h3>
              <div className="space-y-4">
                {result.alternative_plans.map((plan, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{plan.plan_type}</h4>
                      <span className={`text-sm font-medium ${
                        plan.estimated_premium_change < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {plan.estimated_premium_change < 0 ? '-' : '+'}${Math.abs(plan.estimated_premium_change)}/mo
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{plan.why_consider}</p>
                    <p className="text-xs text-gray-500">
                      <strong>Trade-offs:</strong> {plan.coverage_trade_offs}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Best for: {plan.best_for}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {result.action_items && result.action_items.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
              <div className="space-y-3">
                {result.action_items
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        item.priority === 1 ? 'bg-red-100 text-red-700' :
                        item.priority === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.timeline}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setResult(null)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Update My Needs & Re-analyze
          </button>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
