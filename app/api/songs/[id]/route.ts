import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { id } = await params;
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the song information first to verify ownership and get the file path
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (songError || !song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    // Verify that the user owns this song
    if (song.artist_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this song" },
        { status: 403 }
      );
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('songs')
      .remove([song.file_path]);

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }

    // Delete the song record from the database
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: "Failed to delete song record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Song deleted successfully"
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 