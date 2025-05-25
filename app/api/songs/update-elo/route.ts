import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// K-factor determines how much a rating changes after a match
const K_FACTOR = 32;

// Calculate new ELO ratings
function calculateNewRatings(winnerRating: number, loserRating: number) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const newWinnerRating = winnerRating + K_FACTOR * (1 - expectedWinner);
  const newLoserRating = loserRating + K_FACTOR * (0 - expectedLoser);

  return {
    newWinnerRating: Math.round(newWinnerRating),
    newLoserRating: Math.round(newLoserRating),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { winnerId, loserId } = await request.json();

    // Get current ratings
    const { data: songs, error: fetchError } = await supabase
      .from('songs')
      .select('id, elo')
      .in('id', [winnerId, loserId]);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
    }

    if (!songs || songs.length !== 2) {
      return NextResponse.json({ error: 'Songs not found' }, { status: 404 });
    }

    const winner = songs.find(song => song.id === winnerId);
    const loser = songs.find(song => song.id === loserId);

    if (!winner || !loser) {
      return NextResponse.json({ error: 'Invalid song IDs' }, { status: 400 });
    }

    // Calculate new ratings
    const { newWinnerRating, newLoserRating } = calculateNewRatings(
      winner.elo || 1500,
      loser.elo || 1500
    );

    // Update ratings in database
    const { error: updateError } = await supabase
      .from('songs')
      .upsert([
        { id: winnerId, elo: newWinnerRating },
        { id: loserId, elo: newLoserRating }
      ]);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update ratings' }, { status: 500 });
    }

    return NextResponse.json({
      winner: { id: winnerId, newRating: newWinnerRating },
      loser: { id: loserId, newRating: newLoserRating }
    });
  } catch (error) {
    console.error('Error updating ELO ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 