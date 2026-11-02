import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const datasets = await prisma.dataset.findMany({
      select: {
        id: true,
        name: true,
        rowCount: true,
        columnCount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(datasets);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch datasets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      rowCount,
      columnCount,
      columns,
      rows,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !Array.isArray(columns) ||
      !Array.isArray(rows) ||
      !Number.isInteger(rowCount) ||
      !Number.isInteger(columnCount) ||
      rowCount !== rows.length ||
      columnCount !== columns.length
    ) {
      return NextResponse.json(
        { error: "Invalid dataset" },
        { status: 400 }
      );
    }

    if (
      rows.length > 10000 ||
      columns.length > 100
    ) {
      return NextResponse.json(
        { error: "Dataset exceeds MVP limits" },
        { status: 413 }
      );
    }

    const dataset = await prisma.dataset.create({
      data: {
        name,
        rowCount,
        columnCount,
        columns,
        rows,
      },
    });

    return NextResponse.json(
      {
        id: dataset.id,
        name: dataset.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save dataset" },
      { status: 500 }
    );
  }
}