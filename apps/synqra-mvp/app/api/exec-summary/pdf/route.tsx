import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
  Font,
} from "@react-pdf/renderer";
import { buildExecSummary } from "@/features/executive-summary/execSummary.generator";
import { execSummaryTokens as t } from "@/features/executive-summary/execSummary.tokens";

// Register fonts (optional, using standard fonts for now to avoid loading issues)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: t.colors.background,
    color: t.colors.textPrimary,
    padding: 40,
    fontFamily: "Helvetica", // Standard font
  },
  leftColumn: {
    width: "66%", // Approx 3fr/4.3fr
    paddingRight: 30,
  },
  rightColumn: {
    width: "34%", // Approx 1.3fr/4.3fr
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: t.colors.border,
  },
  header: {
    marginBottom: 25,
  },
  brandName: {
    fontSize: 24,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 5,
    color: t.colors.textPrimary,
  },
  tagline: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: t.colors.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: t.colors.accent,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: t.colors.textPrimary,
  },
  mutedText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: t.colors.textMuted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: t.colors.surface,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: t.colors.border,
    width: "30%", // Roughly 3 columns
    minHeight: 80,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 5,
    fontWeight: "bold",
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    backgroundColor: t.colors.accent,
    borderRadius: 2,
    marginRight: 5,
    marginTop: 4,
  },
  metricBlock: {
    marginBottom: 20,
  },
  asideLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: t.colors.textMuted,
    marginBottom: 4,
  },
  asideValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: t.colors.accent,
  },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: t.colors.accent,
    paddingLeft: 10,
    marginBottom: 20,
    fontStyle: "italic", // Helvetica-Oblique
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: t.colors.textMuted,
  },
});

const ExecSummaryPDF = ({ dataOverride }: { dataOverride?: any }) => {
  const doc = buildExecSummary(dataOverride);
  const { data, meta, metrics } = doc;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* LEFT COLUMN */}
        <View style={styles.leftColumn}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandName}>{meta.brandName}</Text>
            <Text style={styles.tagline}>{meta.tagline}</Text>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.bodyText}>{data.overview}</Text>
          </View>

          {/* Market Problem */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Problem</Text>
            <Text style={styles.bodyText}>{data.marketProblem}</Text>
          </View>

          {/* Solution Architecture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solution Architecture</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {data.solutionArchitecture.map((item, i) => (
                <View key={i} style={{ ...styles.card, width: "32%" }}>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.mutedText}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Revenue Model */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Model</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              {data.revenueTiers.map((tier, i) => (
                <View key={i} style={{ ...styles.card, width: "32%" }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                     <Text style={{ fontSize: 8, fontWeight: 'bold', color: t.colors.textPrimary }}>{tier.name}</Text>
                     <Text style={{ fontSize: 8, fontWeight: 'bold', color: t.colors.accent }}>{tier.price}</Text>
                  </View>
                  <Text style={{...styles.mutedText, fontSize: 7, marginBottom: 4}}>{tier.tagLine}</Text>
                  {tier.bullets.map((b, j) => (
                      <Text key={j} style={{ fontSize: 6, color: t.colors.textMuted }}>• {b}</Text>
                  ))}
                </View>
              ))}
            </View>
             <Text style={styles.mutedText}>{data.additionalRevenueNotes}</Text>
          </View>

          {/* Why Synqra Wins */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Synqra Wins</Text>
            {data.whySynqraWins.map((item, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.bodyText}>
                  <Text style={{ fontWeight: "bold" }}>{item.label}</Text>
                  <Text style={{ color: t.colors.textMuted }}> — {item.body}</Text>
                </Text>
              </View>
            ))}
          </View>

           {/* Footer */}
           <View style={styles.footer}>
               <Text style={styles.footerText}>
                 Platform: {data.platformUrl} | Location: {data.location} | Status: {data.status}
               </Text>
               <Text style={styles.footerText}>{data.footerNote}</Text>
           </View>
        </View>

        {/* RIGHT COLUMN */}
        <View style={styles.rightColumn}>
          {/* Metrics */}
          <View style={styles.metricBlock}>
            <Text style={styles.asideLabel}>Target Raise</Text>
            <Text style={styles.asideValue}>{metrics.targetRaise}</Text>
            <Text style={styles.mutedText}>{metrics.targetRaiseNote}</Text>
          </View>

          <View style={styles.metricBlock}>
            <Text style={styles.asideLabel}>12-Month Target</Text>
            <Text style={styles.asideValue}>{metrics.targetRevenue}</Text>
            <Text style={styles.mutedText}>{metrics.targetRevenueNote}</Text>
          </View>

          {/* Quote */}
          <View style={styles.quote}>
            <Text style={styles.mutedText}>
              “The first platform where intelligence compounds while costs stay flat.”
            </Text>
          </View>

          {/* Use of Funds */}
          <View style={styles.section}>
             <Text style={styles.asideLabel}>Use of Funds</Text>
             {data.useOfFunds.map((item, i) => (
                 <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                     <Text style={{ fontSize: 8, color: t.colors.textPrimary }}>{item.label}</Text>
                     <Text style={{ fontSize: 8, color: t.colors.accent }}>{item.amount}</Text>
                 </View>
             ))}
          </View>

          {/* Roadmap */}
          <View style={styles.section}>
             <Text style={styles.asideLabel}>Roadmap</Text>
             {data.roadmap.map((item, i) => (
                 <Text key={i} style={{ fontSize: 8, color: t.colors.textPrimary, marginBottom: 3 }}>• {item}</Text>
             ))}
          </View>

          {/* Founder */}
          <View style={styles.section}>
             <Text style={styles.asideLabel}>Founder</Text>
             <Text style={styles.mutedText}>{data.founderBlurb}</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataOverride } = body;

    const stream = await renderToStream(<ExecSummaryPDF dataOverride={dataOverride} />);
    
    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="synqra-executive-summary.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

