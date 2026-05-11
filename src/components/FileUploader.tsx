"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, File } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import type { UploadedFile } from "@/lib/types";

interface FileUploaderProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
  "application/dxf": [".dxf"],
  "application/octet-stream": [".dxf", ".step", ".stp"],
};

function fileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-slate-500" />;
}

export function FileUploader({ files, onChange }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const toDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);
      if (files.length + accepted.length > 10) {
        setError("Maximum 10 files allowed.");
        return;
      }
      const tooBig = accepted.find((f) => f.size > 20 * 1024 * 1024);
      if (tooBig) {
        setError(`File "${tooBig.name}" exceeds 20 MB limit.`);
        return;
      }
      const converted = await Promise.all(
        accepted.map(async (f) => ({
          name: f.name,
          type: f.type || "application/octet-stream",
          size: f.size,
          dataUrl: await toDataUrl(f),
        }))
      );
      onChange([...files, ...converted]);
    },
    [files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "rounded-2xl p-3 transition-colors",
            isDragActive ? "bg-blue-100" : "bg-slate-100"
          )}>
            <Upload className={cn("h-6 w-6", isDragActive ? "text-blue-500" : "text-slate-400")} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? "Drop files here..." : "Drag & drop files, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PDF, DXF, STEP, JPG, PNG - up to 20 MB each, max 10 files
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {fileIcon(f.type)}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-slate-700 font-medium">{f.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(f.size)}</p>
              </div>
              <button onClick={() => remove(i)} className="text-slate-300 hover:text-red-400 transition-colors" type="button">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
