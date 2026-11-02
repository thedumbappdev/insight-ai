import { NextResponse } from "next/server";
import { generateAIInsights } from "@/lib/ai/insights";
import { detectBusinessColumns } from "@/lib/ai/column-detector";
import { calculateKPIs } from "@/lib/analytics/kpi-calculator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dataset } = body;

    if (!dataset || !dataset.columns || !dataset.rows) {
      return NextResponse.json(
        { error: "Invalid dataset" },
        { status: 400 }
      );
    }

    const mapping = await detectBusinessColumns(dataset);
    const kpis = calculateKPIs(dataset.rows, mapping);
    const aiInsights = await generateAIInsights(dataset, kpis, mapping);

    return NextResponse.json({
      mapping,
      kpis,
      ...aiInsights,
    });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights" },
      { status: 500 }
    );
  }
}