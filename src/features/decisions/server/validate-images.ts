import "server-only";
import sharp from "sharp";
import { Effect } from "effect";
import { imageUrls, MAX_IMAGE_BYTES } from "../request";
import { DecisionError } from "./errors";

export function validateImages(state: unknown) {
  return Effect.tryPromise({
    try: async () => {
      for (const url of imageUrls(state)) {
        const [prefix, encoded] = url.split(",");
        const bytes = Buffer.from(encoded, "base64");
        if (bytes.length > MAX_IMAGE_BYTES)
          throw new Error("Choose a PNG or JPEG smaller than 5 MiB.");
        const metadata = await sharp(bytes, {
          limitInputPixels: 2_458_624,
          failOn: "warning",
        }).metadata();
        if (
          !["png", "jpeg"].includes(metadata.format) ||
          !prefix.includes(`image/${metadata.format};`) ||
          (metadata.pages ?? 1) > 1
        )
          throw new Error("Choose a still PNG or JPEG image.");
        if (
          metadata.width < 256 ||
          metadata.height < 256 ||
          metadata.width > 1568 ||
          metadata.height > 1568 ||
          metadata.width * metadata.height < 78_400
        )
          throw new Error(
            "Use an image 256-1,568 px per side with at least 78,400 pixels in total.",
          );
        if (metadata.orientation && metadata.orientation !== 1)
          throw new Error(
            "Export the image with its rotation applied, then upload it again.",
          );
      }
    },
    catch: (error) =>
      new DecisionError({
        code: "invalid_image",
        status: 400,
        message:
          error instanceof Error && /^(Choose|Use|Export) /.test(error.message)
            ? error.message
            : "Unable to read the image. Upload a valid PNG or JPEG up to 1,568 px per side.",
      }),
  });
}
