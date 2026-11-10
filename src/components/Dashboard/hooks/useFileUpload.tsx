import { RcFile } from "antd/es/upload";

export const useFileUpload = () => {
  const validImages = ["image/jpeg", "image/jpg", "image/webp", "image/gif", "image/png"];
  const validVideos = ["video/mp4", "video/webm"];

  const handleUpload = (file: RcFile, allowVideo: boolean = false): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const isImage = validImages.includes(file.type!);
      const isVideo = allowVideo && validVideos.includes(file.type!);

      if (file.size! / 1024 / 1024 > 15) {
        reject("Please upload an file smaller than 15MB");
      }

      if (!isImage && !isVideo) {
        reject("Please upload a valid file type");
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Logos are shown as still images, so store new ones as WebP, at most 1024 px on the long side
  const handleLogoUpload = async (file: RcFile): Promise<string | null> => {
    const url = await handleUpload(file);
    if (!url) return url;

    const image = new Image();
    image.src = url;
    await image.decode();

    const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/webp", 0.9);
  };

  return { handleUpload, handleLogoUpload };
};
