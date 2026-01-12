'use client';

import { useState, useEffect } from 'react';
import { api, InsuranceInfo, MedicalBill } from '../lib/api';

interface InsuranceAnalysisProps {
  insuranceInfo: InsuranceInfo;
  bills: MedicalBill[];
  onInsuranceChange: (info: InsuranceInfo) => void;
}

export default function InsuranceAnalysis({ insuranceInfo, bills, onInsuranceChange }: InsuranceAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (insuranceInfo) {
      fetchAnalysis();
    }
  }, [insuranceInfo, bills]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.analyzeInsurance({
        insurance: insuranceInfo,
        bills,
      });
      setAnalysis(response);
    } catch (err) {
      setError('Failed to analyze insurance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof InsuranceInfo, value: any) => {
    onInsuranceChange({ ...insuranceInfo, [field]: value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'developing': return 'text-yellow-600 bg-yellow-50';
      case 'nearly_maxed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance Analysis</h2>
        <p className="text-gray-600">Track your insurance coverage and optimize benefits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Insurance Type</label>
                <select
                  value={insuranceInfo.insurance_type}
                  onChange={(e) => handleFieldChange('insurance_type', e.target.value)}
                  className="input-field"
                >
                  <option value="private">Private Insurance</option>
                  <option value="medicare">Medicare</option>
                  <option value="medicaid">Medicaid</option>
                  <option value="va">VA Health Care</option>
                  <option value="tricare">TRICARE</option>
                  <option value="uninsured">Uninsured</option>
                </select>
              </div>

              <div>
                <label className="label">Provider Name</label>
                <input
                  type="text"
                  value={insuranceInfo.provider_name || ''}
                  onChange={(e) => handleFieldChange('provider_name', e.target.value)}
                  className="input-field"
                  placeholder="Blue Cross Blue Shield"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Annual Deductible ($)</label>
                  <input
                    type="number"
                    value={insuranceInfo.annual_deductible}
                    onChange={(e) => handleFieldChange('annual_deductible', Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Deductible Met ($)</label>
                  <input
                    type="number"
                    value={insuranceInfo.deductible_met}
                    onChange={(e) => handleFieldChange('deductible_met', Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Out-of-Pocket Max ($)</label>
                  <input
                    type="number"
                    value={insuranceInfo.annual_out_of_pocket_max}
                    onChange={(e) => handleFieldChange('annual_out_of_pocket_max', Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Out-of-Pocket Met ($)</label>
                  <input
                    type="number"
                    value={insuranceInfo.out_of_pocket_met}
                    onChange={(e) => handleFieldChange('out_of_pocket_met', Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Copay ($)</label>
                  <input
                    type="number"
                    value={insuranceInfo.copay_amount}
                    onChange={(e) => handleFieldChange('copay_amount', Number(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Coinsurance (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={insuranceInfo.coinsurance_rate * 100}
                    onChange={(e) => handleFieldChange('coinsurance_rate', Number(e.target.value) / 100)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Coverage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={insuranceInfo.coverage_percentage * 100}
                    onChange={(e) => handleFieldChange('coverage_percentage', Number(e.target.value) / 100)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Analyzing coverage...</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Coverage Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analysis.coverage_status.status)}`}>
                    {analysis.coverage_status.status.charAt(0).toUpperCase() + analysis.coverage_status.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Deductible Progress</span>
                      <span className="font-medium">
                        ${analysis.coverage_status.deductible.met.toLocaleString()} / ${analysis.coverage_status.deductible.annual.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${analysis.coverage_status.deductible.progress_percent}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${analysis.coverage_status.deductible.remaining.toLocaleString()} remaining
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Out-of-Pocket Progress</span>
                      <span className="font-medium">
                        ${analysis.coverage_status.out_of_pocket.met.toLocaleString()} / ${analysis.coverage_status.out_of_pocket.annual_max.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${analysis.coverage_status.out_of_pocket.progress_percent}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${analysis.coverage_status.out_of_pocket.remaining.toLocaleString()} until max
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Cost Sharing</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Copay</div>
                        <div className="font-medium">${analysis.coverage_status.cost_sharing.copay.toFixed(0)}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Coinsurance</div>
                        <div className="font-medium">{analysis.coverage_status.cost_sharing.coinsurance_rate.toFixed(0)}%</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-500">Coverage</div>
                        <div className="font-medium">{analysis.coverage_status.cost_sharing.coverage_percentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {analysis.coverage_gaps.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Gaps</h3>
                  <div className="space-y-3">
                    {analysis.coverage_gaps.map((gap: any, index: number) => (
                      <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-semibold text-orange-800">
                          {gap.gap_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-orange-700 mt-1">{gap.description}</div>
                        <div className="text-sm text-gray-700 mt-2">{gap.recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <p className="text-gray-700">{analysis.summary}</p>
              </div>

              {analysis.optimization_recommendations.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Optimization Recommendations
                  </h3>
                  <div className="space-y-3">
                    {analysis.optimization_recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="font-medium text-blue-900 capitalize">{rec.category}</span>
                        </div>
                        <div className="text-sm text-blue-800 mt-2">{rec.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
