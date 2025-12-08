import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;
  const body = await req.json();

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      order: body.order,
      label: body.label,
      description: body.description,
    },
  });

  return NextResponse.json(card);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await params;

  await prisma.card.delete({
    where: { id: cardId },
  });

  return NextResponse.json({ success: true });
}

