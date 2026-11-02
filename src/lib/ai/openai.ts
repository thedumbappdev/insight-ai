import "server-only";

// OpenRouter - unified API to 100+ AI models
export const openrouter = {
  chat: {
    completions: {
      create: async (params: {
        model?: string;
        messages: { role: string; content: string }[];
        temperature?: number;
        response_format?: { type: "json_object" } | "text";
        stream?: boolean;
      }) => {
        // Use a default model that's widely available
        // If no model specified, try haiku first, then fall back
        const model = params.model || "nvidia/nemotron-3-ultra-550b-a55b:free";

        // Server-safe referer - use origin from env or default
        // In Next.js API routes, window is not available, so use fallback
        const referer = process?.env?.NEXT_PUBLIC_SITE_URL || "http://localhost";
        // Also allow dynamic referer for client-side use if needed
        // but server-side must not access window

        return fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": referer,
            "X-Title": "InsightAI",
          },
          body: JSON.stringify({
            ...params,
            model: model,
          }),
        }).then((res) => {
          if (!res.ok) {
            const errorText = res.status === 429 ? "Rate limit exceeded" : res.statusText;
            throw new Error(`OpenRouter error: ${res.status} - ${errorText}`);
          }
          return res.json();
        });
      },
    },
  },
};

// Check if OpenRouter API key is available
function checkOpenRouterKey(): boolean {
  return !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "your-openrouter-api-key-here");
}

// Mock AI functions for development without API key
async function mockDetectBusinessColumns(
  columns: string[],
  sampleRows: Record<string, unknown>[]
): Promise<AIColumnMapping> {
  const mapping: AIColumnMapping = { confidence: 0.9 };
  const lowerColumns = columns.map((c) => c.toLowerCase());

  if (lowerColumns.includes("order date")) mapping.date = "Order Date";
  else if (lowerColumns.includes("date")) mapping.date = columns[lowerColumns.indexOf("date")];

  if (lowerColumns.includes("sales")) mapping.revenue = "Sales";
  else if (lowerColumns.includes("revenue")) mapping.revenue = "Revenue";
  else if (lowerColumns.includes("amount")) mapping.revenue = "Amount";

  if (lowerColumns.includes("profit")) mapping.profit = "Profit";

  if (lowerColumns.includes("customer id")) mapping.customer = "Customer ID";
  else if (lowerColumns.includes("customer")) mapping.customer = "Customer";

  if (lowerColumns.includes("product name")) mapping.product = "Product Name";
  else if (lowerColumns.includes("product")) mapping.product = "Product";

  if (lowerColumns.includes("category")) mapping.category = "Category";

  if (lowerColumns.includes("region")) mapping.region = "Region";

  if (lowerColumns.includes("order id")) mapping.orderId = "Order ID";

  return mapping;
}

async function mockGenerateBusinessInsights(
  kpis: Record<string, unknown>,
  sampleRows: Record<string, unknown>[],
  columns: string[]
): Promise<AIBusinessInsight> {
  const totalRevenue = kpis.totalRevenue as number || 0;
  const totalProfit = kpis.totalProfit as number || 0;
  const profitMargin = kpis.profitMargin as number || 0;
  const totalCustomers = kpis.totalCustomers as number || 0;

  return {
    summary: `Your dataset contains ${sampleRows.length} records with ${columns.length} columns. Total revenue is $${totalRevenue.toLocaleString()} with a profit margin of ${profitMargin.toFixed(1)}%.`,
    insights: [
      `Total revenue: $${totalRevenue.toLocaleString()}`,
      `Total profit: $${totalProfit.toLocaleString()}`,
      `Profit margin: ${profitMargin.toFixed(1)}%`,
      `Total customers: ${totalCustomers}`,
      `Dataset spans ${columns.length} business metrics`,
    ],
    recommendations: [
      "Consider segmenting customers by region for targeted marketing",
      "Analyze profit margins by product category to identify optimization opportunities",
      "Track revenue trends over time to forecast future performance",
    ],
  };
}

async function mockRecommendCharts(
  columns: string[],
  sampleRows: Record<string, unknown>[],
  columnTypes: Record<string, string>
): Promise<AIChartRecommendation[]> {
  const recommendations: AIChartRecommendation[] = [];
  const lowerColumns = columns.map((c) => c.toLowerCase());

  const dateCol = columns.find(
    (c) => lowerColumns.includes(c.toLowerCase().replace(/[_\s]/g, " "))
  );
  const revenueCol = columns.find(
    (c) => ["sales", "revenue", "amount"].includes(c.toLowerCase())
  );

  if (dateCol && revenueCol) {
    recommendations.push({
      title: "Revenue Over Time",
      type: "line",
      xColumn: dateCol,
      yColumn: revenueCol,
      reason: "Track revenue trends over time to identify seasonal patterns and growth",
    });
  }

  const categoryCol = columns.find((c) => c.toLowerCase().includes("category"));
  if (categoryCol && revenueCol) {
    recommendations.push({
      title: "Revenue by Category",
      type: "bar",
      xColumn: categoryCol,
      yColumn: revenueCol,
      reason: "Compare revenue across product categories to identify top performers",
    });
  }

  const regionCol = columns.find((c) => c.toLowerCase().includes("region"));
  if (regionCol && revenueCol) {
    recommendations.push({
      title: "Revenue by Region",
      type: "bar",
      xColumn: regionCol,
      yColumn: revenueCol,
      reason: "Analyze geographic performance to optimize regional strategies",
    });
  }

  return recommendations;
}

