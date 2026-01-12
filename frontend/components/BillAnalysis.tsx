'use client';

import { useState } from 'react';
import { api, MedicalBill } from '../lib/api';

interface BillAnalysisProps {
  bills: MedicalBill[];
  onBillsChange: (bills: MedicalBill[]) => void;
}

export default function BillAnalysis({ bills, onBillsChange }: BillAnalysisProps) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newBill, setNewBill] = useState<MedicalBill>({
    provider_name: '',
    total_amount: 0,
    patient_responsibility: 0,
    insurance_paid: 0,
    insurance_adjustments: 0,
    service_codes: [],
    description: '',
    is_itemized: false,
  });

  const handleAddBill = () => {
    if (!newBill.provider_name || newBill.total_amount === 0) return;

    onBillsChange([...bills, { ...newBill, service_date: new Date().toISOString() }]);
    setNewBill({
      provider_name: '',
      total_amount: 0,
      patient_responsibility: 0,
      insurance_paid: 0,
      insurance_adjustments: 0,
      service_codes: [],
      description: '',
      is_itemized: false,
    });
  };

  const handleRemoveBill = (index: number) => {
    onBillsChange(bills.filter((_, i) => i !== index));
  };

  const analyzeBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.analyzeBills({ bills });
      setIssues(response.issues);
    } catch (err) {
      setError('Failed to analyze bills');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Analysis</h2>
        <p className="text-gray-600">Add and analyze your medical bills for errors and savings</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bill</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Provider Name</label>
            <input
              type="text"
              value={newBill.provider_name}
              onChange={(e) => setNewBill({ ...newBill, provider_name: e.target.value })}
              className="input-field"
              placeholder="Hospital ABC"
            />
          </div>

          <div>
            <label className="label">Total Amount ($)</label>
            <input
              type="number"
              value={newBill.total_amount || ''}
              onChange={(e) => setNewBill({ ...newBill, total_amount: Number(e.target.value) })}
              className="input-field"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="label">Your Responsibility ($)</label>
            <input
              type="number"
              value={newBill.patient_responsibility || ''}
              onChange={(e) => setNewBill({ ...newBill, patient_responsibility: Number(e.target.value) })}
              className="input-field"
              placeholder="500"
            />
          </div>

          <div>
            <label className="label">Insurance Paid ($)</label>
            <input
              type="number"
              value={newBill.insurance_paid || ''}
              onChange={(e) => setNewBill({ ...newBill, insurance_paid: Number(e.target.value) })}
              className="input-field"
              placeholder="500"
            />
          </div>

          <div>
            <label className="label">Insurance Adjustments ($)</label>
            <input
              type="number"
              value={newBill.insurance_adjustments || ''}
              onChange={(e) => setNewBill({ ...newBill, insurance_adjustments: Number(e.target.value) })}
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="label">Service Codes (comma-separated)</label>
            <input
              type="text"
              value={newBill.service_codes?.join(', ') || ''}
              onChange={(e) => setNewBill({ ...newBill, service_codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              className="input-field"
              placeholder="99213, 80053"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Description</label>
            <input
              type="text"
              value={newBill.description}
              onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
              className="input-field"
              placeholder="Office visit, blood work"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newBill.is_itemized}
                onChange={(e) => setNewBill({ ...newBill, is_itemized: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">This bill is itemized</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleAddBill}
          className="btn-primary w-full mt-4"
        >
          Add Bill
        </button>
      </div>

      {bills.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Bills ({bills.length})
            </h3>
            <button
              onClick={analyzeBills}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Bills'}
            </button>
          </div>

          <div className="space-y-3">
            {bills.map((bill, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{bill.provider_name}</div>
                    <div className="text-sm text-gray-600 mt-1">{bill.description}</div>
                    {bill.service_codes && bill.service_codes.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        Codes: {bill.service_codes.join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveBill(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-gray-600">Total: ${bill.total_amount.toFixed(2)}</span>
                  <span className="text-green-600 font-medium">
                    Your Cost: ${bill.patient_responsibility.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Issues Found ({issues.length})
          </h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`p-4 border-2 rounded-lg ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{issue.issue_type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-700 mt-1">{issue.description}</div>
                    <div className="text-sm text-gray-600 mt-2">{issue.recommendation}</div>
                  </div>
                  {issue.potential_savings > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Potential Savings</div>
                      <div className="text-lg font-bold text-green-600">
                        ${issue.potential_savings.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Request itemized bills for all charges</li>
              <li>• Contact providers to dispute errors</li>
              <li>• Review insurance EOB for all claims</li>
              <li>• Keep records of all communications</li>
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
