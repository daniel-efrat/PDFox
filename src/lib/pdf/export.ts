import { PDFDocument } from "pdf-lib";
import {
  Canvas as FabricCanvas,
  FabricObject,
  Textbox,
  Rect,
  Group,
  Path,
  FabricImage,
} from "fabric";

type ExportAnnotation = {
  pageIndex: number;
  data: Record<string, unknown>;
};

const toFabricOptions = (data: Record<string, unknown>) => {
  const options: Record<string, unknown> = { ...data };
  delete options.type;
  delete options.version;
  delete options.objects;
  delete options.path;
  delete options.text;
  delete options.layoutManager;
  delete options.src;
  return options;
};

const enlivenObject = async (
  data: Record<string, unknown>,
): Promise<FabricObject | null> => {
  const objectType = String(data.type ?? "").toLowerCase();

  switch (objectType) {
    case "textbox":
      return new Textbox(String(data.text ?? "Type here..."), toFabricOptions(data));
    case "rect":
      return new Rect(toFabricOptions(data));
    case "path":
      return new Path((data.path ?? "") as never, toFabricOptions(data));
    case "image": {
      const src = typeof data.src === "string" ? data.src : "";
      if (!src) return null;
      const image = await FabricImage.fromURL(src);
      image.set(toFabricOptions(data));
      return image;
    }
    case "group": {
      const rawChildren = Array.isArray(data.objects)
        ? (data.objects as Record<string, unknown>[])
        : [];
      const children = (
        await Promise.all(rawChildren.map((child) => enlivenObject(child)))
      ).filter(Boolean) as FabricObject[];
      return new Group(children, toFabricOptions(data));
    }
    default:
      return null;
  }
};

const renderAnnotationsToPngBytes = async (
  pageWidth: number,
  pageHeight: number,
  pageAnnotations: ExportAnnotation[],
): Promise<Uint8Array | null> => {
  if (pageAnnotations.length === 0) return null;
  if (typeof document === "undefined") return null;

  const element = document.createElement("canvas");
  element.width = Math.max(1, Math.ceil(pageWidth));
  element.height = Math.max(1, Math.ceil(pageHeight));

  const canvas = new FabricCanvas(element, {
    width: pageWidth,
    height: pageHeight,
    selection: false,
  });

  try {
    const objects = await Promise.all(
      pageAnnotations.map(async (annotation) => {
        const obj = await enlivenObject(annotation.data);
        if (!obj) return null;

        if (annotation.data.globalCompositeOperation) {
          obj.set({
            globalCompositeOperation: String(
              annotation.data.globalCompositeOperation,
            ),
          });
        }
        return obj;
      }),
    );

    objects.filter(Boolean).forEach((obj) => canvas.add(obj as FabricObject));
    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1,
      quality: 1,
    });
    const response = await fetch(dataUrl);
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes;
  } finally {
    canvas.dispose();
  }
};

export async function bakeAnnotations(
  originalPdfBytes: Uint8Array,
  annotations: ExportAnnotation[],
) {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);
    if (pageAnnotations.length === 0) continue;

    const overlayPngBytes = await renderAnnotationsToPngBytes(
      width,
      height,
      pageAnnotations,
    );
    if (!overlayPngBytes) continue;

    const overlayImage = await pdfDoc.embedPng(overlayPngBytes);
    page.drawImage(overlayImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}
