import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      question: body.question,
      correctNodeId: body.correctNodeId,
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  await prisma.task.delete({
    where: { id: taskId },
  });

  return NextResponse.json({ success: true });
}
