import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const participant = await prisma.participant.create({
    data: {
      studyId: id,
    },
  });

  return NextResponse.json(participant);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { participantId, results, type } = body;

  if (type === "CARD_SORTING") {
    // Delete existing results for this participant
    await prisma.cardSortResult.deleteMany({
      where: { participantId },
    });

    // Create new results
    for (const result of results) {
      await prisma.cardSortResult.create({
        data: {
          cardId: result.cardId,
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          participantId,
        },
      });
    }
  } else if (type === "TREE_TESTING") {
    for (const result of results) {
      await prisma.treeTestResult.create({
        data: {
          taskId: result.taskId,
          selectedPath: JSON.stringify(result.selectedPath),
          selectedNodeId: result.selectedNodeId,
          isCorrect: result.isCorrect,
          timeSpentMs: result.timeSpentMs,
          participantId,
        },
      });
    }
  } else if (type === "FIRST_CLICK") {
    // Delete existing results for this participant
    await prisma.clickResult.deleteMany({
      where: { participantId },
    });

    // Create new results
    for (const result of results) {
      await prisma.clickResult.create({
        data: {
          x: result.x,
          y: result.y,
          timeToClickMs: result.timeToClickMs,
          taskId: result.taskId || null,
          participantId,
        },
      });
    }
  }

  // Mark as completed
  await prisma.participant.update({
    where: { id: participantId },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

