"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DatasetProfile } from "@/types/dataset";
import { DatasetPreview } from "@/components/datasets/dataset-preview";
import { DynamicDashboard } from "@/components/dashboard/dynamic-dashboard";

export default function SavedDatasetPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [dataset, setDataset] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    async function fetchDataset() {
      try {
        const response = await fetch(`/api/datasets/${id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load dataset");
        }
        const data = await response.json();
        setDataset({
          name: data.name,
          rowCount: data.rowCount,
          columnCount: data.columnCount,
          columns: data.columns,
          preview: data.rows.slice(0, 10),
          rows: data.rows,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dataset"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDataset();
  }, [id]);

  if (loading) {
    return <p>Loading dataset...</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!dataset) {
    return <p>Dataset not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{dataset.name}</h1>
        <p className="mt-2 text-muted-foreground">Saved dataset analytics</p>
      </div>
      <DynamicDashboard dataset={dataset} />
      <DatasetPreview dataset={dataset} />
    </div>
  );
}