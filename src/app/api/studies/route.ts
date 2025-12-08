import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studies = await prisma.study.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { participants: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(studies);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, type } = body;

  const study = await prisma.study.create({
    data: {
      title,
      description,
      type,
      userId: session.user.id,
    },
  });

  return NextResponse.json(study);
}

