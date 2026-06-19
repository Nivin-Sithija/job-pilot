"use client";

import { useState } from "react";

type TagInputProps = {
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ placeholder, tags, onChange }: TagInputProps) {
  const [value, setValue] = useState("");

  function addTag() {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onChange([...tags, trimmed]);
    setValue("");
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="flex items-center gap-1.5 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                aria-label={`Remove ${tag}`}
                className="text-accent hover:opacity-70"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
