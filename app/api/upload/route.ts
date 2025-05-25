import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const songName = formData.get("songName") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!songName) {
      return NextResponse.json(
        { error: "Song name is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Generate a unique file name with the new structure
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    // Sanitize the song name to be URL-safe
    const sanitizedSongName = songName
      .toLowerCase()
      .replace(/([^a-z0-9])+/g, '-')
      .replace(/^(-)+|(-)+$/g, '');
    const fileName = `${user.id}/${sanitizedSongName}-${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('songs')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Insert song information into the songs table with the bucket path
    const { error: insertError } = await supabase
      .from('songs')
      .insert({
        artist_id: user.id,
        file_path: fileName, // Store the bucket path instead of public URL
        name: songName,
      });

    if (insertError) {
      console.error('Database error:', insertError);
      // If database insert fails, we should delete the uploaded file
      await supabase.storage
        .from('songs')
        .remove([fileName]);
      
      return NextResponse.json(
        { error: "Failed to save song information" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filePath: fileName
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 