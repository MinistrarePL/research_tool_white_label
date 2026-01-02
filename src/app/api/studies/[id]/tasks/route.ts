import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const maxOrder = await prisma.task.aggregate({
      where: { studyId: id },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        question: body.question,
        correctNodeId: body.correctNodeId || null,
        displayTimeSeconds: body.displayTimeSeconds ?? 5,
        order: (maxOrder._max.order ?? -1) + 1,
        studyId: id,
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

