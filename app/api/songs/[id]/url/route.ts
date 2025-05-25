import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
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

    

    // Get the song information
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    console.log(song);

    if (songError || !song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    console.log(song.file_path);

    const { data: rootFiles, error: rootFilesError } = await supabase
    .storage
    .from('songs')
    .list('');

    console.log('ROOT FILES:', rootFiles);

    const { data, error } = await supabase
    .storage
    .from('songs')
    .list('4e09bce0-c38a-48d6-8efa-e9f40c00d221');

    console.log('FILES:', data);
    console.log('ERROR:', error);

    // Generate a signed URL that expires in 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('songs')
      .createSignedUrl("4e09bce0-c38a-48d6-8efa-e9f40c00d221/fall-out-1748190853086.m4a", 3600); // 3600 seconds = 1 hour

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 