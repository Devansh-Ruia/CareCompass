// Insurance jargon dictionary for "Explain Like I'm 5" mode
export interface JargonEntry {
  term: string;
  simple: string;
  example: string;
  category: 'costs' | 'coverage' | 'network' | 'claims' | 'general';
}

export const jargonDictionary: Record<string, JargonEntry> = {
  "deductible": {
    term: "Deductible",
    simple: "The amount you pay first before insurance starts helping",
    example: "If your deductible is $500, you pay the first $500 of medical bills yourself each year",
    category: "costs"
  },
  "annual deductible": {
    term: "Annual Deductible",
    simple: "The amount you pay first before insurance starts helping (resets each year)",
    example: "If your deductible is $500, you pay the first $500 of medical bills yourself each year",
    category: "costs"
  },
  "coinsurance": {
    term: "Coinsurance",
    simple: "Your percentage share of costs after you've met your deductible",
    example: "20% coinsurance means you pay $20 for every $100 of care after your deductible is met",
    category: "costs"
  },
  "copay": {
    term: "Copay",
    simple: "A fixed dollar amount you pay for a specific service",
    example: "$35 copay means you pay exactly $35 for a doctor visit, and insurance covers the rest",
    category: "costs"
  },
  "copayment": {
    term: "Copayment",
    simple: "A fixed dollar amount you pay for a specific service",
    example: "$35 copay means you pay exactly $35 for a doctor visit, and insurance covers the rest",
    category: "costs"
  },
  "out-of-pocket maximum": {
    term: "Out-of-Pocket Maximum",
    simple: "The most you'll ever pay in a year — after this, insurance pays 100%",
    example: "If your max is $3,000 and you've paid $3,000 in deductibles/copays/coinsurance, everything else that year is free",
    category: "costs"
  },
  "out-of-pocket max": {
    term: "Out-of-Pocket Max",
    simple: "The most you'll ever pay in a year — after this, insurance pays 100%",
    example: "If your max is $3,000 and you've paid $3,000 in deductibles/copays/coinsurance, everything else that year is free",
    category: "costs"
  },
  "oop max": {
    term: "OOP Max",
    simple: "Out-of-pocket maximum — the most you'll pay in a year",
    example: "After reaching your OOP max, insurance covers 100% of covered services",
    category: "costs"
  },
  "premium": {
    term: "Premium",
    simple: "Your monthly payment to have insurance (separate from medical costs)",
    example: "Like a subscription fee — you pay this every month whether you use healthcare or not",
    category: "costs"
  },
  "prior authorization": {
    term: "Prior Authorization",
    simple: "Permission slip from insurance BEFORE getting care",
    example: "Like asking for approval before buying — if you skip it, they might refuse to pay",
    category: "claims"
  },
  "pre-authorization": {
    term: "Pre-Authorization",
    simple: "Permission slip from insurance BEFORE getting care",
    example: "Like asking for approval before buying — if you skip it, they might refuse to pay",
    category: "claims"
  },
  "prior auth": {
    term: "Prior Auth",
    simple: "Short for prior authorization — getting insurance approval before a procedure",
    example: "Many surgeries and expensive tests require prior auth or insurance won't pay",
    category: "claims"
  },
  "in-network": {
    term: "In-Network",
    simple: "Doctors and hospitals that have a contract with your insurance",
    example: "Using in-network providers saves money because insurance has pre-negotiated lower rates",
    category: "network"
  },
  "out-of-network": {
    term: "Out-of-Network",
    simple: "Providers without a contract with your insurance — usually costs much more",
    example: "You might pay 40-60% instead of 20%, and the doctor can bill you extra (balance billing)",
    category: "network"
  },
  "network": {
    term: "Network",
    simple: "The group of doctors, hospitals, and providers your insurance has deals with",
    example: "Staying 'in-network' means using providers who agreed to your insurance's rates",
    category: "network"
  },
  "eob": {
    term: "EOB",
    simple: "Explanation of Benefits — a summary showing what insurance paid (NOT a bill)",
    example: "This document shows what was charged, what insurance paid, and what you might owe",
    category: "claims"
  },
  "explanation of benefits": {
    term: "Explanation of Benefits",
    simple: "A summary from insurance showing what they paid (NOT a bill)",
    example: "Review your EOB before paying any bill to make sure the numbers match",
    category: "claims"
  },
  "balance billing": {
    term: "Balance Billing",
    simple: "When an out-of-network doctor bills you for the difference between their charge and what insurance paid",
    example: "Doctor charges $500, insurance pays $300 based on their rates, you get billed the $200 'balance'",
    category: "costs"
  },
  "surprise billing": {
    term: "Surprise Billing",
    simple: "An unexpected bill from an out-of-network provider you didn't choose",
    example: "You go to an in-network hospital, but the anesthesiologist is out-of-network and sends a separate bill",
    category: "costs"
  },
  "formulary": {
    term: "Formulary",
    simple: "The list of prescription drugs your insurance covers",
    example: "If a medication isn't on the formulary, you might pay full price or need to try alternatives first",
    category: "coverage"
  },
  "claim": {
    term: "Claim",
    simple: "A request sent to insurance asking them to pay for your care",
    example: "The doctor's office submits a claim, insurance reviews it, then decides what to pay",
    category: "claims"
  },
  "denied claim": {
    term: "Denied Claim",
    simple: "When insurance refuses to pay for a service",
    example: "You can usually appeal a denied claim — about 50% of appeals are successful",
    category: "claims"
  },
  "appeal": {
    term: "Appeal",
    simple: "A formal request asking insurance to reconsider a denied claim",
    example: "If your claim is denied, you have the right to appeal with supporting documentation",
    category: "claims"
  },
  "hmo": {
    term: "HMO",
    simple: "Health Maintenance Organization — a plan requiring you to use network doctors and get referrals",
    example: "HMOs are often cheaper but less flexible — you need your primary doctor to refer you to specialists",
    category: "coverage"
  },
  "ppo": {
    term: "PPO",
    simple: "Preferred Provider Organization — a flexible plan letting you see any doctor without referrals",
    example: "PPOs cost more but let you see specialists directly and use out-of-network doctors (at higher cost)",
    category: "coverage"
  },
  "epo": {
    term: "EPO",
    simple: "Exclusive Provider Organization — like a PPO but only covers in-network care",
    example: "No referrals needed, but if you go out-of-network, you pay 100% (except emergencies)",
    category: "coverage"
  },
  "hdhp": {
    term: "HDHP",
    simple: "High Deductible Health Plan — lower premiums but you pay more before insurance kicks in",
    example: "Good if you're healthy and want lower monthly costs, often paired with an HSA",
    category: "coverage"
  },
  "hsa": {
    term: "HSA",
    simple: "Health Savings Account — a tax-free account to save money for medical expenses",
    example: "Money goes in tax-free, grows tax-free, and comes out tax-free for medical costs",
    category: "general"
  },
  "fsa": {
    term: "FSA",
    simple: "Flexible Spending Account — pre-tax money for medical expenses (use it or lose it)",
    example: "You set aside money before taxes, but must spend it by year-end or forfeit it",
    category: "general"
  },
  "referral": {
    term: "Referral",
    simple: "A recommendation from your primary doctor allowing you to see a specialist",
    example: "Some plans (especially HMOs) require a referral before insurance will cover specialist visits",
    category: "coverage"
  },
  "pcp": {
    term: "PCP",
    simple: "Primary Care Provider — your main doctor for general health and referrals",
    example: "Your PCP is usually the first doctor you see for most health issues",
    category: "network"
  },
  "specialist": {
    term: "Specialist",
    simple: "A doctor focused on a specific area of medicine",
    example: "Cardiologists (heart), dermatologists (skin), and orthopedists (bones) are specialists",
    category: "network"
  },
  "covered services": {
    term: "Covered Services",
    simple: "Medical care that your insurance plan will help pay for",
    example: "Check if a service is 'covered' before getting care — if not, you pay 100%",
    category: "coverage"
  },
  "excluded services": {
    term: "Excluded Services",
    simple: "Medical care your insurance will NOT pay for, no matter what",
    example: "Cosmetic surgery and experimental treatments are commonly excluded",
    category: "coverage"
  },
  "medical necessity": {
    term: "Medical Necessity",
    simple: "Care that's required to diagnose or treat your condition (not optional)",
    example: "Insurance uses this term to decide what to cover — they may deny 'medically unnecessary' care",
    category: "coverage"
  },
  "preventive care": {
    term: "Preventive Care",
    simple: "Routine checkups and screenings to catch problems early — usually free",
    example: "Annual physicals, vaccinations, and cancer screenings are often covered at 100%",
    category: "coverage"
  },
  "allowed amount": {
    term: "Allowed Amount",
    simple: "The maximum your insurance will pay for a service",
    example: "If the allowed amount is $100 but the doctor charges $150, you might owe the $50 difference",
    category: "costs"
  },
  "coordination of benefits": {
    term: "Coordination of Benefits",
    simple: "Rules for when you have two insurance plans determining which pays first",
    example: "If you have insurance through your job AND your spouse's job, COB determines payment order",
    category: "claims"
  },
  "cob": {
    term: "COB",
    simple: "Coordination of Benefits — rules for when you have multiple insurance plans",
    example: "Primary insurance pays first, then secondary insurance may cover remaining costs",
    category: "claims"
  },
  "waiting period": {
    term: "Waiting Period",
    simple: "Time you must wait before insurance covers certain services",
    example: "Some plans have a 12-month waiting period for pre-existing conditions",
    category: "coverage"
  },
  "pre-existing condition": {
    term: "Pre-Existing Condition",
    simple: "A health issue you had before your insurance started",
    example: "Under the ACA, insurance cannot deny coverage or charge more for pre-existing conditions",
    category: "coverage"
  },
  "lifetime maximum": {
    term: "Lifetime Maximum",
    simple: "The total amount insurance will pay over your entire life (rare now)",
    example: "The ACA banned lifetime limits for essential health benefits",
    category: "coverage"
  },
  "aca": {
    term: "ACA",
    simple: "Affordable Care Act (Obamacare) — the law that reformed health insurance",
    example: "The ACA requires coverage for pre-existing conditions and free preventive care",
    category: "general"
  },
  "open enrollment": {
    term: "Open Enrollment",
    simple: "The annual period when you can sign up for or change health insurance",
    example: "Usually November-December for marketplace plans, or when your employer specifies",
    category: "general"
  },
  "special enrollment period": {
    term: "Special Enrollment Period",
    simple: "A time outside open enrollment when you can change plans due to life events",
    example: "Getting married, having a baby, or losing job coverage qualifies you for SEP",
    category: "general"
  },
  "sep": {
    term: "SEP",
    simple: "Special Enrollment Period — a chance to get insurance outside the normal window",
    example: "Major life changes like marriage, birth, or job loss trigger a 60-day SEP",
    category: "general"
  }
};

