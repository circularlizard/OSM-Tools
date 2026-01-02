import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAuthConfig } from "@/lib/auth";
import { MemberDetailClient } from "./MemberDetailClient";

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const authOptions = await getAuthConfig();
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;
  if (!id) {
    notFound();
  }

  return <MemberDetailClient memberId={id} />;
}
