import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const maxOrder = await prisma.treeNode.aggregate({
    where: { studyId: id, parentId: body.parentId || null },
    _max: { order: true },
  });

  const node = await prisma.treeNode.create({
    data: {
      label: body.label,
      parentId: body.parentId || null,
      order: (maxOrder._max.order ?? -1) + 1,
      studyId: id,
    },
  });

  return NextResponse.json(node);
}

