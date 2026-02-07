export type SummaryBullet = {
  label: string;
  body: string;
};

export type RevenueTier = {
  name: string;
  price: string;
  tagLine: string;
  bullets: string[];
  highlight?: boolean;
};

export type UseOfFundsItem = {
  label: string;
  amount: string;
};

export type ExecSummaryData = {
  brandName: string;          // S Y N Q R A
  productName: string;        // Synqra
  tagline: string;            // Intelligence that compounds. Costs that don’t.
  periodLabel: string;        // Q4 2024

  targetRaise: string;        // $750K
  targetRaiseNote: string;    // Seed round for 12–18mo runway
  targetRevenue: string;      // $750K
  targetRevenueNote: string;  // ARR with 500+ subscribers

  overview: string;
  marketProblem: string;

  solutionArchitecture: SummaryBullet[];
  revenueTiers: RevenueTier[];
  additionalRevenueNotes: string;

  whySynqraWins: SummaryBullet[];
  whyNow: string;

  useOfFunds: UseOfFundsItem[];
  roadmap: string[];

  founderBlurb: string;
  platformUrl: string;
  location: string;
  status: string;

  footerCta: string;
  footerNote: string;
};

