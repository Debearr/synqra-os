"use client";

import React from "react";
import { execSummaryTokens as t, execSummaryTokens } from "./execSummary.tokens";
import { buildExecSummary } from "./execSummary.generator";
import type { ExecSummaryData, RevenueTier } from "./execSummary.types";

type Props = {
  dataOverride?: ExecSummaryData;
};

export const ExecutiveSummaryPage: React.FC<Props> = ({ dataOverride }) => {
  const doc = buildExecSummary(dataOverride);
  const { data, meta, metrics } = doc;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.colors.background,
        color: t.colors.textPrimary,
        display: "flex",
        justifyContent: "center",
        padding: "3rem 1.5rem"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: t.layout.maxWidth,
          display: "grid",
          gridTemplateColumns: "3fr 1.3fr",
          columnGap: "3rem"
        }}
      >
        {/* LEFT COLUMN */}
        <main>
          {/* Brand + Tagline */}
          <header style={{ marginBottom: "2.5rem" }}>
            <h1
              style={{
                fontSize: "2rem",
                letterSpacing: t.typography.headingTracking,
                textTransform: "uppercase",
                marginBottom: "0.25rem"
              }}
            >
              {meta.brandName}
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: t.typography.headingTracking,
                color: t.colors.textMuted
              }}
            >
              {meta.tagline}
            </p>
          </header>

          {/* Overview */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Overview" />
            <BodyText>{data.overview}</BodyText>
          </section>

          {/* Market Problem */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Market Problem" />
            <BodyText>{data.marketProblem}</BodyText>
          </section>

          {/* Solution Architecture */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Solution Architecture" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "1.5rem"
              }}
            >
              {data.solutionArchitecture.map((item) => (
                <Card key={item.label}>
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      textTransform: "uppercase",
                      letterSpacing: t.typography.headingTracking,
                      marginBottom: "0.5rem"
                    }}
                  >
                    {item.label}
                  </h3>
                  <BodyText muted>{item.body}</BodyText>
                </Card>
              ))}
            </div>
          </section>

          {/* Revenue Model */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Revenue Model" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "1.5rem"
              }}
            >
              {data.revenueTiers.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
            <BodyText muted style={{ marginTop: "1rem" }}>
              {data.additionalRevenueNotes}
            </BodyText>
          </section>

          {/* Why Synqra Wins */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Why Synqra Wins" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data.whySynqraWins.map((item) => (
                <li
                  key={item.label}
                  style={{
                    display: "flex",
                    columnGap: "0.75rem",
                    marginBottom: "0.75rem"
                  }}
                >
                  <span
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      marginTop: "0.5rem",
                      background: t.colors.accentSoft,
                      borderRadius: "999px",
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <strong>{item.label}</strong>{" "}
                    <span style={{ color: t.colors.textMuted }}>
                      — {item.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Why Now */}
          <section style={{ marginBottom: t.layout.sectionGap }}>
            <SectionTitle label="Why Now" />
            <BodyText>{data.whyNow}</BodyText>
          </section>

          {/* Footer line */}
          <footer
            style={{
              borderTop: `1px solid ${t.colors.border}`,
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: t.colors.textMuted
            }}
          >
            <span>
              Platform: {data.platformUrl} &nbsp;·&nbsp; Location:{" "}
              {data.location} &nbsp;·&nbsp; Status: {data.status}
            </span>
            <span>{data.footerNote}</span>
          </footer>
        </main>

        {/* RIGHT COLUMN – Metrics, use of funds, roadmap, founder */}
        <aside
          style={{
            borderLeft: `1px solid ${t.colors.border}`,
            paddingLeft: "2rem",
            fontSize: "0.85rem"
          }}
        >
          {/* Metrics */}
          <div style={{ marginBottom: "2rem" }}>
            <AsideLabel>Target Raise</AsideLabel>
            <AsideMetric value={metrics.targetRaise} note={metrics.targetRaiseNote} />

            <AsideLabel style={{ marginTop: "1.5rem" }}>
              12-Month Target
            </AsideLabel>
            <AsideMetric
              value={metrics.targetRevenue}
              note={metrics.targetRevenueNote}
            />
          </div>

          {/* Quote */}
          <blockquote
            style={{
              borderLeft: `2px solid ${t.colors.accentSoft}`,
              paddingLeft: "1rem",
              fontStyle: "italic",
              marginBottom: "2rem",
              color: t.colors.textMuted
            }}
          >
            “The first platform where intelligence compounds while costs stay
            flat.”
          </blockquote>

          {/* Use of Funds */}
          <div style={{ marginBottom: "2rem" }}>
            <AsideLabel>Use of Funds</AsideLabel>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data.useOfFunds.map((item) => (
                <li
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem"
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: t.colors.accentSoft }}>
                    {item.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <div style={{ marginBottom: "2rem" }}>
            <AsideLabel>Roadmap</AsideLabel>
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              {data.roadmap.map((item) => (
                <li key={item} style={{ marginBottom: "0.4rem" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Founder */}
          <div style={{ marginBottom: "2rem" }}>
            <AsideLabel>Founder</AsideLabel>
            <BodyText muted>{data.founderBlurb}</BodyText>
          </div>

          {/* CTA */}
          <button
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: "999px",
              border: "1px solid " + t.colors.accentSoft,
              background:
                "linear-gradient(135deg, rgba(201,169,97,0.18), rgba(255,255,255,0.04))",
              color: t.colors.textPrimary,
              fontSize: "0.85rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer"
            }}
          >
            {data.footerCta}
          </button>
        </aside>
      </div>
    </div>
  );
};

// Small helpers

type TextProps = {
  children: React.ReactNode;
  muted?: boolean;
  style?: React.CSSProperties;
};

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <h2
    style={{
      fontSize: "0.9rem",
      textTransform: "uppercase",
      letterSpacing: "0.18em",
      color: t.colors.accentSoft,
      marginBottom: "0.75rem"
    }}
  >
    {label}
  </h2>
);

const BodyText: React.FC<TextProps> = ({ children, muted, style }) => (
  <p
    style={{
      fontSize: t.typography.bodySize,
      lineHeight: t.typography.bodyLineHeight,
      color: muted
        ? t.colors.textMuted
        : t.colors.textPrimary,
      margin: 0,
      ...style
    }}
  >
    {children}
  </p>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: t.colors.surface,
      borderRadius: "0.75rem",
      border: `1px solid ${t.colors.border}`,
      padding: "1.25rem",
      minHeight: "140px"
    }}
  >
    {children}
  </div>
);

