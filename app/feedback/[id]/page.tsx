"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AudioPlayer } from "@/components/AudioPlayer";

interface Song {
  id: string;
  name: string;
  file_path: string;
  signedUrl?: string;
  elo?: number;
}

interface FeedbackForm {
  id: string;
  name: string;
  song_pairs: [string, string][];
}

export default function FeedbackFormPage() {
  const params = useParams();
  const formId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftSong, setLeftSong] = useState<Song | null>(null);
  const [rightSong, setRightSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null);
  const [hasCompared, setHasCompared] = useState(false);

  useEffect(() => {
    fetchFeedbackForm();
  }, [formId]);

  const fetchFeedbackForm = async () => {
    try {
      const response = await fetch(`/api/feedback/${formId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch feedback form");
      }

      const data = await response.json();
      setFeedbackForm(data.form);
      setLeftSong(data.currentPair.leftSong);
      setRightSong(data.currentPair.rightSong);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load feedback form"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchNextPair = async () => {
    try {
      const response = await fetch(
        `/api/feedback/${formId}/next-pair?index=${currentPairIndex + 1}`
      );
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404) {
          setHasCompared(true);
          return;
        }
        throw new Error(data.error || "Failed to fetch next pair");
      }

      const data = await response.json();
      setLeftSong(data.leftSong);
      setRightSong(data.rightSong);
      setCurrentPairIndex((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load next pair");
    }
  };

  const handlePick = async (winner: "left" | "right") => {
    if (!leftSong || !rightSong || !feedbackForm) return;

    setIsLoading(true);
    try {
      const winnerId = winner === "left" ? leftSong.id : rightSong.id;
      const loserId = winner === "left" ? rightSong.id : leftSong.id;

      // Store the comparison
      const response = await fetch("/api/songs/update-elo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          winnerId,
          loserId,
          feedback_form: formId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update ratings");
      }

      const { winner: updatedWinner, loser: updatedLoser } =
        await response.json();

      // Update local state with new ratings
      if (leftSong.id === updatedWinner.id) {
        setLeftSong({ ...leftSong, elo: updatedWinner.newRating });
        setRightSong({ ...rightSong, elo: updatedLoser.newRating });
      } else {
        setLeftSong({ ...leftSong, elo: updatedLoser.newRating });
        setRightSong({ ...rightSong, elo: updatedWinner.newRating });
      }

      // Move to the next pair
      await fetchNextPair();
    } catch (error) {
      console.error("Error updating ratings:", error);
    } finally {
      setIsLoading(false);
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

  if (hasCompared) {
    return (
      <div className="flex justify-center items-center h-screen">
        Thank you for your feedback!
      </div>
    );
  }

  if (!leftSong || !rightSong) {
    return (
      <div className="flex justify-center items-center h-screen">
        No more pairs to compare!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full bg-white">
      <div className="flex flex-row gap-8 w-full max-w-7xl justify-center items-center">
        {/* Left Song */}
        <button
          onClick={() => handlePick("left")}
          className="flex-1 max-w-xl cursor-pointer rounded-2xl p-8 flex flex-col items-center transition-colors duration-200 bg-white hover:bg-gray-50"
        >
          <AudioPlayer url={leftSong.signedUrl || ""} title={leftSong.name} />
        </button>
        {/* VS Divider */}
        <div className="text-3xl font-bold text-blue-300 select-none">vs</div>
        {/* Right Song */}
        <button
          onClick={() => handlePick("right")}
          className="flex-1 max-w-xl cursor-pointer rounded-2xl p-8 flex flex-col items-center transition-colors duration-200 bg-white hover:bg-gray-50"
        >
          <AudioPlayer url={rightSong.signedUrl || ""} title={rightSong.name} />
        </button>
      </div>
    </div>
  );
}