// Function to replace jargon in text with simple explanations
export function replaceJargon(text: string): string {
  let processedText = text;
  
  // Sort by length (longest first) to avoid partial matches
  const sortedTerms = Object.keys(jargonDictionary).sort((a, b) => b.length - a.length);
  
  for (const term of sortedTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      const definition = jargonDictionary[term.toLowerCase()];
      if (definition) {
        return `${match} <span class="text-emerald-600 font-medium">(${definition.simple})</span>`;
      }
      return match;
    });
  }
  
  return processedText;
}

// Helper function to find jargon in text
export function findJargonInText(text: string): JargonEntry[] {
  const found: JargonEntry[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [key, entry] of Object.entries(jargonDictionary)) {
    if (lowerText.includes(key.toLowerCase()) && !found.some(f => f.term === entry.term)) {
      found.push(entry);
    }
  }
  
  return found;
}

// Helper function to get a specific term
export function getJargonExplanation(term: string): JargonEntry | undefined {
  const lowerTerm = term.toLowerCase();
  return jargonDictionary[lowerTerm];
}

// Function to get jargon definition (backward compatibility)
export function getJargonDefinition(term: string) {
  return jargonDictionary[term.toLowerCase()];
}

// Function to check if text contains jargon
export function containsJargon(text: string): boolean {
  const terms = Object.keys(jargonDictionary);
  return terms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(text));
}

// Export categories for filtering
export const jargonCategories = ['costs', 'coverage', 'network', 'claims', 'general'] as const;
export type JargonCategory = typeof jargonCategories[number];

export function getJargonByCategory(category: JargonCategory): JargonEntry[] {
  return Object.values(jargonDictionary).filter(entry => entry.category === category);
}
