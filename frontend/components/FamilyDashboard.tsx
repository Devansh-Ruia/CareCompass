'use client';

import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useSavings } from '../contexts/SavingsContext';
import { PolicyData } from '../lib/api';
import VisualCostBreakdown from './VisualCostBreakdown';
import SavingsTracker from './SavingsTracker';

interface FamilyDashboardProps {
  policyData: PolicyData;
}

export default function FamilyDashboard({ policyData }: FamilyDashboardProps) {
  const { familyMembers, addMember, updateMember, removeMember } = useFamily();
  const { totalSavings } = useSavings();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'child' as const,
    dateOfBirth: ''
  });

  const handleAddMember = () => {
    if (!newMember.name) return;
    
    addMember({
      name: newMember.name,
      relationship: newMember.relationship,
      dateOfBirth: newMember.dateOfBirth || undefined,
      policies: [{
        policyId: 'main',
        policyData,
        memberType: 'primary',
        deductibleMet: 0,
        outOfPocketMet: 0
      }]
    });
    
    setNewMember({ name: '', relationship: 'child', dateOfBirth: '' });
    setShowAddMember(false);
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'child': return '👧';
      case 'spouse': return '👩';
      case 'parent': return '👴';
      case 'self': return '👤';
      default: return '👤';
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'self': return 'bg-emerald-100 text-emerald-700';
      case 'spouse': return 'bg-blue-100 text-blue-700';
      case 'child': return 'bg-purple-100 text-purple-700';
      case 'parent': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getWidthClass = (percent: number) => {
    if (percent >= 90) return 'w-[90%]';
    if (percent >= 80) return 'w-[80%]';
    if (percent >= 70) return 'w-[70%]';
    if (percent >= 60) return 'w-[60%]';
    if (percent >= 50) return 'w-[50%]';
    if (percent >= 40) return 'w-[40%]';
    if (percent >= 30) return 'w-[30%]';
    if (percent >= 20) return 'w-[20%]';
    if (percent >= 10) return 'w-[10%]';
    if (percent >= 5) return 'w-[5%]';
    return 'w-[2%]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Family Dashboard</h2>
            <p className="text-gray-600">Manage your family's healthcare coverage</p>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
          >
            + Add Member
          </button>
        </div>

        {/* Family Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Family Members</p>
            <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Active Policies</p>
            <p className="text-2xl font-bold text-gray-900">
              {familyMembers.reduce((sum, member) => sum + member.policies.length, 0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Total Savings</p>
            <p className="text-2xl font-bold text-emerald-600">${totalSavings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Family Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Family member name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  value={newMember.relationship}
                  onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Relationship type"
                >
                  <option value="self">Self</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth (optional)</label>
                <input
                  type="date"
                  value={newMember.dateOfBirth}
                  onChange={(e) => setNewMember(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  aria-label="Date of birth"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddMember}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setNewMember({ name: '', relationship: 'child', dateOfBirth: '' });
                }}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Members Grid */}
      {familyMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map(member => {
            const primaryPolicy = member.policies[0];
            const deductiblePercent = primaryPolicy 
              ? (primaryPolicy.deductibleMet / (primaryPolicy.policyData.annual_deductible_individual || 1)) * 100
              : 0;
            
            return (
              <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                      {getRelationshipIcon(member.relationship)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.relationship}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${member.name}`}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Insurance</p>
                    <p className="text-sm font-medium">{primaryPolicy?.policyData.plan_name || 'Policy'}</p>
                  </div>
                  
                  {primaryPolicy && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Deductible</span>
                        <span>${primaryPolicy.deductibleMet} / ${primaryPolicy.policyData.annual_deductible_individual || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-emerald-500 rounded-full transition-all ${getWidthClass(deductiblePercent)}`}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Out of Pocket</span>
                    <span className="font-medium">${primaryPolicy?.outOfPocketMet || 0}</span>
                  </div>
                </div>
                
                <button className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  View Details →
                </button>
              </div>
            );
          })}
          
          {/* Add Member Card */}
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-subtle p-5 text-center hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
              +
            </div>
            <p className="font-medium text-gray-900">Add Family Member</p>
            <p className="text-sm text-gray-500">Manage coverage for dependents</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            👨‍👩‍👧‍👦
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Family Members Yet</h3>
          <p className="text-gray-600 mb-6">Add family members to manage their healthcare coverage in one place</p>
          <button
            onClick={() => setShowAddMember(true)}
            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
          >
            Add First Member
          </button>
        </div>
      )}

      {/* Combined Savings Tracker */}
      <div className="mt-8">
        <SavingsTracker stats={useSavings().getSavingsStats()} />
      </div>

      {/* Family Coverage Summary */}
      {familyMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-subtle p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Coverage Summary</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Total Deductible Met</p>
                <p className="text-xl font-bold text-gray-900">
                  ${familyMembers.reduce((sum, member) => 
                    sum + member.policies.reduce((policySum, policy) => policySum + policy.deductibleMet, 0), 0
                  ).toLocaleString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Total Out of Pocket Met</p>
                <p className="text-xl font-bold text-gray-900">
                  ${familyMembers.reduce((sum, member) => 
                    sum + member.policies.reduce((policySum, policy) => policySum + policy.outOfPocketMet, 0), 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Visual breakdown for primary member */}
            {familyMembers[0] && familyMembers[0].policies[0] && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sample Cost Breakdown</h4>
                <VisualCostBreakdown
                  totalCost={1000}
                  deductiblePortion={Math.min(familyMembers[0].policies[0].deductibleMet, 500)}
                  coinsurancePortion={100}
                  copayPortion={25}
                  insurancePays={375}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