async function mockAnalyzeDataQuality(
  columns: string[],
  sampleRows: Record<string, unknown>[],
  columnTypes: Record<string, string>,
  stats: Record<string, { missing: number; unique: number }>
): Promise<AIDataQualityIssue[]> {
  const issues: AIDataQualityIssue[] = [];

  for (const col of columns) {
    const missing = stats[col]?.missing || 0;
    const unique = stats[col]?.unique || 0;
    const type = columnTypes[col];

    if (missing > 0) {
      issues.push({
        column: col,
        issue: `${missing} missing values (${((missing / sampleRows.length) * 100).toFixed(1)}%)`,
        severity: missing > sampleRows.length * 0.1 ? "high" : "medium",
        suggestion: "Consider imputing missing values or investigating data collection gaps",
      });
    }

    if (type === "number" && unique < sampleRows.length * 0.1) {
      issues.push({
        column: col,
        issue: "Low cardinality for numeric column - may indicate categorical data",
        severity: "low",
        suggestion: "Verify if this should be treated as a category instead of a number",
      });
    }
  }

  return issues;
}

// AI Functions - use OpenRouter when key available, mock otherwise
export async function detectBusinessColumnsWithAI(
  columns: string[],
  sampleRows: Record<string, unknown>[]
): Promise<AIColumnMapping> {
  if (!checkOpenRouterKey()) {
    return mockDetectBusinessColumns(columns, sampleRows);
  }

  const prompt = `You are a business data analyst. Given these dataset columns and sample data, identify which columns correspond to standard business metrics.

Columns: ${columns.join(", ")}

Sample data (first 3 rows):
${sampleRows.slice(0, 3).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join("\n")}

Return a JSON object mapping standard business fields to actual column names:
- date: transaction/order date column
- revenue: sales/revenue/total amount column
- profit: profit/net profit/gross profit column
- customer: customer ID/name column
- product: product name/ID column
- category: product category column
- region: geographic region column
- orderId: order/transaction ID column

Also include a "confidence" field (0-1) for overall mapping confidence.

Only return valid JSON.`;

  const response = await openrouter.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages: [
      { role: "system", content: "You are a business data analyst. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateBusinessInsights(
  kpis: Record<string, unknown>,
  sampleRows: Record<string, unknown>[],
  columns: string[]
): Promise<AIBusinessInsight> {
  if (!checkOpenRouterKey()) {
    return mockGenerateBusinessInsights(kpis, sampleRows, columns);
  }

  const prompt = `You are a business analyst. Given these KPIs and dataset info, generate actionable business insights.

KPIs: ${JSON.stringify(kpis, null, 2)}

Dataset columns: ${columns.join(", ")}
Sample data (first 3 rows):
${sampleRows.slice(0, 3).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join("\n")}

Return JSON with:
- summary: 2-3 sentence executive summary
- insights: array of 3-5 specific insights (e.g., "Electronics drives 45% of revenue", "Profit margin is 22%")
- recommendations: array of 2-3 actionable recommendations

Only return valid JSON.`;

  const response = await openrouter.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages: [
      { role: "system", content: "You are a business analyst. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function recommendCharts(
  columns: string[],
  sampleRows: Record<string, unknown>[],
  columnTypes: Record<string, string>
): Promise<AIChartRecommendation[]> {
  if (!checkOpenRouterKey()) {
    return mockRecommendCharts(columns, sampleRows, columnTypes);
  }

  const prompt = `You are a data visualization expert. Given this dataset structure, recommend the most useful charts.

Columns with types:
${Object.entries(columnTypes)
  .map(([col, type]) => `- ${col}: ${type}`)
  .join("\n")}

Sample data (first 3 rows):
${sampleRows.slice(0, 3).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join("\n")}

Return JSON array of chart recommendations, each with:
- title: descriptive chart title
- type: "line" | "bar" | "pie" | "scatter"
- xColumn: column for x-axis
- yColumn: column for y-axis (or values for pie)
- reason: why this chart is valuable

Only return valid JSON array.`;

  const response = await openrouter.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages: [
      { role: "system", content: "You are a data visualization expert. Return only valid JSON array." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return Array.isArray(result) ? result : result.charts || [];
}

export async function analyzeDataQuality(
  columns: string[],
  sampleRows: Record<string, unknown>[],
  columnTypes: Record<string, string>,
  stats: Record<string, { missing: number; unique: number }>
): Promise<AIDataQualityIssue[]> {
  if (!checkOpenRouterKey()) {
    return mockAnalyzeDataQuality(columns, sampleRows, columnTypes, stats);
  }

  const prompt = `You are a data quality analyst. Identify potential issues in this dataset.

Columns with types and stats:
${columns.map(
  (col) => `- ${col}: ${columnTypes[col] || "unknown"} (missing: ${stats[col]?.missing || 0}, unique: ${stats[col]?.unique || 0})`
).join("\n")}

Sample data (first 5 rows):
${sampleRows.slice(0, 5).map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`).join("\n")}

Return JSON array of issues, each with:
- column: affected column name
- issue: description of the problem
- severity: "high" | "medium" | "low"
- suggestion: how to fix it

Common issues to check: missing values, inconsistent formats, outliers, duplicates, type mismatches, suspicious patterns.

Only return valid JSON array.`;

  const response = await openrouter.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages: [
      { role: "system", content: "You are a data quality analyst. Return only valid JSON array." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return Array.isArray(result) ? result : result.issues || [];
}

// Type definitions (same as before)
export interface AIColumnMapping {
  date?: string;
  revenue?: string;
  profit?: string;
  customer?: string;
  product?: string;
  category?: string;
  region?: string;
  orderId?: string;
  confidence: number;
}

export interface AIBusinessInsight {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface AIChartRecommendation {
  title: string;
  type: "line" | "bar" | "pie" | "scatter";
  xColumn: string;
  yColumn: string;
  reason: string;
}

export interface AIDataQualityIssue {
  column: string;
  issue: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
}