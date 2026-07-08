type CalendarDisplayEvent = {
  _id: string;
  title: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
  account?: string;
  location?: string;
  source?: string;
};

function isSynthesisTeamsEvent(event: CalendarDisplayEvent) {
  return event.title.toLowerCase().includes("synthesis teams");
}

function mergedSynthesisTitle(events: CalendarDisplayEvent[]) {
  const names = events
    .map((event) => event.title.match(/^(Anthony|Roma)\b/i)?.[1])
    .filter(Boolean);

  const uniqueNames = Array.from(new Set(names));
  if (uniqueNames.length >= 2) return "Anthony + Roma Synthesis Teams";
  return events[0]?.title ?? "Synthesis Teams";
}

export function mergeCalendarDisplayEvents<T extends CalendarDisplayEvent>(events: T[]): T[] {
  const merged: T[] = [];
  const synthesisGroups = new Map<string, T[]>();

  for (const event of events) {
    if (!isSynthesisTeamsEvent(event)) {
      merged.push(event);
      continue;
    }

    const key = [event.startMs, event.endMs, event.allDay].join(":");
    const group = synthesisGroups.get(key) ?? [];
    group.push(event);
    synthesisGroups.set(key, group);
  }

  for (const group of synthesisGroups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    merged.push({
      ...group[0],
      _id: group.map((event) => event._id).join("__"),
      title: mergedSynthesisTitle(group),
      location: group.map((event) => event.location).filter(Boolean).join(" / ") || undefined,
    });
  }

  return merged.sort((a, b) => a.startMs - b.startMs);
}

