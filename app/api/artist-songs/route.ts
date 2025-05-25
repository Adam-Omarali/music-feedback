import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId');

  if (!artistId) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, name, file_path')
      .eq('artist_id', artistId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch artist songs' }, { status: 500 });
    }

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching artist songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist songs' },
      { status: 500 }
    );
  }
} 