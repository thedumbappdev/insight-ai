import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  detectBusinessColumnsWithAI,
  generateBusinessInsights,
  recommendCharts,
  analyzeDataQuality,
} from "@/lib/ai/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { datasetId, columns, sampleRows, columnTypes, kpis, stats } = body;

    if (!datasetId || !columns || !sampleRows) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Run AI analyses in parallel
    const [columnMapping, insights, chartRecs, qualityIssues] = await Promise.all([
      detectBusinessColumnsWithAI(columns, sampleRows),
      generateBusinessInsights(kpis || {}, sampleRows, columns),
      recommendCharts(columns, sampleRows, columnTypes || {}),
      analyzeDataQuality(columns, sampleRows, columnTypes || {}, stats || {}),
    ]);

    // Optionally save insights to database
    if (datasetId) {
      await prisma.dataset.update({
        where: { id: datasetId },
        data: {
          // We could store AI insights here if we add fields to the schema
        },
      });
    }

    return NextResponse.json({
      columnMapping,
      insights,
      chartRecommendations: chartRecs,
      qualityIssues,
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}