import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => (
    <div>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 shadow-sm placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          className
        )}
        {...props}
      />
    </div>
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
