'use client';

import { useState, useEffect } from 'react';
import { api, NavigationPlan as NavigationPlanType, InsuranceInfo, MedicalBill } from '../lib/api';

interface NavigationPlanProps {
  insuranceInfo: InsuranceInfo;
  bills: MedicalBill[];
  monthlyIncome: number;
  householdSize: number;
  onInsuranceChange: (info: InsuranceInfo) => void;
  onBillsChange: (bills: MedicalBill[]) => void;
  onIncomeChange: (income: number) => void;
  onHouseholdSizeChange: (size: number) => void;
}

export default function NavigationPlan({
  insuranceInfo,
  bills,
  monthlyIncome,
  householdSize,
  onIncomeChange,
  onHouseholdSizeChange,
}: NavigationPlanProps) {
  const [plan, setPlan] = useState<NavigationPlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bills.length > 0) {
      fetchPlan();
    }
  }, [bills, insuranceInfo, monthlyIncome, householdSize]);

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createNavigationPlan({
        bills,
        insurance: insuranceInfo,
        monthly_income: monthlyIncome,
        household_size: householdSize,
      });
      setPlan(response);
    } catch (err) {
      setError('Failed to generate navigation plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Navigation Plan</h2>
        <p className="text-gray-600">Get a personalized action plan to reduce your healthcare costs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <label className="label">Monthly Income</label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              value={monthlyIncome}
              onChange={(e) => onIncomeChange(Number(e.target.value))}
              className="input-field"
              placeholder="5000"
            />
          </div>
        </div>

        <div className="card">
          <label className="label">Household Size</label>
          <input
            type="number"
            value={householdSize}
            onChange={(e) => onHouseholdSizeChange(Number(e.target.value))}
            className="input-field"
            placeholder="1"
            min="1"
          />
        </div>
      </div>

      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating your navigation plan...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Risk Level</div>
              <div className={`text-2xl font-bold px-3 py-1 rounded-full inline-block ${getRiskLevelColor(plan.risk_level)}`}>
                {plan.risk_level.charAt(0).toUpperCase() + plan.risk_level.slice(1)}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Total Medical Debt</div>
              <div className="text-2xl font-bold text-gray-900">
                ${plan.total_medical_debt.toLocaleString()}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Estimated Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${plan.estimated_total_savings.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <p className="text-gray-700">{plan.summary}</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Plan</h3>
            <div className="space-y-3">
              {plan.action_plan.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {action.priority}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{action.action}</div>
                    <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      {action.estimated_savings && (
                        <span className="text-green-600 font-medium">
                          Save: ${action.estimated_savings.toLocaleString()}
                        </span>
                      )}
                      {action.estimated_timeframe && (
                        <span className="text-gray-500">
                          Time: {action.estimated_timeframe}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {plan.coverage_gaps.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Gaps</h3>
              <div className="space-y-3">
                {plan.coverage_gaps.map((gap, index) => (
                  <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="font-semibold text-orange-800">{gap.gap_type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-orange-700 mt-1">{gap.description}</div>
                    <div className="text-sm text-gray-700 mt-2">{gap.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Timeline</h3>
            <p className="text-gray-700">{plan.recommended_timeline}</p>
          </div>
        </div>
      )}

      {bills.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Added</h3>
          <p className="text-gray-600 mb-4">
            Add your medical bills in the Bill Analysis tab to generate a navigation plan
          </p>
        </div>
      )}
    </div>
  );
}
