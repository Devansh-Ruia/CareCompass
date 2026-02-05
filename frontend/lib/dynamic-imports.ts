/**
 * Dynamic imports for code splitting heavy components
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Loading components for dynamic imports
const LoadingFallback = () => React.createElement(
  'div',
  { className: 'flex items-center justify-center py-12' },
  React.createElement(
    'div',
    { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500' }
  )
);

// Dynamic imports with loading states
export const DynamicAppealTool = dynamic(
  () => import('../components/AppealTool'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicPreVisitTool = dynamic(
  () => import('../components/PreVisitTool'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicValidationTool = dynamic(
  () => import('../components/ValidationTool'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicOptimizationTool = dynamic(
  () => import('../components/OptimizationTool'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicFamilyDashboard = dynamic(
  () => import('../components/FamilyDashboard'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicSavingsTracker = dynamic(
  () => import('../components/SavingsTracker'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

export const DynamicPrivacyPanel = dynamic(
  () => import('../components/PrivacyPanel'),
  { loading: () => React.createElement(LoadingFallback), ssr: false }
);

// Utility function for lazy loading
export const loadComponent = (importFn: () => Promise<any>) => {
  return dynamic(importFn, {
    loading: () => React.createElement(LoadingFallback),
    ssr: false
  });
};
