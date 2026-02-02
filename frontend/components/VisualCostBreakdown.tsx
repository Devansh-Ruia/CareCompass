'use client';

interface CostBreakdownProps {
  totalCost: number;
  deductiblePortion: number;
  coinsurancePortion: number;
  copayPortion?: number;
  insurancePays: number;
  outOfPocketMax?: number;
  currentOutOfPocket?: number;
  showLabels?: boolean;
  compact?: boolean;
}

export default function VisualCostBreakdown({ 
  totalCost, 
  deductiblePortion, 
  coinsurancePortion, 
  copayPortion = 0,
  insurancePays, 
  outOfPocketMax,
  currentOutOfPocket,
  showLabels = true,
  compact = false
}: CostBreakdownProps) {
  const yourTotal = deductiblePortion + coinsurancePortion + copayPortion;
  const yourPercent = (yourTotal / totalCost) * 100;
  const insurancePercent = (insurancePays / totalCost) * 100;
  
  const deductiblePercent = totalCost > 0 ? (deductiblePortion / totalCost) * 100 : 0;
  const coinsurancePercent = totalCost > 0 ? (coinsurancePortion / totalCost) * 100 : 0;
  const copayPercent = totalCost > 0 ? (copayPortion / totalCost) * 100 : 0;
  
  // Helper function to get width class
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

  // Progress toward out-of-pocket max
  const progressToMax = currentOutOfPocket && outOfPocketMax 
    ? Math.min((currentOutOfPocket / outOfPocketMax) * 100, 100)
    : 0;

  return (
    <div className={`bg-gray-50 rounded-xl ${compact ? 'p-3' : 'p-4'} my-4`}>
      {showLabels && (
        <p className="text-sm font-medium text-gray-700 mb-3">
          Cost Breakdown for ${totalCost.toLocaleString()} Service
        </p>
      )}
      
      {/* Visual bar */}
      <div className={`h-${compact ? '6' : '8'} rounded-lg overflow-hidden flex mb-3`}>
        {deductiblePortion > 0 && (
          <div 
            className={`bg-amber-400 flex items-center justify-center text-xs font-medium text-white ${getWidthClass(deductiblePercent)}`}
            title={`Deductible: $${deductiblePortion}`}
          >
            {deductiblePercent > 10 && 'Deductible'}
          </div>
        )}
        {copayPortion > 0 && (
          <div 
            className={`bg-blue-400 flex items-center justify-center text-xs font-medium text-white ${getWidthClass(copayPercent)}`}
            title={`Copay: $${copayPortion}`}
          >
            {copayPercent > 10 && 'Copay'}
          </div>
        )}
        {coinsurancePortion > 0 && (
          <div 
            className={`bg-orange-400 flex items-center justify-center text-xs font-medium text-white ${getWidthClass(coinsurancePercent)}`}
            title={`Your Coinsurance: $${coinsurancePortion}`}
          >
            {coinsurancePercent > 10 && 'Your Share'}
          </div>
        )}
        {insurancePays > 0 && (
          <div 
            className={`bg-emerald-500 flex items-center justify-center text-xs font-medium text-white ${getWidthClass(insurancePercent)}`}
            title={`Insurance Pays: $${insurancePays}`}
          >
            {insurancePercent > 10 && 'Insurance'}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className={`${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-2 text-sm`}>
        {deductiblePortion > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded"></div>
            <span className="text-gray-700">Deductible: ${deductiblePortion}</span>
          </div>
        )}
        {copayPortion > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span className="text-gray-700">Copay: ${copayPortion}</span>
          </div>
        )}
        {coinsurancePortion > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span className="text-gray-700">Coinsurance: ${coinsurancePortion}</span>
          </div>
        )}
        {insurancePays > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-gray-700">Insurance: ${insurancePays}</span>
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className={`mt-3 pt-3 border-t border-gray-200`}>
        <p className={`${compact ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
          💰 You pay: ${yourTotal.toLocaleString()}
          {!compact && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({yourPercent.toFixed(1)}% of total)
            </span>
          )}
        </p>
        
        {/* Out-of-pocket max progress */}
        {outOfPocketMax && currentOutOfPocket && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress to Out-of-Pocket Max</span>
              <span>${currentOutOfPocket.toLocaleString()} / ${outOfPocketMax.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-purple-500 rounded-full transition-all ${getWidthClass(progressToMax)}`}
              />
            </div>
            {progressToMax >= 100 && (
              <p className="text-xs text-purple-600 font-medium mt-1">
                🎉 You've reached your out-of-pocket max! Insurance pays 100% for covered services.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for inline use
export function CompactCostBreakdown(props: Omit<CostBreakdownProps, 'compact'>) {
  return <VisualCostBreakdown {...props} compact={true} showLabels={false} />;
}
