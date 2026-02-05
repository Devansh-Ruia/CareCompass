'use client';

import { useState, useEffect } from 'react';
import { api, InsuranceInfo, CostEstimate } from '../lib/api';
import MarkdownRenderer from './MarkdownRenderer';

interface CostEstimationProps {
  insuranceInfo: InsuranceInfo;
}

export default function CostEstimation({ insuranceInfo }: CostEstimationProps) {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [location, setLocation] = useState('midwest');
  const [isEmergency, setIsEmergency] = useState(false);
  const [inNetwork, setInNetwork] = useState(true);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.getServices();
      setServices(response.services);
    } catch (err) {
      setError('Failed to load services');
      console.error(err);
    }
  };

  const handleEstimate = async () => {
    if (!selectedService) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.estimateCost({
        service_code: selectedService,
        insurance: insuranceInfo,
        location,
        is_emergency: isEmergency,
        in_network: inNetwork,
      });
      setEstimate(response);
    } catch (err) {
      setError('Failed to estimate cost');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Healthcare Cost Estimation</h2>
        <p className="text-gray-600">Get estimates for medical services based on your insurance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <label className="label">Medical Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input-field"
            >
              <option value="">Select a service...</option>
              {services.map((service) => (
                <option key={service.code} value={service.code}>
                  {service.name} - ${service.base_cost}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <label className="label">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
            >
              <option value="midwest">Midwest</option>
              <option value="northeast">Northeast</option>
              <option value="south">South</option>
              <option value="west">West</option>
            </select>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Emergency Service</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={inNetwork}
                  onChange={(e) => setInNetwork(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">In-Network Provider</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleEstimate}
            disabled={!selectedService || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Get Estimate'}
          </button>
        </div>

        <div className="space-y-4">
          {estimate && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cost Estimate: {estimate.service_name}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Base Cost</span>
                  <span className="font-semibold">${estimate.base_cost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Estimated Range</span>
                  <span className="font-semibold">
                    ${estimate.estimated_range[0].toFixed(2)} - ${estimate.estimated_range[1].toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Location Multiplier</span>
                  <span className="font-semibold">{(estimate.location_multiplier * 100).toFixed(0)}%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <span className="text-primary-700 font-medium">With Insurance</span>
                  <span className="font-bold text-primary-700 text-xl">${estimate.with_insurance.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-700 font-medium">Your Out-of-Pocket</span>
                  <span className="font-bold text-green-700 text-xl">${estimate.out_of_pocket.toFixed(2)}</span>
                </div>
              </div>

              {estimate.alternatives.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Lower-Cost Alternatives</h4>
                  <div className="space-y-2">
                    {estimate.alternatives.map((alt, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-medium text-blue-900">{alt.type}</div>
                        <MarkdownRenderer className="text-sm text-blue-700 mt-1">{alt.description}</MarkdownRenderer>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Potential Savings: {alt.savings}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!estimate && !loading && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Estimate</h3>
              <p className="text-gray-600">
                Select a medical service to see estimated costs
              </p>
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
