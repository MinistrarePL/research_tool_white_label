import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId } = await params;
  const body = await req.json();

  const node = await prisma.treeNode.update({
    where: { id: nodeId },
    data: {
      label: body.label,
      parentId: body.parentId,
      order: body.order,
    },
  });

  return NextResponse.json(node);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId } = await params;

  await prisma.treeNode.delete({
    where: { id: nodeId },
  });

  return NextResponse.json({ success: true });
}

