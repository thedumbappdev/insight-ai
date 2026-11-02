"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SavedDataset {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  createdAt: string;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<SavedDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetch("/api/datasets");
        if (!response.ok) {
          throw new Error("Failed to load datasets");
        }
        const data = await response.json();
        setDatasets(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load datasets"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDatasets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Datasets</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your uploaded business datasets.
          </p>
        </div>
        <Link href="/dashboard/datasets/upload" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Upload Dataset
          </Link>
      </div>
      {loading && <p>Loading datasets...</p>}
      {error && (
        <p className="text-red-600">{error}</p>
      )}
      {!loading && !error && datasets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No datasets uploaded yet.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader>
              <CardTitle className="truncate">
                {dataset.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Rows: {dataset.rowCount.toLocaleString()}
              </p>
              <p className="text-sm">
                Columns: {dataset.columnCount}
              </p>
              <p className="text-sm text-muted-foreground">
                Uploaded:{" "}
                {new Date(
                  dataset.createdAt
                ).toLocaleDateString()}
              </p>
              <Link
                  href={`/dashboard/datasets/${dataset.id}`}
                  className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Open Dataset
                </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}