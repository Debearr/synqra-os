export type SummaryBullet = {
  title: string;
  description: string;
};

export type UseOfFundsItem = {
  label: string;
  amount: string;
};

export type ExecSummaryDoc = {
  overview: string;
  marketProblem: string;
  solutionArchitecture: SummaryBullet[];
  whySynqraWins: string[];
  whyNow: string;
  targetRaise: string;
  targetRevenue: string;
  useOfFunds: UseOfFundsItem[];
  roadmap: string[];
  founder: string;
  // ... any other fields needed
};

