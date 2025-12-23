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
import {
  ensureCorrelationId,
  logSafeguard,
  normalizeError,
} from "@/lib/safeguards";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Driver Intelligence mock endpoints ready",
    schemas: {
      offerScoreJsonSchema,
      driverHealthJsonSchema,
    },
    prompt: driverIntelSystemPrompt,
    correlationId: ensureCorrelationId(null),
  });
}

export async function POST(req: NextRequest) {
  try {
    const correlationId = ensureCorrelationId(req.headers.get("x-correlation-id"));
    const body = await req.json();
    const action: string = body.action ?? "scoreOffer";

    logSafeguard({
      level: "info",
      message: "driver-intel.start",
      scope: "driver-intel",
      correlationId,
      data: { action },
    });

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

        logSafeguard({
          level: "info",
          message: "driver-intel.score.success",
          scope: "driver-intel",
          correlationId,
          data: { offerId: offer.id, model: routeDriverIntelModel({ task: "scoring", priority: body.priority, payloadTokens: 512 }) },
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
          correlationId,
        });
      }

      case "dailyEarnings": {
        const shiftDay = shiftDaySchema.parse(body.day);
        const result = calculateDailyEarnings(shiftDay, {
          vehicleCostPerMile: body.vehicleCostPerMile,
          targetEarningsPerHour: body.targetEarningsPerHour,
          extraExpenses: body.extraExpenses,
        });

        logSafeguard({
          level: "info",
          message: "driver-intel.daily.success",
          scope: "driver-intel",
          correlationId,
          data: { items: shiftDay.completedOffers?.length || 0 },
        });

        return NextResponse.json({
          ok: true,
          data: result,
          correlationId,
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

        logSafeguard({
          level: "info",
          message: "driver-intel.project.success",
          scope: "driver-intel",
          correlationId,
          data: { offers: offers.length },
        });

        return NextResponse.json({ ok: true, data: result, correlationId });
      }

      case "health": {
        const snapshot = driverHealthSnapshotSchema.parse(body.snapshot);
        const result = computeDriverHealthIndex(snapshot, {
          hoursDriven: body.hoursDriven,
          lastBreakMinutesAgo: body.lastBreakMinutesAgo,
        });
        logSafeguard({
          level: "info",
          message: "driver-intel.health.success",
          scope: "driver-intel",
          correlationId,
        });
        return NextResponse.json({
          ok: true,
          data: result,
          schema: driverHealthJsonSchema,
          correlationId,
        });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}`, correlationId },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const normalized = normalizeError(error);
    const correlationId = ensureCorrelationId(
      (error as any)?.correlationId || undefined
    );
    logSafeguard({
      level: "error",
      message: "driver-intel.error",
      scope: "driver-intel",
      correlationId,
      data: { error: normalized.code },
    });
    return NextResponse.json(
      { ok: false, error: normalized.safeMessage, correlationId },
      { status: normalized.status }
    );
  }
}
