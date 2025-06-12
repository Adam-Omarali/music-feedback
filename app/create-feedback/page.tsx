"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface Song {
  id: string;
  name: string;
  file_path: string;
}

export default function CreateFeedbackPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedPairs, setSelectedPairs] = useState<[string, string][]>([]);
  const [formName, setFormName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch("/api/songs/user");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch songs");
      }

      const data = await response.json();
      setSongs(data.songs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  };

  const handlePairSelection = (song1Id: string, song2Id: string) => {
    const pair: [string, string] = [song1Id, song2Id].sort() as [
      string,
      string,
    ];
    const pairExists = selectedPairs.some(
      ([s1, s2]) => s1 === pair[0] && s2 === pair[1]
    );

    if (pairExists) {
      setSelectedPairs(
        selectedPairs.filter(([s1, s2]) => !(s1 === pair[0] && s2 === pair[1]))
      );
    } else {
      setSelectedPairs([...selectedPairs, pair]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Please enter a form name");
      return;
    }
    if (selectedPairs.length === 0) {
      setError("Please select at least one pair of songs");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName,
          song_pairs: selectedPairs,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create feedback form");
      }

      // Reset form
      setFormName("");
      setSelectedPairs([]);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create feedback form"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create Feedback Form</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="formName">Form Name</Label>
          <Input
            id="formName"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter a name for this feedback form"
            required
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Song Pairs</h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Song 1</TableHead>
                  <TableHead>Song 2</TableHead>
                  <TableHead className="w-[100px]">Select</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songs.map((song1, i) =>
                  songs.slice(i + 1).map((song2) => (
                    <TableRow key={`${song1.id}-${song2.id}`}>
                      <TableCell>{song1.name}</TableCell>
                      <TableCell>{song2.name}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedPairs.some(
                            ([s1, s2]) =>
                              (s1 === song1.id && s2 === song2.id) ||
                              (s1 === song2.id && s2 === song1.id)
                          )}
                          onCheckedChange={() =>
                            handlePairSelection(song1.id, song2.id)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Feedback Form"}
        </Button>
      </form>
    </div>
  );
}
