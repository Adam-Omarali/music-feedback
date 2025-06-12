import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { id } = await context.params;

    // Get the current pair index from the query parameter
    const { searchParams } = new URL(request.url);
    const currentIndex = parseInt(searchParams.get("index") || "0");

    // Fetch the feedback form
    const { data: form, error: formError } = await supabase
      .from("feedback_form")
      .select("song_pairs")
      .eq("id", id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "Feedback form not found" },
        { status: 404 }
      );
    }

    // Check if we've reached the end of the pairs
    if (currentIndex >= form.song_pairs.length) {
      return NextResponse.json(
        { error: "No more pairs available" },
        { status: 404 }
      );
    }

    // Fetch the next pair of songs
    const nextPair = form.song_pairs[currentIndex];
    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .select("id, name, file_path, elo")
      .in("id", nextPair);

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
      leftSong: { ...songs[0], signedUrl: leftUrl.data.signedUrl },
      rightSong: { ...songs[1], signedUrl: rightUrl.data.signedUrl },
    });
  } catch (error) {
    console.error("Error in next pair fetch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 