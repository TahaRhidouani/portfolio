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

  return { handleUpload };
};
