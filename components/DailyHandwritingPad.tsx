"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Eraser, Expand, Minimize2, Pencil, RotateCcw, Trash2, X } from "lucide-react";

type Tool = "pen" | "eraser";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  tool: Tool;
  width: number;
  referenceHeight: number;
  points: Point[];
};

type RawPoint = {
  x?: unknown;
  y?: unknown;
};

type RawStroke = {
  tool?: unknown;
  width?: unknown;
  referenceHeight?: unknown;
  points?: unknown;
};

const PAD_KIND = "time-blocks";
const DEFAULT_STROKES: Stroke[] = [];
const LEGACY_REFERENCE_HEIGHT = 440;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseStrokes(data?: string | null): Stroke[] {
  if (!data) return DEFAULT_STROKES;
  try {
    const parsed = JSON.parse(data) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_STROKES;

    return parsed
      .map((stroke) => {
        const candidate = stroke as RawStroke;
        if (!candidate || !Array.isArray(candidate.points)) return null;
        const tool: Tool = candidate.tool === "eraser" ? "eraser" : "pen";
        const width = typeof candidate.width === "number" ? clamp(candidate.width, 0.002, 0.03) : 0.006;
        const referenceHeight =
          typeof candidate.referenceHeight === "number" && candidate.referenceHeight > 0
            ? candidate.referenceHeight
            : LEGACY_REFERENCE_HEIGHT;
        const points = candidate.points
          .map((point) => {
            const rawPoint = point as RawPoint;
            if (typeof rawPoint.x !== "number" || typeof rawPoint.y !== "number") return null;
            return {
              x: clamp(rawPoint.x, 0, 1),
              y: clamp(rawPoint.y, 0, 1),
            };
          })
          .filter(Boolean) as Point[];

        if (points.length === 0) return null;
        return { tool, width, referenceHeight, points } as Stroke;
      })
      .filter(Boolean) as Stroke[];
  } catch {
    return DEFAULT_STROKES;
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number) {
  const renderHeight = Math.min(height, stroke.referenceHeight || LEGACY_REFERENCE_HEIGHT);
  const points = stroke.points.map((point) => ({
    x: point.x * width,
    y: point.y * renderHeight,
  }));

  if (points.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : "#111827";
  ctx.fillStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : "#111827";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, Math.min(width, height) * stroke.width);

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function SketchSurface({
  strokes,
  tool,
  strokeWidth,
  onAddStroke,
  className,
  style,
}: {
  strokes: Stroke[];
  tool: Tool;
  strokeWidth: number;
  onAddStroke: (stroke: Stroke) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);

  const redraw = useCallback(
    (nextStrokes: Stroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas || size.width === 0 || size.height === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawBackground(ctx, size.width, size.height);
      nextStrokes.forEach((stroke) => drawStroke(ctx, stroke, size.width, size.height));
    },
    [size.height, size.width]
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0 || size.height === 0) return;

    const ratio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    redraw(strokes);
  }, [redraw, size.height, size.width, strokes]);

  const getPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: clamp((clientX - rect.left) / rect.width, 0, 1),
        y: clamp((clientY - rect.top) / rect.height, 0, 1),
      };
    },
    []
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    isDrawingRef.current = true;
    currentStrokeRef.current = {
      tool,
      width: strokeWidth,
      referenceHeight: rect.height,
      points: [getPoint(event.clientX, event.clientY)],
    };
    redraw([...strokes, currentStrokeRef.current]);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    event.preventDefault();
    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, getPoint(event.clientX, event.clientY)],
    };
    redraw([...strokes, currentStrokeRef.current]);
  };

  const finishStroke = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const stroke = currentStrokeRef.current;
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    onAddStroke(stroke);
  };

  return (
    <div
      ref={wrapperRef}
      style={style}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-amber-200/70 bg-[#fffdf7] shadow-inner",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onPointerLeave={finishStroke}
        aria-label="Handwriting pad"
      />
    </div>
  );
}

