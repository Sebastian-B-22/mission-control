"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TreeNode = {
  name: string;
  path: string;
  isFile: boolean;
  children?: TreeNode[];
};

function buildTree(paths: Array<{ path: string }>): TreeNode[] {
  const root: Record<string, any> = {};

  for (const p of paths) {
    const parts = p.path.split("/").filter(Boolean);
    let cur = root;
    let accum = "";

    parts.forEach((part, idx) => {
      accum += (accum ? "/" : "") + part;
      if (!cur[part]) {
        cur[part] = {
          name: part,
          path: accum,
          isFile: idx === parts.length - 1,
          children: {},
        };
      }
      if (idx === parts.length - 1) {
        cur[part].isFile = true;
      }
      cur = cur[part].children;
    });
  }

  function toArray(obj: Record<string, any>): TreeNode[] {
    return Object.values(obj)
      .map((n: any) => ({
        name: n.name,
        path: n.path,
        isFile: n.isFile,
        children: n.children ? toArray(n.children) : undefined,
      }))
      .sort((a, b) => {
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
        return a.name.localeCompare(b.name);
      });
  }

  return toArray(root);
}

function Node(props: {
  node: TreeNode;
  depth: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  filter: string;
}) {
  const [open, setOpen] = useState(props.depth < 1);

  const matchesFilter = !props.filter || props.node.path.toLowerCase().includes(props.filter);

  const hasVisibleChildren = (props.node.children || []).some((c) =>
    c.path.toLowerCase().includes(props.filter) ||
    (c.children || []).some((gc) => gc.path.toLowerCase().includes(props.filter))
  );

  if (!matchesFilter && !hasVisibleChildren) return null;

  return (
    <div>
      <button
        className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 hover:bg-zinc-900 ${
          props.selectedPath === props.node.path ? "bg-zinc-900 text-amber-300" : "text-zinc-300"
        }`}
        style={{ paddingLeft: 8 + props.depth * 12 }}
        onClick={() => {
          if (props.node.isFile) {
            props.onSelect(props.node.path);
          } else {
            setOpen((v) => !v);
          }
        }}
      >
        <span className="text-zinc-500">{props.node.isFile ? "•" : open ? "▾" : "▸"}</span>
        <span className="truncate">{props.node.name}</span>
      </button>

      {!props.node.isFile && open && props.node.children && (
        <div>
          {props.node.children.map((c) => (
            <Node
              key={c.path}
              node={c}
              depth={props.depth + 1}
              onSelect={props.onSelect}
              selectedPath={props.selectedPath}
              filter={props.filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemoryPanelView(props: { userId: Id<"users"> }) {
  const paths = useQuery(api.memorySnapshots.listAllPaths, { userId: props.userId, limit: 2000 });

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const selected = useQuery(
    api.memorySnapshots.getFile,
    selectedPath ? { userId: props.userId, path: selectedPath } : "skip"
  );

  const [filter, setFilter] = useState("");

  const tree = useMemo(() => (paths ? buildTree(paths) : []), [paths]);

  const filterLower = filter.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Memory Panel</h1>
        <p className="text-sm text-zinc-400">
          Read-only snapshots synced from the workspace memory folder (Vercel-safe).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Filter paths…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {!paths ? (
              <p className="text-xs text-zinc-500">Loading…</p>
            ) : paths.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No snapshots yet. Ingest via <code className="px-1 rounded bg-zinc-900">/memory/snapshots/ingest</code>.
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-auto pr-1">
                {tree.map((n) => (
                  <Node
                    key={n.path}
                    node={n}
                    depth={0}
                    onSelect={setSelectedPath}
                    selectedPath={selectedPath}
                    filter={filterLower}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPath ? (
              <p className="text-xs text-zinc-500">Select a file to preview.</p>
            ) : selected === undefined ? (
              <p className="text-xs text-zinc-500">Loading…</p>
            ) : selected === null ? (
              <p className="text-xs text-zinc-500">File not found.</p>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-2">{selected.path}</p>
                <pre className="text-xs whitespace-pre-wrap break-words bg-black/40 border border-zinc-800 rounded-lg p-3 max-h-[60vh] overflow-auto">
                  {selected.content}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
