'use client';

import { useState } from 'react';
import { api, PolicyData, PreVisitChecklist } from '../lib/api';
import VisualCostBreakdown from './VisualCostBreakdown';
import { replaceJargon } from '../lib/jargonDictionary';

interface PreVisitToolProps {
  policyData: PolicyData;
}

const visitTypes = [
  'Primary Care / Routine Checkup',
  'Specialist Visit (specify type)',
  'Lab Work / Blood Tests',
  'Imaging (X-ray, MRI, CT)',
  'Surgery / Procedure (specify)',
  'Emergency Room',
  'Urgent Care',
  'Mental Health / Therapy',
  'Physical Therapy',
  'Dental / Vision'
];

export default function PreVisitTool({ policyData }: PreVisitToolProps) {
  const [visitType, setVisitType] = useState('');
  const [customVisitType, setCustomVisitType] = useState('');
  const [providerName, setProviderName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [isInNetwork, setIsInNetwork] = useState<'yes' | 'no' | 'unsure'>('unsure');
  const [plannedDate, setPlannedDate] = useState('');
  const [checklist, setChecklist] = useState<PreVisitChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateChecklist = async () => {
    if (!visitType) {
      setError('Please select a visit type');
      return;
    }

    const actualVisitType = visitType.includes('(specify type)') && customVisitType 
      ? customVisitType 
      : visitType;

    setLoading(true);
    setError(null);

    try {
      const providerInfo = {
        provider_name: providerName || undefined,
        facility_name: facilityName || undefined,
        in_network_status: isInNetwork
      };

      const result = await api.generatePreVisitChecklist(
        actualVisitType,
        policyData,
        Object.keys(providerInfo).some(key => providerInfo[key as keyof typeof providerInfo]) 
          ? providerInfo 
          : undefined
      );

      setChecklist(result);
    } catch (err) {
      console.error(err);
      setError('Failed to generate checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setVisitType('');
    setCustomVisitType('');
    setProviderName('');
    setFacilityName('');
    setIsInNetwork('unsure');
    setPlannedDate('');
    setChecklist(null);
    setError(null);
  };

  const getActualVisitType = () => {
    if (visitType.includes('(specify type)') && customVisitType) {
      return customVisitType;
    }
    return visitType;
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      {!checklist && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Plan Your Medical Visit</h3>
          
          <div className="space-y-4">
            {/* Visit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of visit are you planning?
              </label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Select visit type"
              >
                <option value="">Select a visit type...</option>
                {visitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              {visitType.includes('(specify type)') && (
                <input
                  type="text"
                  value={customVisitType}
                  onChange={(e) => setCustomVisitType(e.target.value)}
                  placeholder="Please specify the type..."
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Specify visit type"
                />
              )}
            </div>

            {/* Provider Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Name (optional)
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Dr. Smith"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Provider name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Name (optional)
                </label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="City Medical Center"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Facility name"
                />
              </div>
            </div>

            {/* Network Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is this provider in-network?
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'yes', label: 'Yes, in-network' },
                  { value: 'no', label: 'No, out-of-network' },
                  { value: 'unsure', label: 'Not sure' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      value={option.value}
                      checked={isInNetwork === option.value}
                      onChange={(e) => setIsInNetwork(e.target.value as 'yes' | 'no' | 'unsure')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Planned Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Date (optional)
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Planned visit date"
              />
            </div>

            <button
              onClick={handleGenerateChecklist}
              className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
            >
              Generate Pre-Visit Checklist
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-16 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl animate-bounce">📋</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Creating Your Checklist...</h3>
          <p className="text-gray-600">AI is analyzing your policy and preparing personalized guidance</p>
        </div>
      )}

      {/* Results */}
      {checklist && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                🩺 Pre-Visit Checklist: {getActualVisitType()}
              </h3>
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
              >
                Plan Another Visit
              </button>
            </div>
            
            <p 
              className="text-gray-600"
              dangerouslySetInnerHTML={{ __html: replaceJargon(checklist.coverage_summary) }}
            />
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">💰 Estimated Costs</h4>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Typical Range</span>
                <span>${checklist.estimated_costs.typical_range_low.toLocaleString()} - ${checklist.estimated_costs.typical_range_high.toLocaleString()}</span>
              </div>
            </div>

            <VisualCostBreakdown
              totalCost={checklist.estimated_costs.typical_range_high}
              deductiblePortion={checklist.estimated_costs.deductible_applies ? Math.min(checklist.estimated_costs.deductible_remaining || 0, checklist.estimated_costs.your_cost_high) : 0}
              copayPortion={checklist.estimated_costs.copay_if_applicable || 0}
              coinsurancePortion={checklist.estimated_costs.your_cost_high - (checklist.estimated_costs.copay_if_applicable || 0) - (checklist.estimated_costs.deductible_applies ? Math.min(checklist.estimated_costs.deductible_remaining || 0, checklist.estimated_costs.your_cost_high) : 0)}
              insurancePays={checklist.estimated_costs.typical_range_high - checklist.estimated_costs.your_cost_high}
            />

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                <strong>Your estimated cost:</strong> ${checklist.estimated_costs.your_cost_low.toLocaleString()} - ${checklist.estimated_costs.your_cost_high.toLocaleString()}
              </p>
              {checklist.estimated_costs.deductible_applies && (
                <p className="text-sm text-gray-600 mt-1">
                  Your deductible remaining: ${checklist.estimated_costs.deductible_remaining?.toLocaleString() || 'Unknown'}
                </p>
              )}
            </div>
          </div>

          {/* Prior Authorization */}
          {checklist.prior_authorization.likely_required && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-6">
              <h4 className="text-lg font-semibold text-amber-800 mb-3">⚠️ Prior Authorization Required</h4>
              <div className="space-y-2 text-amber-700">
                <p><strong>Why:</strong> {checklist.prior_authorization.reason}</p>
                <p><strong>How to obtain:</strong> {checklist.prior_authorization.how_to_obtain}</p>
                <p><strong>Timeline:</strong> {checklist.prior_authorization.typical_timeline}</p>
                <p><strong>If skipped:</strong> {checklist.prior_authorization.consequence_if_skipped}</p>
              </div>
            </div>
          )}

          {/* Questions to Ask */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">❓ Questions to Ask Your Provider</h4>
            <ul className="space-y-2">
              {checklist.questions_to_ask_provider.map((question, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: replaceJargon(question) }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Questions for Insurance */}
          {checklist.questions_to_ask_insurance.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📞 Questions to Call Your Insurance About</h4>
              <ul className="space-y-2">
                {checklist.questions_to_ask_insurance.map((question, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span 
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: replaceJargon(question) }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents to Request */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">📄 Documents to Request After Your Visit</h4>
            <ul className="space-y-2">
              {checklist.documents_to_request_after.map((doc, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: replaceJargon(doc) }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Network Warnings */}
          {checklist.network_warnings.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-6">
              <h4 className="text-lg font-semibold text-red-800 mb-4">🚨 Network Warnings</h4>
              <ul className="space-y-2">
                {checklist.network_warnings.map((warning, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span 
                      className="text-red-700"
                      dangerouslySetInnerHTML={{ __html: replaceJargon(warning) }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Money-Saving Tips */}
          <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl p-6">
            <h4 className="text-lg font-semibold text-emerald-800 mb-4">💡 Money-Saving Tips</h4>
            <ul className="space-y-2">
              {checklist.money_saving_tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span 
                    className="text-emerald-700"
                    dangerouslySetInnerHTML={{ __html: replaceJargon(tip) }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-xl p-4 text-red-700">
          {error}
          <button onClick={reset} className="ml-4 underline hover:no-underline">Try again</button>
        </div>
      )}
    </div>
  );
}
