import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { id } = await context.params;

    // Fetch the feedback form
    const { data: form, error: formError } = await supabase
      .from("feedback_form")
      .select("*")
      .eq("id", id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "Feedback form not found" },
        { status: 404 }
      );
    }

    // Fetch the current pair of songs
    const currentPair = form.song_pairs[0];
    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .select("id, name, file_path, elo")
      .in("id", currentPair);

    if (songsError || !songs || songs.length !== 2) {
      return NextResponse.json(
        { error: "Failed to fetch songs" },
        { status: 500 }
      );
    }

    // Get signed URLs for both songs
    const [leftUrl, rightUrl] = await Promise.all([
      supabase.storage.from("songs").createSignedUrl(songs[0].file_path, 3600),
      supabase.storage.from("songs").createSignedUrl(songs[1].file_path, 3600),
    ]);

    if (leftUrl.error || rightUrl.error) {
      return NextResponse.json(
        { error: "Failed to generate signed URLs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      form,
      currentPair: {
        leftSong: { ...songs[0], signedUrl: leftUrl.data.signedUrl },
        rightSong: { ...songs[1], signedUrl: rightUrl.data.signedUrl },
      },
    });
  } catch (error) {
    console.error("Error in feedback form fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 