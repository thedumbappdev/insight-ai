import { DatasetProfile, BusinessColumnMapping } from "@/types/dataset";
import { detectBusinessColumns as detectBusinessColumnsDeterministic } from "@/lib/analytics/column-detector";
import { detectBusinessColumnsWithAI, AIColumnMapping } from "./openai";

export async function detectBusinessColumns(
  dataset: DatasetProfile
): Promise<BusinessColumnMapping> {
  const deterministic = detectBusinessColumnsDeterministic(dataset);

  const hasAllFields =
    deterministic.date &&
    deterministic.revenue &&
    deterministic.profit &&
    deterministic.customer &&
    deterministic.product &&
    deterministic.category &&
    deterministic.region &&
    deterministic.orderId;

  if (hasAllFields || !process.env.OPENAI_API_KEY) {
    return deterministic;
  }

  try {
    const aiResult: AIColumnMapping = await detectBusinessColumnsWithAI(
      dataset.columns.map(c => c.name),
      dataset.preview
    );

    return {
      date: aiResult.date || deterministic.date,
      revenue: aiResult.revenue || deterministic.revenue,
      profit: aiResult.profit || deterministic.profit,
      customer: aiResult.customer || deterministic.customer,
      product: aiResult.product || deterministic.product,
      category: aiResult.category || deterministic.category,
      region: aiResult.region || deterministic.region,
      orderId: aiResult.orderId || deterministic.orderId,
    };
  } catch (error) {
    console.error("AI column detection failed, using deterministic:", error);
    return deterministic;
  }
}