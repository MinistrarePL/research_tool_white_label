import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      cards: { orderBy: { order: "asc" } },
      categories: true,
      treeNodes: { orderBy: { order: "asc" } },
      tasks: { orderBy: { order: "asc" } },
      participants: {
        include: {
          cardSortResults: true,
          treeTestResults: true,
          clickResults: true,
        },
      },
    },
  });

  if (!study) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(study);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const study = await prisma.study.update({
    where: { id, userId: session.user.id },
    data: body,
  });

  return NextResponse.json(study);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.study.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}

