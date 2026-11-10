import connectDB from "@/lib/connectDB";
import { Achievements } from "@/models/Achievements";
import { Assets } from "@/models/Assets";
import { Jobs } from "@/models/Jobs";
import { Projects } from "@/models/Projects";
import { Data } from "@/types";
import { cache } from "react";

declare global {
  var publicData: { data: Promise<Data>; expires: number } | undefined;
}

// The public page shows the same data to every visitor, so it is kept for 5 minutes.
// Dashboard actions call clearPublicData() so their changes show at once.
export function getPublicData(): Promise<Data> {
  if (!global.publicData || global.publicData.expires < Date.now()) {
    const data = getData(false);
    global.publicData = { data, expires: Date.now() + 5 * 60 * 1000 };
    data.catch(() => clearPublicData());
  }

  return global.publicData.data;
}

export function clearPublicData() {
  global.publicData = undefined;
}

export const getData = cache(async (extras: boolean): Promise<Data> => {
  await connectDB();

  const theme = await Assets.findOne({ name: "theme" }).lean().exec();

  const position = await Assets.findOne({ name: "position" }).lean().exec();

  const resume = await Assets.exists({ name: "resume" });

  const about = await Assets.findOne({ name: "about-me" }).lean().exec();

  const jobs = await Jobs.find({}, { _id: 0, ...(extras ? {} : { logo: 0, preview: 0 }) })
    .lean()
    .exec();

  jobs?.sort((a, b) => (a.date?.start ?? 0) - (b.date?.start ?? 0)).reverse();

  const selected = await Projects.find({ selected: true, ...(!extras && { visible: true }) }, { _id: 0 })
    .lean()
    .exec();
  selected?.sort((a, b) => a.order - b.order);

  const other = await Projects.find({ selected: false, ...(!extras && { visible: true }) }, { _id: 0 })
    .lean()
    .exec();
  other?.sort((a, b) => a.order - b.order);

  const achievements = await Achievements.find({}, { _id: 0 }).lean().exec();

  const resumeLocation = await Assets.findOne({ name: "resume-location" }).lean().exec();

  return {
    githubUsername: process.env.GITHUB_USERNAME!,
    theme: theme?.data as string,
    position: position?.data as string,
    about: (about?.data as string) ?? "",
    projects: {
      selected: selected ?? [],
      other: other ?? [],
    },
    jobs: jobs ?? [],
    achievements: achievements ?? [],
    resumeExists: !!resume,
    ...(extras && { resumeLocation: resumeLocation?.data as string }),
  };
});
