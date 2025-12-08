import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryId } = await params;
  const body = await req.json();

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      order: body.order,
      name: body.name,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { categoryId } = await params;

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return NextResponse.json({ success: true });
}

