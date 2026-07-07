import { KnowledgeViewerContent } from "./KnowledgeViewerContent";

function isAllowedFilePath(file: string | null | undefined) {
  return Boolean(file && file.startsWith("/knowledge/") && !file.includes(".."));
}

type ViewerSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KnowledgeViewerPage({ searchParams }: { searchParams: ViewerSearchParams }) {
  const params = await searchParams;
  const file = firstParam(params.file);
  const title = firstParam(params.title) || "Doc";
  const back = firstParam(params.back) || "/dashboard?view=knowledge-files";
  const canShow = isAllowedFilePath(file);
  const previewSrc = canShow && file ? `${file}#toolbar=1&navpanes=0&view=FitH` : undefined;
  const previewImageSrc =
    canShow && file?.match(/\.(png|jpe?g|webp)$/i)
      ? file
      : canShow && file?.match(/\.pdf$/i)
        ? file.replace(/\.pdf$/i, "-print.png")
        : undefined;

  return (
    <KnowledgeViewerContent
      back={back}
      canShow={canShow}
      file={file}
      previewImageSrc={previewImageSrc}
      previewSrc={previewSrc}
      title={title}
    />
  );
}
