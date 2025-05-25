import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get all songs for the artist
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, name, file_path, elo')
      .eq('artist_id', artistId);

    if (songsError) {
      console.error('Error fetching songs:', songsError);
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
    }

    if (!songs || songs.length < 2) {
      return NextResponse.json({ error: 'Not enough songs to compare' }, { status: 400 });
    }

    // Sort songs by ELO rating
    const sortedSongs = [...songs].sort((a, b) => (b.elo || 1500) - (a.elo || 1500));

    // Select two songs that are close in rating
    // We'll pick songs that are within 200 ELO points of each other
    let leftSong = null;
    let rightSong = null;

    for (let i = 0; i < sortedSongs.length - 1; i++) {
      const currentElo = sortedSongs[i].elo || 1500;
      const nextElo = sortedSongs[i + 1].elo || 1500;
      
      if (Math.abs(currentElo - nextElo) <= 200) {
        leftSong = sortedSongs[i];
        rightSong = sortedSongs[i + 1];
        break;
      }
    }

    // If no close matches found, pick random songs
    if (!leftSong || !rightSong) {
      const randomIndex1 = Math.floor(Math.random() * sortedSongs.length);
      let randomIndex2;
      do {
        randomIndex2 = Math.floor(Math.random() * sortedSongs.length);
      } while (randomIndex2 === randomIndex1);

      leftSong = sortedSongs[randomIndex1];
      rightSong = sortedSongs[randomIndex2];
    }

    // Generate signed URLs for both songs
    const [leftUrlData, rightUrlData] = await Promise.all([
      supabase.storage
        .from('songs')
        .createSignedUrl(leftSong.file_path, 3600),
      supabase.storage
        .from('songs')
        .createSignedUrl(rightSong.file_path, 3600)
    ]);

    if (leftUrlData.error || rightUrlData.error) {
      console.error('Error generating signed URLs:', leftUrlData.error || rightUrlData.error);
      return NextResponse.json({ error: 'Failed to generate signed URLs' }, { status: 500 });
    }

    return NextResponse.json({
      leftSong: {
        ...leftSong,
        signedUrl: leftUrlData.data.signedUrl
      },
      rightSong: {
        ...rightSong,
        signedUrl: rightUrlData.data.signedUrl
      }
    });

  } catch (error) {
    console.error('Error in compare route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 