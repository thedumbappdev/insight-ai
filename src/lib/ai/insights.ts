import { BusinessKPIs } from "@/lib/analytics/kpi-calculator";
import { DatasetProfile } from "@/types/dataset";
import { generateBusinessInsights, AIBusinessInsight, recommendCharts, AIChartRecommendation, analyzeDataQuality, AIDataQualityIssue } from "./openai";

export interface AIInsightsResult {
  insights: AIBusinessInsight;
  chartRecommendations: AIChartRecommendation[];
  dataQualityIssues: AIDataQualityIssue[];
}

export async function generateAIInsights(
  dataset: DatasetProfile,
  kpis: BusinessKPIs,
  mapping: Record<string, string | undefined>
): Promise<AIInsightsResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      insights: { summary: "", insights: [], recommendations: [] },
      chartRecommendations: [],
      dataQualityIssues: [],
    };
  }

  try {
    const [insights, chartRecommendations, dataQualityIssues] = await Promise.all([
      generateBusinessInsights(
        {
          ...kpis,
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
        },
        dataset.preview,
        dataset.columns.map(c => c.name)
      ),
      recommendCharts(
        dataset.columns.map(c => c.name),
        dataset.preview,
        Object.fromEntries(dataset.columns.map(c => [c.name, c.type]))
      ),
      analyzeDataQuality(
        dataset.columns.map(c => c.name),
        dataset.preview,
        Object.fromEntries(dataset.columns.map(c => [c.name, c.type])),
        Object.fromEntries(dataset.columns.map(c => [c.name, { missing: c.missingValues, unique: c.uniqueValues }]))
      ),
    ]);

    return { insights, chartRecommendations, dataQualityIssues };
  } catch (error) {
    console.error("AI insights generation failed:", error);
    return {
      insights: { summary: "", insights: [], recommendations: [] },
      chartRecommendations: [],
      dataQualityIssues: [],
    };
  }
}