import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, song_pairs } = await request.json();

    if (!name || !song_pairs || !Array.isArray(song_pairs)) {
      return NextResponse.json(
        { error: "Name and song_pairs are required" },
        { status: 400 }
      );
    }

    // Validate song pairs
    for (const pair of song_pairs) {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || typeof pair[1] !== 'string') {
        return NextResponse.json(
          { error: "Invalid song pair format" },
          { status: 400 }
        );
      }

      // Verify that both songs exist and belong to the user
      const { data: songs, error: songsError } = await supabase
        .from("songs")
        .select("id")
        .in("id", pair)
        .eq("artist_id", user.id);

      if (songsError || !songs || songs.length !== 2) {
        return NextResponse.json(
          { error: "Invalid song pair: songs must exist and belong to you" },
          { status: 400 }
        );
      }
    }

    // Create the feedback form
    const { data, error } = await supabase
      .from("feedback_form")
      .insert({
        name,
        song_pairs,
        artist_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating feedback form:", error);
      return NextResponse.json(
        { error: "Failed to create feedback form" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in feedback form creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 