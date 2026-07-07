import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WorldCupPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const target = new URLSearchParams({ v: "202606090905" });

  for (const [key, value] of Object.entries(params || {})) {
    if (key === "v") continue;
    if (Array.isArray(value)) {
      for (const item of value) target.append(key, item);
    } else if (value != null) {
      target.set(key, value);
    }
  }

  redirect(`/worldcup/index.html?${target.toString()}`);
}
