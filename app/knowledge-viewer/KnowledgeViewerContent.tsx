"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

type KnowledgeViewerContentProps = {
  back: string;
  canShow: boolean;
  file?: string;
  previewImageSrc?: string;
  previewSrc?: string;
  title: string;
};

export function KnowledgeViewerContent({ back, canShow, file, previewImageSrc, previewSrc, title }: KnowledgeViewerContentProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  function goBack() {
    window.location.assign(back);
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    setOrientation(image.naturalWidth > image.naturalHeight ? "landscape" : "portrait");
  }

  async function sharePdfFile() {
    if (!file) return;

    setDownloadStatus(null);

    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error("Could not fetch file");

      const blob = await response.blob();
      const fileNameFromPath = decodeURIComponent(file.split("/").pop() || "");
      const fileName = fileNameFromPath.endsWith(".pdf")
        ? fileNameFromPath
        : title.toLowerCase().endsWith(".pdf")
          ? title
          : title.replace(/\s+/g, "-").toLowerCase();
      const pdfFile = new File([blob], fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`, {
        type: blob.type || "application/pdf",
      });

      if (navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({ files: [pdfFile], title });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = pdfFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      setDownloadStatus("Could not open the share sheet. Opening the PDF instead.");
      window.open(file, "_blank", "noopener,noreferrer");
    }
  }

  function handlePrint() {
    if (typeof navigator.canShare === "function") {
      void sharePdfFile();
      return;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }

  return (
    <main className={`min-h-dvh bg-zinc-950 text-zinc-100 ${orientation}`}>
      <style jsx global>{`
        @page {
          size: letter ${orientation};
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }

          .doc-toolbar {
            display: none !important;
          }

          .doc-viewer-wrap {
            padding: 0 !important;
          }

          .doc-preview-section {
            align-items: center !important;
            background: white !important;
            display: flex !important;
            height: 100vh !important;
            justify-content: center !important;
            min-height: 100vh !important;
            overflow: hidden !important;
            padding: 0 !important;
            width: 100vw !important;
          }

          .doc-preview-image {
            box-shadow: none !important;
            height: 100vh !important;
            max-height: none !important;
            max-width: none !important;
            object-fit: contain !important;
            width: 100vw !important;
          }

          .doc-preview-frame {
            height: 100vh !important;
          }
        }
      `}</style>

      <header className="doc-toolbar fixed inset-x-0 top-0 z-[100] flex min-h-[calc(88px+env(safe-area-inset-top))] flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] shadow-lg shadow-black/30">
        <div className="min-w-0">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-cyan-300 hover:bg-zinc-900 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mission Control
          </button>
          <h1 className="mt-1 truncate text-base font-semibold">{title}</h1>
        </div>
        {canShow && file && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={() => void sharePdfFile()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            {downloadStatus && <p className="basis-full text-right text-xs text-zinc-400">{downloadStatus}</p>}
          </div>
        )}
      </header>

      {canShow ? (
        <div className="doc-viewer-wrap pt-[calc(88px+env(safe-area-inset-top))]">
          {previewImageSrc ? (
            <section className="doc-preview-section flex min-h-[calc(100dvh-88px-env(safe-area-inset-top))] items-start justify-center overflow-auto bg-zinc-900 p-3">
              <img src={previewImageSrc} alt={title} onLoad={handleImageLoad} className="doc-preview-image max-w-full bg-white shadow-2xl" />
            </section>
          ) : (
            <iframe
              title={title}
              src={previewSrc}
              className="doc-preview-frame relative z-0 block h-[calc(100dvh-88px-env(safe-area-inset-top))] w-full border-0 bg-white"
            />
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-lg pt-40 text-center">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-300">This file link is not available.</p>
            <Link href="/dashboard?view=knowledge-files" className="mt-4 inline-flex text-sm text-cyan-300 hover:text-cyan-200">
              Return to Docs
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
