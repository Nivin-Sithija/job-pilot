"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { uploadResume } from "@/actions/profile";
import { ActionResultDialog } from "@/components/shared/ActionResultDialog";

type ResumeUploadProps = {
  initialFileName: string | null;
};

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export function ResumeUpload({ initialFileName }: ResumeUploadProps) {
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate(): Promise<void> {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/resume/generate", { method: "POST" });
      const result: { success: boolean; fileName?: string; error?: string } = await response.json();

      if (result.success) {
        setFileName(result.fileName ?? "resume.pdf");
        setActionResult({ type: "success", message: "Resume generated successfully." });
      } else {
        setActionResult({ type: "error", message: result.error ?? "Failed to generate resume." });
      }
    } catch {
      setActionResult({ type: "error", message: "Failed to generate resume." });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleFiles(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;

    setError(null);

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const result = await uploadResume(formData);
    setIsUploading(false);

    if (result.success) {
      setFileName(result.fileName ?? file.name);
    } else {
      setError(result.error ?? "Failed to upload resume.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Resume</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Upload an existing resume to auto-fill the profile, or generate a new tailored one from
        your details below.
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center ${
          isDragging ? "border-accent bg-accent-muted" : "border-border-muted"
        }`}
      >
        <Upload className="h-6 w-6 text-text-muted" />
        {!isUploading && fileName ? (
          <div className="flex items-center gap-2">
            <a
              href="/api/resume/view"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-accent hover:underline"
            >
              {fileName}
            </a>
            <span className="text-text-muted">·</span>
            <a
              href="/api/resume/download"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-text-secondary hover:underline"
            >
              Download
            </a>
          </div>
        ) : (
          <p className="text-sm font-medium text-text-primary">
            {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
          </p>
        )}
        <p className="text-xs text-text-muted">PDF formatting only. Maximum file size 5MB.</p>
        {error && <p className="text-xs text-error">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className="mt-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary disabled:opacity-60"
        >
          Select Resume
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Need a fresh document based on the fields below?
        </p>
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => void handleGenerate()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Generate Resume from Profile"}
        </button>
      </div>

      <ActionResultDialog
        open={actionResult !== null}
        type={actionResult?.type ?? "success"}
        message={actionResult?.message ?? ""}
        onClose={() => setActionResult(null)}
      />
    </div>
  );
}
