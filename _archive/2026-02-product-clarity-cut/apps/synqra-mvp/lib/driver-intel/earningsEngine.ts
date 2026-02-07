import {
  CompletedOffer,
  DailyEarningsOptions,
  DailyEarningsResult,
  Expense,
  OfferEarnings,
} from "./types";

const toCurrency = (value: number) => Math.round(value * 100) / 100;

const sumPayout = (offer: CompletedOffer) => {
  const { base, bonus, tips, reimbursements, adjustments = 0 } = offer.payout;
  return base + bonus + tips + reimbursements + adjustments;
};

const sumExpenses = (expenses: Expense[] = []) =>
  expenses.reduce((total, expense) => total + expense.amount, 0);

export function calculateOfferEarnings(
  offer: CompletedOffer,
  options?: { vehicleCostPerMile?: number; extraExpenses?: Expense[] }
): OfferEarnings {
  const gross = sumPayout(offer);
  const mileageCost = (options?.vehicleCostPerMile ?? 0) * offer.distanceMiles;
  const extraExpenses = sumExpenses(options?.extraExpenses);
  const totalExpenses = mileageCost + extraExpenses;
  const net = gross - totalExpenses;

  return {
    offerId: offer.id,
    gross: toCurrency(gross),
    net: toCurrency(net),
    mileage: offer.distanceMiles,
    durationMinutes: offer.durationMinutes,
    payoutBreakdown: offer.payout,
    expenseImpact: [
      ...(mileageCost
        ? [
            {
              expense: {
                category: "maintenance" as const,
                amount: toCurrency(mileageCost),
                label: "per-mile vehicle cost",
              },
              appliedTo: offer.id,
            },
          ]
        : []),
      ...(options?.extraExpenses?.map((expense) => ({
        expense,
        appliedTo: offer.id,
      })) ?? []),
    ],
    serviceType: offer.serviceType,
  };
}

export function aggregateDailyEarnings(
  offers: CompletedOffer[],
  date: string,
  options?: DailyEarningsOptions
): DailyEarningsResult {
  const offerEarnings: OfferEarnings[] = offers.map((offer) =>
    calculateOfferEarnings(offer, {
      vehicleCostPerMile: options?.vehicleCostPerMile,
    })
  );

  const grossTotal = offerEarnings.reduce((sum, offer) => sum + offer.gross, 0);
  const expensesTotal =
    sumExpenses(options?.extraExpenses) +
    (options?.vehicleCostPerMile ?? 0) *
      offers.reduce((miles, offer) => miles + offer.distanceMiles, 0);

  const netTotal = grossTotal - expensesTotal;
  const totalMiles = offers.reduce(
    (miles, offer) => miles + offer.distanceMiles,
    0
  );
  const activeMinutes = offers.reduce(
    (minutes, offer) => minutes + offer.durationMinutes,
    0
  );

  const earningsPerHour =
    activeMinutes > 0 ? netTotal / (activeMinutes / 60) : netTotal;
  const earningsPerMile = totalMiles > 0 ? netTotal / totalMiles : netTotal;

  const byServiceType = offerEarnings.reduce<Record<string, number>>(
    (acc, offer) => {
      const key = offer.serviceType ?? "unspecified";
      acc[key] = (acc[key] ?? 0) + offer.net;
      return acc;
    },
    {}
  );

  const varianceFromTargetPerHour =
    options?.targetEarningsPerHour !== undefined
      ? toCurrency(earningsPerHour - options.targetEarningsPerHour)
      : undefined;

  return {
    date,
    grossTotal: toCurrency(grossTotal),
    netTotal: toCurrency(netTotal),
    expensesTotal: toCurrency(expensesTotal),
    totalAdjustments: toCurrency(
      offers.reduce(
        (sum, offer) => sum + (offer.payout.adjustments ?? 0),
        0
      )
    ),
    totalMiles,
    activeMinutes,
    earningsPerHour: toCurrency(earningsPerHour),
    earningsPerMile: toCurrency(earningsPerMile),
    varianceFromTargetPerHour,
    byServiceType,
    offers: offerEarnings,
  };
}
