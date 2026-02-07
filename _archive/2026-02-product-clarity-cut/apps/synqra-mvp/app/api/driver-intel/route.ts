import { NextRequest, NextResponse } from "next/server";
import { calculateDailyEarnings, projectShiftEarnings } from "@/lib/driver-intel/earnings";
import {
  evaluateDistanceFilter,
  evaluateMultiStopEfficiency,
  evaluatePayoutFilter,
  evaluateWeightFilter,
} from "@/lib/driver-intel/filters";
import { computeDriverHealthIndex } from "@/lib/driver-intel/driverHealth";
import { toOfferScoreResult } from "@/lib/driver-intel/offerScoring";
import {
  driverHealthSnapshotSchema,
  offerSchema,
  shiftDaySchema,
} from "@/engine/validators";
import {
  driverHealthJsonSchema,
  driverIntelSystemPrompt,
  offerScoreJsonSchema,
} from "@/engine/prompt-templates/driver-intel";
import { routeDriverIntelModel } from "@/engine/router/model-router";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Driver Intelligence mock endpoints ready",
    schemas: {
      offerScoreJsonSchema,
      driverHealthJsonSchema,
    },
    prompt: driverIntelSystemPrompt,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action: string = body.action ?? "scoreOffer";

    switch (action) {
      case "scoreOffer": {
        const offer = offerSchema.parse(body.offer);

        const distance = evaluateDistanceFilter(offer, {
          maxDistanceMiles: body.maxDistanceMiles ?? 25,
          preferredRangeMiles: body.preferredRangeMiles,
        });
        const payout = evaluatePayoutFilter(offer, {
          minRatePerMile: body.minRatePerMile ?? 1.2,
          minRatePerMinute: body.minRatePerMinute ?? 0.25,
        });
        const weight = evaluateWeightFilter(offer, {
          maxWeightLbs: body.maxWeightLbs ?? 50,
        });
        const multiStop = evaluateMultiStopEfficiency(offer, {
          maxStops: body.maxStops ?? 5,
          maxExtraMilesPerStop: body.maxExtraMilesPerStop ?? 6,
        });

        const durationScore = Math.max(
          20,
          100 - Math.min(offer.durationMinutes, 90)
        );

        const score = toOfferScoreResult({
          distanceScore: distance.score,
          payoutScore: payout.score,
          durationScore,
          weightScore: weight.score,
          multiStopScore: multiStop.score,
          driverRatingScore: offer.rating ? (offer.rating / 5) * 100 : undefined,
        });

        return NextResponse.json({
          ok: true,
          data: {
            filters: { distance, payout, weight, multiStop },
            score,
          },
          meta: {
            model: routeDriverIntelModel({
              task: "scoring",
              priority: body.priority,
              payloadTokens: 512,
            }),
            schema: offerScoreJsonSchema,
          },
        });
      }

      case "dailyEarnings": {
        const shiftDay = shiftDaySchema.parse(body.day);
        const result = calculateDailyEarnings(shiftDay, {
          vehicleCostPerMile: body.vehicleCostPerMile,
          targetEarningsPerHour: body.targetEarningsPerHour,
          extraExpenses: body.extraExpenses,
        });

        return NextResponse.json({
          ok: true,
          data: result,
        });
      }

      case "projectShift": {
        const offers = offerSchema.array().parse(body.completedOffers);
        const result = projectShiftEarnings({
          shiftWindowMinutes: body.shiftWindowMinutes ?? 480,
          elapsedMinutes: body.elapsedMinutes ?? 0,
          completedOffers: offers,
          options: {
            vehicleCostPerMile: body.vehicleCostPerMile,
            targetEarningsPerHour: body.targetEarningsPerHour,
          },
        });

        return NextResponse.json({ ok: true, data: result });
      }

      case "health": {
        const snapshot = driverHealthSnapshotSchema.parse(body.snapshot);
        const result = computeDriverHealthIndex(snapshot, {
          hoursDriven: body.hoursDriven,
          lastBreakMinutesAgo: body.lastBreakMinutesAgo,
        });
        return NextResponse.json({
          ok: true,
          data: result,
          schema: driverHealthJsonSchema,
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