const PricingCard: React.FC<{ tier: RevenueTier }> = ({ tier }) => (
  <Card>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: "0.5rem"
      }}
    >
      <span style={{ fontWeight: 600 }}>{tier.name}</span>
      <span
        style={{
          color: t.colors.accentSoft,
          fontWeight: 600
        }}
      >
        {tier.price}
      </span>
    </div>
    <BodyText muted style={{ marginBottom: "0.5rem" }}>
      {tier.tagLine}
    </BodyText>
    <ul
      style={{
        paddingLeft: "1.1rem",
        margin: 0,
        fontSize: "0.8rem",
        color: t.colors.textMuted
      }}
    >
      {tier.bullets.map((bullet) => (
        <li key={bullet} style={{ marginBottom: "0.25rem" }}>
          {bullet}
        </li>
      ))}
    </ul>
    {tier.highlight && (
      <div
        style={{
          marginTop: "0.75rem",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: t.colors.accentSoft
        }}
      >
        Recommended
      </div>
    )}
  </Card>
);

const AsideLabel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style
}) => (
  <div
    style={{
      fontSize: "0.75rem",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      color: t.colors.textMuted,
      marginBottom: "0.35rem",
      ...style
    }}
  >
    {children}
  </div>
);

const AsideMetric: React.FC<{ value: string; note: string }> = ({
  value,
  note
}) => (
  <div style={{ marginBottom: "0.25rem" }}>
    <div
      style={{
        fontSize: "1.3rem",
        fontWeight: 600,
        color: t.colors.accentSoft
      }}
    >
      {value}
    </div>
    <BodyText muted style={{ fontSize: "0.8rem" }}>
      {note}
    </BodyText>
  </div>
);