export function DailyHandwritingPad({ userId, date }: { userId: Id<"users">; date: string }) {
  const note = useQuery(api.daily.getDailyCanvasNote, { userId, date, kind: PAD_KIND });
  const saveNote = useMutation(api.daily.saveDailyCanvasNote);
  const deleteNote = useMutation(api.daily.deleteDailyCanvasNote);

  const serverStrokes = useMemo(() => parseStrokes(note?.data), [note?.data]);
  const serverSerialized = useMemo(() => JSON.stringify(serverStrokes), [serverStrokes]);

  const [localStrokes, setLocalStrokes] = useState<Stroke[] | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [strokeWidth, setStrokeWidth] = useState<number>(0.006);
  const [expanded, setExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const lastSavedJsonRef = useRef<string | null>(null);

  const strokes = localStrokes ?? serverStrokes;
  const serializedStrokes = useMemo(() => JSON.stringify(strokes), [strokes]);

  if (note !== undefined && localStrokes === null && lastSavedJsonRef.current !== serverSerialized) {
    lastSavedJsonRef.current = serverSerialized;
  }

  useEffect(() => {
    if (note === undefined) return;
    if (serializedStrokes === lastSavedJsonRef.current) return;

    const timeoutId = window.setTimeout(async () => {
      setIsSaving(true);
      setSaveError(false);
      try {
        if (strokes.length === 0) {
          await deleteNote({ userId, date, kind: PAD_KIND });
          lastSavedJsonRef.current = "[]";
        } else {
          await saveNote({ userId, date, kind: PAD_KIND, data: serializedStrokes });
          lastSavedJsonRef.current = serializedStrokes;
        }
      } catch (error) {
        console.error("Failed to save handwriting pad", error);
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [date, deleteNote, note, saveNote, serializedStrokes, strokes.length, userId]);

  const addStroke = useCallback((stroke: Stroke) => {
    setLocalStrokes((current) => [...(current ?? serverStrokes), stroke]);
  }, [serverStrokes]);

  const handleUndo = () => {
    setLocalStrokes((current) => {
      const next = [...(current ?? serverStrokes)];
      next.pop();
      return next;
    });
  };

  const handleClear = () => {
    setLocalStrokes([]);
  };

  const saveLabel =
    note === undefined
      ? "Loading…"
      : isSaving
        ? "Saving…"
        : saveError
          ? "Save failed"
          : "Saved";

  const sizeOptions = [
    { label: "S", value: 0.0045 },
    { label: "M", value: 0.006 },
    { label: "L", value: 0.009 },
  ];

  const renderControls = (isExpanded = false) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={tool === "pen" ? "default" : "outline"}
        size="sm"
        className={cn(
          "border-slate-300 text-slate-900",
          tool === "pen" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white hover:bg-slate-100"
        )}
        onClick={() => setTool("pen")}
      >
        <Pencil className="mr-1 h-4 w-4" /> Pen
      </Button>
      <Button
        type="button"
        variant={tool === "eraser" ? "default" : "outline"}
        size="sm"
        className={cn(
          "border-slate-300 text-slate-900",
          tool === "eraser" ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white hover:bg-slate-100"
        )}
        onClick={() => setTool("eraser")}
      >
        <Eraser className="mr-1 h-4 w-4" /> Erase
      </Button>

      <div className="ml-1 flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
        {sizeOptions.map((option) => (
          <Button
            key={option.label}
            type="button"
            variant={strokeWidth === option.value ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-2 text-slate-900",
              strokeWidth === option.value ? "bg-slate-900 text-white hover:bg-slate-800" : "hover:bg-slate-100"
            )}
            onClick={() => setStrokeWidth(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          onClick={handleUndo}
          disabled={strokes.length === 0}
        >
          <RotateCcw className="mr-1 h-4 w-4" /> Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          onClick={handleClear}
          disabled={strokes.length === 0}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          onClick={() => setExpanded((current) => !current)}
        >
          {isExpanded ? <Minimize2 className="mr-1 h-4 w-4" /> : <Expand className="mr-1 h-4 w-4" />}
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-slate-950">Handwritten Notes</CardTitle>
            </div>
            <div className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-800">
              {saveLabel}
            </div>
          </div>
          {renderControls()}
        </CardHeader>
        <CardContent>
          <SketchSurface
            strokes={strokes}
            tool={tool}
            strokeWidth={strokeWidth}
            onAddStroke={addStroke}
            className="border-slate-300 bg-white"
            style={{ height: "1600px" }}
          />
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-6xl border-slate-200 bg-white p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle className="text-slate-950">Handwritten Notes</DialogTitle>
            <div className="pt-3 pr-12">{renderControls(true)}</div>
          </DialogHeader>
          <div className="p-6">
            <SketchSurface
              strokes={strokes}
              tool={tool}
              strokeWidth={strokeWidth}
              onAddStroke={addStroke}
              className="min-h-[420px] border-slate-300 bg-white"
              style={{ height: "72vh" }}
            />
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-md border border-slate-300 bg-white p-2 text-slate-700 opacity-100 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            <X className="h-5 w-5" />
            <span className="sr-only">Close expanded notes</span>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
