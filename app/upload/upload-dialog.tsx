"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function UploadDialog() {
  const [file, setFile] = useState<File | null>(null);
  const [songName, setSongName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setUploadSuccess(false);

    if (selectedFile && selectedFile.type.startsWith("audio/")) {
      setFile(selectedFile);
    } else {
      setError("Please select an audio file");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!songName.trim()) {
      setError("Please enter a song name");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("songName", songName.trim());

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setUploadSuccess(true);
      setFile(null);
      setSongName("");
      // Reset the file input
      const fileInput = document.getElementById(
        "audio-file"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error uploading file. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-lg shadow-sm border">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="song-name">Song Name</Label>
          <Input
            id="song-name"
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Enter song name"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio-file">Audio File</Label>
          <Input
            id="audio-file"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: MP3, WAV, OGG (Max size: 50MB)
          </p>
        </div>

        {file && (
          <div className="text-sm">
            <p>Selected file: {file.name}</p>
            <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}

        {uploadSuccess && (
          <div className="text-sm text-green-600">
            File uploaded successfully!
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || !songName.trim() || isUploading}
          className="w-full"
        >
          {isUploading ? "Uploading..." : "Upload Song"}
        </Button>
      </div>
    </div>
  );
}
