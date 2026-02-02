'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PolicyData } from '../lib/api';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  dateOfBirth?: string;
  policies: PolicyAssignment[];
}

export interface PolicyAssignment {
  policyId: string;
  policyData: PolicyData;
  memberType: 'primary' | 'dependent';
  deductibleMet: number;
  outOfPocketMet: number;
}

export interface FamilyAccount {
  familyMembers: FamilyMember[];
  totalSavings: number;
  pendingActions: FamilyAction[];
}

export interface FamilyAction {
  memberId: string;
  memberName: string;
  actionType: 'bill_review' | 'appeal' | 'prior_auth' | 'renewal';
  description: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
}

interface FamilyContextType {
  familyMembers: FamilyMember[];
  addMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateMember: (id: string, data: Partial<FamilyMember>) => void;
  removeMember: (id: string) => void;
  addPolicyToMember: (memberId: string, policy: PolicyAssignment) => void;
  updateMemberPolicy: (memberId: string, policyId: string, data: Partial<PolicyAssignment>) => void;
  removePolicyFromMember: (memberId: string, policyId: string) => void;
  exportFamilyData: () => string;
  importFamilyData: (data: string) => void;
  clearAllFamilyData: () => void;
  getPendingActions: () => FamilyAction[];
  getFamilySavings: () => number;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}

interface FamilyProviderProps {
  children: React.ReactNode;
}

export function FamilyProvider({ children }: FamilyProviderProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Load family data from localStorage on mount
  useEffect(() => {
    try {
      const savedFamily = localStorage.getItem('medfin-family');
      if (savedFamily) {
        const parsed = JSON.parse(savedFamily);
        setFamilyMembers(parsed.familyMembers || []);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  }, []);

  // Save family data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('medfin-family', JSON.stringify({ familyMembers }));
    } catch (error) {
      console.error('Error saving family data:', error);
    }
  }, [familyMembers]);

  const addMember = (memberData: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: Date.now().toString(),
    };
    setFamilyMembers(prev => [...prev, newMember]);
  };

  const updateMember = (memberId: string, data: Partial<FamilyMember>) => {
    setFamilyMembers(prev => 
      prev.map(member => 
        member.id === memberId ? { ...member, ...data } : member
      )
    );
  };

  const removeMember = (memberId: string) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
  };

  const addPolicyToMember = (memberId: string, policy: PolicyAssignment) => {
    setFamilyMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, policies: [...member.policies, policy] }
          : member
      )
    );
  };

  const updateMemberPolicy = (memberId: string, policyId: string, data: Partial<PolicyAssignment>) => {
    setFamilyMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? {
              ...member,
              policies: member.policies.map(policy =>
                policy.policyId === policyId ? { ...policy, ...data } : policy
              )
            }
          : member
      )
    );
  };

  const removePolicyFromMember = (memberId: string, policyId: string) => {
    setFamilyMembers(prev => 
      prev.map(member => 
        member.id === memberId 
          ? { ...member, policies: member.policies.filter(policy => policy.policyId !== policyId) }
          : member
      )
    );
  };

  const exportFamilyData = (): string => {
    const data = {
      familyMembers,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  };

  const importFamilyData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.familyMembers && Array.isArray(parsed.familyMembers)) {
        setFamilyMembers(parsed.familyMembers);
      }
    } catch (error) {
      throw new Error('Invalid family data format');
    }
  };

  const clearAllFamilyData = () => {
    setFamilyMembers([]);
  };

  const getPendingActions = (): FamilyAction[] => {
    const actions: FamilyAction[] = [];
    
    familyMembers.forEach(member => {
      member.policies.forEach(policy => {
        // Check for upcoming renewals (mock logic)
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        if (renewalDate.getMonth() === new Date().getMonth() + 1) {
          actions.push({
            memberId: member.id,
            memberName: member.name,
            actionType: 'renewal',
            description: `Policy renewal for ${member.name}`,
            deadline: renewalDate.toISOString(),
            priority: 'high'
          });
        }
        
        // Check if deductible is close to being met (mock logic)
        const deductiblePercent = (policy.deductibleMet / (policy.policyData.annual_deductible_individual || 1)) * 100;
        if (deductiblePercent >= 80 && deductiblePercent < 100) {
          actions.push({
            memberId: member.id,
            memberName: member.name,
            actionType: 'bill_review',
            description: `${member.name}'s deductible is ${deductiblePercent.toFixed(0)}% met - consider scheduling procedures`,
            priority: 'medium'
          });
        }
      });
    });
    
    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getFamilySavings = (): number => {
    // This would integrate with the savings context
    // For now, return a mock calculation
    return familyMembers.reduce((total, member) => {
      return total + member.policies.reduce((memberTotal, policy) => {
        return memberTotal + (policy.policyData.policy_strength_score || 0) * 10;
      }, 0);
    }, 0);
  };

  const value: FamilyContextType = {
    familyMembers,
    addMember,
    updateMember,
    removeMember,
    addPolicyToMember,
    updateMemberPolicy,
    removePolicyFromMember,
    exportFamilyData,
    importFamilyData,
    clearAllFamilyData,
    getPendingActions,
    getFamilySavings
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}
