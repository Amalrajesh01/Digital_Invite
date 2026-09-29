import { redirect } from "next/navigation";

/** The editor lives outside the studio shell so the preview gets the whole screen. */
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/editor/${id}`);
}
