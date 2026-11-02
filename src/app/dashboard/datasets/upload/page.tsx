"use client";

import { useState } from "react";

import { CsvUpload } from "@/components/datasets/csv-upload";
import { DatasetPreview } from "@/components/datasets/dataset-preview";
import { DynamicDashboard } from "@/components/dashboard/dynamic-dashboard";
import { DatasetProfile } from "@/types/dataset";
import { BusinessColumnMapping } from "@/types/dataset";
import { detectBusinessColumns } from "@/lib/analytics/column-detector";
import { calculateKPIs } from "@/lib/analytics/kpi-calculator";
import { Sparkles, Brain, AlertTriangle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface AIAnalysisResult {
  columnMapping: BusinessColumnMapping & { confidence: number };
  insights: {
    summary: string;
    insights: string[];
    recommendations: string[];
  };
  chartRecommendations: {
    title: string;
    type: "line" | "bar" | "pie" | "scatter";
    xColumn: string;
    yColumn: string;
    reason: string;
  }[];
  qualityIssues: {
    column: string;
    issue: string;
    severity: "high" | "medium" | "low";
    suggestion: string;
  }[];
}

export default function UploadDatasetPage() {
  const [dataset, setDataset] = useState<DatasetProfile | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDatasetId, setSavedDatasetId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  async function saveDataset() {
    if (!dataset?.rows) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: dataset.name,
          rowCount: dataset.rowCount,
          columnCount: dataset.columnCount,
          columns: dataset.columns,
          rows: dataset.rows,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save dataset");
      }
      setSavedDatasetId(result.id);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save dataset"
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAIAnalysis() {
    if (!dataset) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const rows = dataset.rows || [];
      const columns = dataset.columns.map(c => c.name);
      const columnTypes = Object.fromEntries(dataset.columns.map(c => [c.name, c.type]));
      const stats = Object.fromEntries(dataset.columns.map(c => [c.name, { missing: c.missingValues, unique: c.uniqueValues }]));

      // Calculate KPIs using current mapping
      const mapping = detectBusinessColumns(dataset);
      const kpis = calculateKPIs(rows, mapping);

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: savedDatasetId,
          columns,
          sampleRows: rows.slice(0, 10),
          columnTypes,
          kpis,
          stats,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "AI analysis failed");
      }
      setAiAnalysis(result);
      setActiveTab("ai-insights");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Smart Dataset Analysis
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload your dataset and automatically generate a business
          intelligence dashboard.
        </p>
      </div>

      <CsvUpload
        onDatasetLoaded={(data) => {
          setDataset(data);
          setShowDashboard(false);
          setSavedDatasetId(null);
          setSaveError(null);
          setAiAnalysis(null);
          setAiError(null);
        }}
      />

      {dataset && (
        <>
          <DatasetPreview dataset={dataset} />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowDashboard(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Generate Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={saveDataset}
              disabled={saving || !!savedDatasetId}
            >
              {saving
                ? "Saving..."
                : savedDatasetId
                ? "Dataset Saved"
                : "Save Dataset"}
            </Button>
            <Button
              variant="outline"
              onClick={runAIAnalysis}
              disabled={aiLoading || !savedDatasetId}
            >
              {aiLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Analysis
                </>
              )}
            </Button>
          </div>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          {aiError && <p className="text-sm text-red-600">{aiError}</p>}
          {savedDatasetId && (
            <p className="text-sm text-green-600">Dataset saved successfully!</p>
          )}
        </>
      )}

      {dataset && showDashboard && <DynamicDashboard dataset={dataset} />}

      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis Results
              <Badge variant="secondary">Confidence: {Math.round(aiAnalysis.columnMapping.confidence * 100)}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="column-mapping">
                  <Sparkles className="mr-2 h-4 w-4" /> Column Mapping
                </TabsTrigger>
                <TabsTrigger value="ai-insights">
                  <Brain className="mr-2 h-4 w-4" /> Insights
                </TabsTrigger>
                <TabsTrigger value="chart-recs">
                  <BarChart3 className="mr-2 h-4 w-4" /> Chart Recs
                </TabsTrigger>
                <TabsTrigger value="quality">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Data Quality
                </TabsTrigger>
              </TabsList>

              <TabsContent value="column-mapping" className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(aiAnalysis.columnMapping).map(([key, value]) => {
                    if (key === "confidence") return null;
                    return (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {key}
                        </p>
                        <p className="font-medium capitalize">{value || "Not detected"}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="ai-insights" className="space-y-4">
                <div>
                  <p className="text-muted-foreground">{aiAnalysis.insights.summary}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Insights</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    {aiAnalysis.insights.insights.map((insight, i) => (
                      <li key={i} className="text-sm">{insight}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    {aiAnalysis.insights.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="chart-recs" className="space-y-4">
                {aiAnalysis.chartRecommendations.map((chart, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{chart.title}</h4>
                      <Badge variant="outline">{chart.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      X: {chart.xColumn} | Y: {chart.yColumn}
                    </p>
                    <p className="text-sm mt-2">{chart.reason}</p>
                  </div>
                ))}
                {aiAnalysis.chartRecommendations.length === 0 && (
                  <p className="text-muted-foreground">No chart recommendations available.</p>
                )}
              </TabsContent>

              <TabsContent value="quality" className="space-y-4">
                {aiAnalysis.qualityIssues.map((issue, i) => (
                  <div key={i} className="p-4 rounded-lg border" style={{ borderLeftColor: issue.severity === "high" ? "red" : issue.severity === "medium" ? "orange" : "green", borderLeftWidth: 4 }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{issue.column}</h4>
                        <p className="text-sm text-muted-foreground">{issue.issue}</p>
                      </div>
                      <Badge variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "default" : "secondary"}>{issue.severity}</Badge>
                    </div>
                    <p className="text-sm mt-2 text-indigo-600">{issue.suggestion}</p>
                  </div>
                ))}
                {aiAnalysis.qualityIssues.length === 0 && (
                  <p className="text-muted-foreground">No data quality issues detected.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}