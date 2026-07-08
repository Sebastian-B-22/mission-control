"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";

type KnowledgePrintContentProps = {
  back: string;
  canShow: boolean;
  file?: string;
  imageSrc?: string;
  title: string;
};

export function KnowledgePrintContent({ back, canShow, file, imageSrc, title }: KnowledgePrintContentProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [readyToPrint, setReadyToPrint] = useState(false);

  useEffect(() => {
    if (!readyToPrint) return;
    const timer = window.setTimeout(() => window.print(), 100);
    return () => window.clearTimeout(timer);
  }, [readyToPrint, orientation]);

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    setOrientation(image.naturalWidth > image.naturalHeight ? "landscape" : "portrait");
    setReadyToPrint(true);
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
          }

          .print-toolbar {
            display: none !important;
          }

          .print-sheet {
            width: 100vw !important;
            height: 100vh !important;
            padding: 0 !important;
            background: white !important;
          }

          .print-image {
            width: 100vw !important;
            height: 100vh !important;
            object-fit: contain !important;
          }
        }
      `}</style>

      <header className="print-toolbar fixed inset-x-0 top-0 z-50 flex min-h-[calc(84px+env(safe-area-inset-top))] flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 pb-3 pt-[calc(12px+env(safe-area-inset-top))] shadow-lg shadow-black/30">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => window.location.assign(back)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-cyan-300 hover:bg-zinc-900 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mission Control
          </button>
          <h1 className="mt-1 truncate text-base font-semibold">{title}</h1>
        </div>
        {canShow && file && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <a
              href={file}
              download
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        )}
      </header>

      {canShow && imageSrc ? (
        <section className="print-sheet flex min-h-dvh items-center justify-center bg-zinc-900 px-3 pb-3 pt-[calc(96px+env(safe-area-inset-top))]">
          <img
            src={imageSrc}
            alt={title}
            onLoad={handleImageLoad}
            className="print-image max-h-[calc(100dvh-112px-env(safe-area-inset-top))] max-w-full bg-white object-contain shadow-2xl"
          />
        </section>
      ) : (
        <div className="mx-auto max-w-lg pt-40 text-center">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-300">This print file is not available.</p>
          </div>
        </div>
      )}
    </main>
  );
}
