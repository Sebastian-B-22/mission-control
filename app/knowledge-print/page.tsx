import { KnowledgePrintContent } from "./KnowledgePrintContent";

function isAllowedFilePath(file: string | null | undefined) {
  return Boolean(file && file.startsWith("/knowledge/") && !file.includes(".."));
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function printImageFor(file: string) {
  if (file.match(/\.(png|jpe?g|webp)$/i)) return file;
  return file.replace(/\.pdf$/i, "-print.png");
}

type ViewerSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KnowledgePrintPage({ searchParams }: { searchParams: ViewerSearchParams }) {
  const params = await searchParams;
  const file = firstParam(params.file);
  const title = firstParam(params.title) || "Doc";
  const back = firstParam(params.back) || "/dashboard?view=knowledge-files";
  const canShow = isAllowedFilePath(file);
  const imageSrc = canShow && file ? printImageFor(file) : undefined;

  return <KnowledgePrintContent back={back} canShow={canShow} file={file} imageSrc={imageSrc} title={title} />;
}
