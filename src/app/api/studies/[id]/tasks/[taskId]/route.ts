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
  
  let body;
  try {
    const text = await req.text();
    console.log("Request body length:", text.length);
    body = JSON.parse(text);
    console.log("Parsed body keys:", Object.keys(body));
    if (body.imageUrl) {
      console.log("Image URL length:", body.imageUrl.length);
    }
  } catch (error: any) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: `Invalid request body: ${error.message}` },
      { status: 400 }
    );
  }

  // Build update data object with only provided fields
  const updateData: any = {};
  if (body.question !== undefined) updateData.question = body.question;
  if (body.correctNodeId !== undefined) updateData.correctNodeId = body.correctNodeId;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.displayTimeSeconds !== undefined) updateData.displayTimeSeconds = body.displayTimeSeconds;
  if (body.order !== undefined) updateData.order = body.order;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
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
