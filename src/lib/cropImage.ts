/** Canvas-based crop utility for react-easy-crop */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

function getRadianAngle(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Crops and optionally rotates an image, returns a JPEG Blob at the
 * output dimensions (or natural crop size if outputSize is omitted).
 *
 * @param imageSrc    – object URL or data URL of the source image
 * @param pixelCrop   – crop region in source-image pixels
 * @param rotation    – degrees to rotate (default 0)
 * @param outputSize  – force output canvas to exact pixel dimensions (for constrained renders)
 * @param quality     – JPEG quality 0-1 (default 0.92)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  outputSize?: { width: number; height: number },
  quality = 0.92
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const rad = getRadianAngle(rotation);
  // Bounding box that fits the rotated image
  const bboxWidth =
    Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
  const bboxHeight =
    Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

  // Temporary canvas for rotation
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = bboxWidth;
  rotCanvas.height = bboxHeight;
  const rotCtx = rotCanvas.getContext("2d")!;
  rotCtx.translate(bboxWidth / 2, bboxHeight / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Output canvas
  const outW = outputSize?.width ?? pixelCrop.width;
  const outH = outputSize?.height ?? pixelCrop.height;
  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/jpeg",
      quality
    );
  });
}
