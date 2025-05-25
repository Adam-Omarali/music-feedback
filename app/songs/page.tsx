"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Pause } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Song {
  id: string;
  name: string;
  file_path: string;
  signedUrl?: string;
  elo?: number;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSongs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in to view your songs");
        return;
      }

      const response = await fetch(`/api/artist-songs?artistId=${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }

      const songsData = await response.json();

      // Get signed URLs for each song
      const songsWithUrls = await Promise.all(
        songsData.map(async (song: Song) => {
          const { data: signedUrlData } = await supabase.storage
            .from("songs")
            .createSignedUrl(song.file_path, 3600);

          return {
            ...song,
            signedUrl: signedUrlData?.signedUrl,
          };
        })
      );

      setSongs(songsWithUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (songId: string, filePath: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      // Remove the song from the local state
      setSongs(songs.filter((song) => song.id !== songId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete song");
    }
  };

  const togglePlay = (songId: string) => {
    setPlayingId(playingId === songId ? null : songId);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Your Songs</h1>
      {songs.length === 0 ? (
        <div className="text-center text-gray-500">
          No songs uploaded yet.{" "}
          <a href="/upload" className="text-blue-500 hover:underline">
            Upload your first song
          </a>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Play</TableHead>
                <TableHead>ELO Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell className="font-medium">{song.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePlay(song.id)}
                      >
                        {playingId === song.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      {playingId === song.id && (
                        <audio
                          src={song.signedUrl}
                          autoPlay
                          onEnded={() => setPlayingId(null)}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{song.elo || 1500}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(song.id, song.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
