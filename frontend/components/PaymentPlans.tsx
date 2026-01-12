'use client';

import { useState } from 'react';
import { api, MedicalBill, PaymentPlanOption } from '../lib/api';

interface PaymentPlansProps {
  bills: MedicalBill[];
  monthlyIncome: number;
}

export default function PaymentPlans({ bills, monthlyIncome }: PaymentPlansProps) {
  const [plans, setPlans] = useState<PaymentPlanOption[]>([]);
  const [recommended, setRecommended] = useState<PaymentPlanOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creditScore, setCreditScore] = useState<number | undefined>(undefined);
  const [hardship, setHardship] = useState(false);

  const totalDebt = bills.reduce((sum, bill) => sum + bill.patient_responsibility, 0);
  const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.generatePaymentPlans({
        total_debt: totalDebt,
        monthly_income: monthlyIncome,
        credit_score: creditScore,
        debt_to_income_ratio: debtToIncomeRatio,
        hardship,
      });
      setPlans(response.plans);
      
      const recommendedResponse = await api.recommendBestPlan({
        total_debt: totalDebt,
        monthly_income: monthlyIncome,
        credit_score: creditScore,
        debt_to_income_ratio: debtToIncomeRatio,
        hardship,
      });
      setRecommended(recommendedResponse);
    } catch (err) {
      setError('Failed to generate payment plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Plans</h2>
        <p className="text-gray-600">Compare payment options and find the best plan for your situation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Debt</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalDebt.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Monthly Income</div>
          <div className="text-2xl font-bold text-primary-600">
            ${monthlyIncome.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Debt-to-Income Ratio</div>
          <div className="text-2xl font-bold text-gray-900">
            {(debtToIncomeRatio * 100).toFixed(1)}%
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Affordability</div>
          <div className={`text-2xl font-bold ${
            debtToIncomeRatio < 0.15 ? 'text-green-600' :
            debtToIncomeRatio < 0.30 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {debtToIncomeRatio < 0.15 ? 'Good' :
             debtToIncomeRatio < 0.30 ? 'Fair' : 'Concerning'}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Credit Score (Optional)</label>
            <input
              type="number"
              value={creditScore || ''}
              onChange={(e) => setCreditScore(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field"
              placeholder="700"
              min="300"
              max="850"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hardship}
                onChange={(e) => setHardship(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">I'm experiencing financial hardship</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading || totalDebt === 0}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Plans'}
            </button>
          </div>
        </div>
      </div>

      {recommended && (
        <div className="card border-2 border-green-300">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">⭐</span>
            <h3 className="text-lg font-semibold text-green-900">Recommended Plan</h3>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-900 mb-2">{recommended.plan_type}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Monthly Payment</span>
                <div className="font-bold text-green-900">${recommended.monthly_payment.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-500">Total Repayment</span>
                <div className="font-bold text-green-900">${recommended.total_repayment.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-500">Term</span>
                <div className="font-bold text-green-900">{recommended.term_months} months</div>
              </div>
              <div>
                <span className="text-gray-500">Interest Rate</span>
                <div className="font-bold text-green-900">{recommended.interest_rate}%</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-green-900 mb-2">Recommendation Score</div>
              <div className="w-full bg-green-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${recommended.recommendation_score}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-green-700 mt-1">
                {recommended.recommendation_score.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All Payment Options ({plans.length})
          </h3>
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  recommended?.plan_type === plan.plan_type
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.plan_type}</h4>
                      {recommended?.plan_type === plan.plan_type && (
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Monthly</span>
                        <div className="font-semibold text-gray-900">${plan.monthly_payment.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total</span>
                        <div className="font-semibold text-gray-900">${plan.total_repayment.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Term</span>
                        <div className="font-semibold text-gray-900">{plan.term_months} mo</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Interest</span>
                        <div className={`font-semibold ${plan.interest_rate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {plan.interest_rate}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Interest Paid</span>
                        <div className="font-semibold text-gray-900">${plan.total_interest.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm text-gray-500 mb-1">Score</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {plan.recommendation_score.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Pros</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.pros.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Cons</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.cons.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-0.5">✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">Eligibility Criteria</div>
                  <div className="flex flex-wrap gap-2">
                    {plan.eligibility_criteria.map((criteria, critIndex) => (
                      <span
                        key={critIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                      >
                        {criteria}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {!plans && !loading && totalDebt === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Debt to Plan</h3>
          <p className="text-gray-600">
            Add medical bills in the Bill Analysis tab to generate payment plans
          </p>
        </div>
      )}
    </div>
  );
}
