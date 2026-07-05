"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, Check } from "lucide-react";

interface MemoryContentModalProps {
  filePath: string;
  onClose: () => void;
}

/** Simple markdown renderer using HTML (no external library needed) */
function renderMarkdown(content: string): string {
  // Escape HTML
  const escape = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const lines = content.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        if (inList) { html.push("</ul>"); inList = false; }
        const lang = line.slice(3).trim();
        html.push(`<pre class="code-block"><code class="lang-${escape(lang)}">`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escape(line));
      continue;
    }

    // Close list if needed
    if (inList && !line.startsWith("- ") && !line.startsWith("* ") && !line.match(/^\d+\./)) {
      html.push("</ul>");
      inList = false;
    }

    // Headings
    if (line.startsWith("# ")) {
      html.push(`<h1 class="md-h1">${inlineMarkdown(escape(line.slice(2)))}</h1>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2 class="md-h2">${inlineMarkdown(escape(line.slice(3)))}</h2>`);
    } else if (line.startsWith("### ")) {
      html.push(`<h3 class="md-h3">${inlineMarkdown(escape(line.slice(4)))}</h3>`);
    } else if (line.startsWith("#### ")) {
      html.push(`<h4 class="md-h4">${inlineMarkdown(escape(line.slice(5)))}</h4>`);
    }
    // Horizontal rule
    else if (line.match(/^[-*_]{3,}$/)) {
      html.push('<hr class="md-hr" />');
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      html.push(`<blockquote class="md-blockquote">${inlineMarkdown(escape(line.slice(2)))}</blockquote>`);
    }
    // Unordered list
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { html.push('<ul class="md-ul">'); inList = true; }
      html.push(`<li class="md-li">${inlineMarkdown(escape(line.slice(2)))}</li>`);
    }
    // Ordered list
    else if (line.match(/^\d+\.\s/)) {
      if (!inList) { html.push('<ul class="md-ul">'); inList = true; }
      html.push(`<li class="md-li">${inlineMarkdown(escape(line.replace(/^\d+\.\s/, "")))}</li>`);
    }
    // Empty line
    else if (line.trim() === "") {
      html.push('<br />');
    }
    // Paragraph
    else {
      html.push(`<p class="md-p">${inlineMarkdown(escape(line))}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  if (inCodeBlock) html.push("</code></pre>");

  return html.join("\n");
}

function inlineMarkdown(text: string): string {
  return text
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Inline code
    .replace(/`(.+?)`/g, '<code class="md-inline-code">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>');
}

/** Breadcrumb from file path */
function PathBreadcrumb({ filePath }: { filePath: string }) {
  const parts = filePath.split("/").filter(Boolean);
  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
      <span className="text-gray-300">workspace</span>
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="text-gray-300">/</span>
          <span className={i === parts.length - 1 ? "text-gray-600 font-medium" : "text-gray-400"}>
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}

export function MemoryContentModal({ filePath, onClose }: MemoryContentModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [modifiedDate, setModifiedDate] = useState<string>("");

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/memory/content?path=${encodeURIComponent(filePath)}`);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to load content");
        }
        const data = await response.json();
        setContent(data.content || "");
        if (data.modified) {
          setModifiedDate(new Date(data.modified).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filePath]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const filename = filePath.split("/").pop() || filePath;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div className="flex-1 min-w-0 mr-4">
              {/* Filename */}
              <h2 className="text-base font-semibold text-gray-900 mb-1 truncate">{filename}</h2>
              {/* Breadcrumb */}
              <PathBreadcrumb filePath={filePath} />
              {modifiedDate && (
                <p className="text-xs text-gray-400 mt-1">Modified {modifiedDate}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Copy button */}
              {content && (
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    copied
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                  }`}
                  title="Copy raw markdown"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              )}

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-sm text-red-600 font-medium">{error}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Make sure the Memory API server is running on the Mac mini.
                </p>
              </div>
            ) : (
              <div
                className="memory-markdown"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <span className="text-xs text-gray-400 truncate max-w-xs" title={filePath}>
              {filePath}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Markdown styles */}
      <style>{`
        .memory-markdown { line-height: 1.7; color: #374151; font-size: 0.9rem; }
        .memory-markdown .md-h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0.5rem 0 1rem; border-bottom: 2px solid #f59e0b; padding-bottom: 0.5rem; }
        .memory-markdown .md-h2 { font-size: 1.2rem; font-weight: 600; color: #1f2937; margin: 1.5rem 0 0.75rem; }
        .memory-markdown .md-h3 { font-size: 1rem; font-weight: 600; color: #374151; margin: 1.25rem 0 0.5rem; }
        .memory-markdown .md-h4 { font-size: 0.9rem; font-weight: 600; color: #4b5563; margin: 1rem 0 0.4rem; }
        .memory-markdown .md-p { margin-bottom: 0.75rem; }
        .memory-markdown .md-ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .memory-markdown .md-li { margin-bottom: 0.25rem; }
        .memory-markdown .md-hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
        .memory-markdown .md-blockquote { border-left: 3px solid #f59e0b; padding-left: 1rem; color: #6b7280; font-style: italic; margin: 1rem 0; }
        .memory-markdown .code-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin: 0.75rem 0; font-size: 0.8rem; font-family: 'Menlo', 'Consolas', monospace; white-space: pre; }
        .memory-markdown .md-inline-code { background: #fef3c7; color: #92400e; padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-size: 0.8rem; font-family: 'Menlo', 'Consolas', monospace; }
        .memory-markdown .md-link { color: #d97706; text-decoration: underline; text-underline-offset: 2px; }
        .memory-markdown .md-link:hover { color: #b45309; }
        .memory-markdown strong { font-weight: 600; color: #1f2937; }
        .memory-markdown em { font-style: italic; }
      `}</style>
    </>
  );
}
