"use server";

import connectDB from "@/lib/connectDB";
import { Achievements } from "@/models/Achievements";
import { Assets } from "@/models/Assets";
import { Jobs } from "@/models/Jobs";
import { Projects } from "@/models/Projects";
import { Achievements as AchievementsType, Jobs as JobsType, Projects as ProjectsType } from "@/types";
import { drive } from "@googleapis/drive";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";

export type DataUpdateRes = {
  error: boolean;
  message: string;
  data?: any;
};

export async function isAuthenticated(): Promise<Boolean> {
  const session = await getServerSession();
  return session?.user?.email === process.env.GITHUB_EMAIL;
}

export async function updateMainData(data: { theme: string; position: string }) {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      await Assets.findOneAndUpdate(
        { name: "theme" },
        {
          data: data.theme,
          type: "plaintext",
        },
        { upsert: true }
      );

      await Assets.findOneAndUpdate(
        { name: "position" },
        {
          data: data.position,
          type: "plaintext",
        },
        { upsert: true }
      );
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    return { error: false, message: "Successfully saved" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function updateResumeLocation(location: string): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      await Assets.findOneAndUpdate(
        { name: "resume-location" },
        {
          data: location,
          type: "plaintext",
        },
        { upsert: true }
      );
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    if ((await fetchResume()).error) {
      return { error: true, message: "An error occured while refetching" };
    } else {
      revalidatePath("/", "layout");
      return { error: false, message: "Successfully saved & refetched" };
    }
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function fetchResume(): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      const resumeLocation = await Assets.findOne({ name: "resume-location" }).lean().exec();

      if (!resumeLocation) return { error: true, message: "Resume location not set" };

      const driveAPI = drive({ version: "v3", auth: process.env.GOOGLE_API_KEY });

      const res = await driveAPI.files.export(
        {
          fileId: resumeLocation.data as string,
          mimeType: "application/pdf",
        },
        { responseType: "arraybuffer" }
      );

      await Assets.findOneAndUpdate(
        { name: "resume" },
        {
          data: Buffer.from(res.data as ArrayBuffer).toString("base64"),
          type: "pdf",
        },
        { upsert: true }
      );
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully refetched" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function updateAboutMe(text: string): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      await Assets.findOneAndUpdate({ name: "about-me" }, { data: text, type: "plaintext" }, { upsert: true });
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully saved" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function updateJobData(jobs: JobsType): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      await Jobs.deleteMany({});

      await Jobs.insertMany(
        jobs.map((j) => {
          const id = new Types.ObjectId();
          return {
            ...j,
            _id: id,
            id: id,
          };
        })
      );
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully saved" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function fetchProjects(): Promise<DataUpdateRes> {
  const validImages = ["image/jpeg", "image/jpg", "image/webp", "image/gif", "image/png"];

  async function fetchProjectContent(user: string, project: string, branch: string): Promise<string | null> {
    const response = await fetch("https://raw.githubusercontent.com/" + user + "/" + project + "/" + branch + "/README.md", {
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_API,
      },
    });

    if (response.ok) {
      return await response.text();
    } else {
      return null;
    }
  }

  async function fetchImages(user: string, project: string, branch: string): Promise<string[] | null> {
    const response = await fetch("https://api.github.com/repos/" + user + "/" + project + "/git/trees/" + branch, {
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_API,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const folderNames = ["images", "screenshots", "mockups", "preview"];

      const baseLevelDirectories = data.tree.filter((item: { type: string }) => item.type === "tree");
      let folder: { url: string; path: string } | null = null;
      for (const dir of baseLevelDirectories) {
        if (folderNames.includes(dir.path.toLowerCase())) {
          folder = dir;
          break;
        }
      }

      const images: string[] = [];
      if (folder !== null) {
        const res = await fetch(folder.url, {
          headers: {
            Authorization: "Bearer " + process.env.GITHUB_API,
          },
        });
        const files = await res.json();

        if (response.ok) {
          files.tree.forEach((file: { path: string }) => {
            const fileType = file.path.split(".").at(-1);

            if (validImages.includes("image/" + fileType)) {
              images.push("https://github.com/" + user + "/" + project + "/blob/" + branch + "/" + folder!.path + "/" + file.path + "?raw=true");
            }
          });
        }
      }
      return images;
    } else {
      return null;
    }
  }

  async function fetchProjectTrailer(user: string, project: string, branch: string): Promise<string | null> {
    const response = await fetch("https://raw.githubusercontent.com/" + user + "/" + project + "/" + branch + "/images/trailer.mp4", {
      headers: {
        Authorization: "Bearer " + process.env.GITHUB_API,
      },
    });

    if (response.ok) {
      return "https://raw.githubusercontent.com/" + user + "/" + project + "/master/images/trailer.mp4";
    } else {
      return null;
    }
  }

  if (await isAuthenticated()) {
    try {
      await connectDB();

      const response = await fetch("https://api.github.com/users/" + process.env.GITHUB_USERNAME + "/repos?sort=created", {
        headers: {
          Authorization: "Bearer " + process.env.GITHUB_API,
        },
      });

      const newProjects = await response.json();
      const oldProjects = await Projects.find({}).lean().exec();

      for (const oldProject of oldProjects) {
        if (!newProjects.some((project: any) => project.name === oldProject.repoName)) {
          await Projects.findOneAndDelete({ repoName: oldProject.repoName });
        }
      }

      for (const [i, project] of newProjects.entries()) {
        const [owner, repo] = project.full_name.split("/");
        const branch = project.default_branch;

        if (project.private) {
          await Projects.findOneAndDelete({ repoName: repo });
          continue;
        }

        await Projects.findOneAndUpdate(
          { repoName: project.name },
          {
            $set: {
              description: project.description,
              content: await fetchProjectContent(owner, repo, branch),
              trailerUrl: await fetchProjectTrailer(owner, repo, branch),
              websiteUrl: project.homepage,
              rawRepoUrl: "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/",
              repoUrl: project.html_url,
              images: await fetchImages(owner, repo, branch),
            },
            $setOnInsert: {
              repoName: repo,
              name: project.name
                .split("-")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
              selected: false,
              visible: true,
              order: i,
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    const projects = await Projects.find({}, { _id: 0 }).lean().exec();
    projects.sort((a, b) => a.order - b.order);

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully fetched", data: projects };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function updateProjects(selected: ProjectsType, other: ProjectsType): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      for (const [i, project] of selected.entries()) {
        await Projects.findOneAndUpdate(
          { repoName: project.repoName },
          {
            name: project.name,
            selected: true,
            visible: project.visible,
            order: i,
          }
        );
      }

      for (const [i, project] of other.entries()) {
        await Projects.findOneAndUpdate(
          { repoName: project.repoName },
          {
            name: project.name,
            selected: false,
            visible: project.visible,
            order: i,
          }
        );
      }
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully saved" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}

export async function updateAchievements(achievements: AchievementsType): Promise<DataUpdateRes> {
  if (await isAuthenticated()) {
    try {
      await connectDB();

      await Achievements.deleteMany({});

      await Achievements.insertMany(
        achievements.map((a) => {
          const id = new Types.ObjectId();
          return {
            ...a,
            _id: id,
            id: id,
          };
        })
      );
    } catch (e: any) {
      return { error: true, message: e.message };
    }

    revalidatePath("/", "layout");
    return { error: false, message: "Successfully saved" };
  } else {
    return { error: true, message: "Not authenticated" };
  }
}
