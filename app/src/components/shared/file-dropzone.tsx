"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FileDropzoneFile {
  name: string;
  url?: string;
}

export interface FileDropzoneProps {
  /** Called when one or more files are picked (drag OR click). Caller handles upload. */
  onFiles: (files: File[]) => void | Promise<void>;
  /** HTML accept attribute, e.g. ".pdf,image/*" */
  accept?: string;
  /** Allow multiple file selection / drop. Default false. */
  multiple?: boolean;
  disabled?: boolean;
  /** Max size per file in bytes. Files over this are rejected and onOversize is called. */
  maxSizeBytes?: number;
  /** Called for each oversize file. Default: no-op. Caller typically shows a toast. */
  onOversize?: (file: File) => void;
  /** Called if a rejected file fails the accept filter. */
  onReject?: (file: File, reason: "type" | "size") => void;
  /** Primary CTA text. */
  label?: string;
  /** Helper text below the CTA. */
  helperText?: string;
  /** "default" = large dropzone card; "compact" = inline narrow strip. */
  variant?: "default" | "compact";
  className?: string;
  /** Show an uploading spinner over the dropzone. */
  isUploading?: boolean;
  /** Files already uploaded — rendered as removable chips below the dropzone. */
  currentFiles?: FileDropzoneFile[];
  /** Called when user clicks the × on a current file chip. */
  onRemove?: (index: number) => void;
  /** Optional custom icon replacing the default Paperclip. */
  icon?: React.ReactNode;
}

export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  maxSizeBytes,
  onOversize,
  onReject,
  label = "Arrastra un archivo o haz click para subir",
  helperText,
  variant = "default",
  className,
  isUploading = false,
  currentFiles,
  onRemove,
  icon,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const matchesAccept = useCallback(
    (file: File) => {
      if (!accept) return true;
      const patterns = accept.split(",").map((s) => s.trim()).filter(Boolean);
      return patterns.some((p) => {
        if (p.startsWith(".")) return file.name.toLowerCase().endsWith(p.toLowerCase());
        if (p.endsWith("/*")) {
          const prefix = p.slice(0, p.length - 1); // "image/"
          return file.type.startsWith(prefix);
        }
        return file.type === p;
      });
    },
    [accept],
  );

  const validate = useCallback(
    (files: File[]): File[] => {
      const ok: File[] = [];
      for (const f of files) {
        if (!matchesAccept(f)) {
          onReject?.(f, "type");
          continue;
        }
        if (maxSizeBytes != null && f.size > maxSizeBytes) {
          onOversize?.(f);
          onReject?.(f, "size");
          continue;
        }
        ok.push(f);
      }
      return ok;
    },
    [matchesAccept, maxSizeBytes, onOversize, onReject],
  );

  const handleFiles = useCallback(
    async (raw: FileList | File[] | null) => {
      if (!raw || disabled) return;
      const arr = Array.from(raw);
      if (!arr.length) return;
      const picked = multiple ? arr : arr.slice(0, 1);
      const valid = validate(picked);
      if (valid.length) {
        await onFiles(valid);
      }
    },
    [disabled, multiple, onFiles, validate],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const openPicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  const compactLayout = variant === "compact";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openPicker}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            openPicker();
          }
        }}
        aria-disabled={disabled}
        aria-label={label}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-colors",
          compactLayout ? "gap-2 px-3 py-2" : "flex-col gap-1 px-4 py-6",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/20",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
          "hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled || isUploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            // Reset so selecting the same file twice re-triggers
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        {icon ?? (
          compactLayout ? (
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )
        )}
        <div className={cn(compactLayout ? "flex-1 text-left" : "text-center")}>
          <p className={cn("text-sm font-medium", compactLayout && "text-xs")}>
            {isUploading ? "Subiendo..." : label}
          </p>
          {helperText && !isUploading && (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          )}
        </div>
      </div>

      {currentFiles && currentFiles.length > 0 && (
        <ul className="flex flex-col gap-1">
          {currentFiles.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded border bg-muted/40 px-2 py-1 text-xs"
            >
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-blue-600 hover:underline"
                >
                  {f.name}
                </a>
              ) : (
                <span className="flex-1 truncate">{f.name}</span>
              )}
              {onRemove && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
