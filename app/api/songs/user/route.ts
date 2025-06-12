import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Fetch user's songs
    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .select("id, name, file_path")
      .eq("artist_id", user.id);

    if (songsError) {
      return NextResponse.json(
        { error: "Failed to fetch songs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ songs: songs || [] });
  } catch (error) {
    console.error("Error fetching user songs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 