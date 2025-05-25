import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UploadDialog } from "./upload-dialog";

export default async function UploadSongPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Song</h1>
      <UploadDialog />
    </div>
  );
}
