import connectDB from "@/lib/connectDB";
import { formatDate } from "@/lib/formatText";
import { Achievements } from "@/models/Achievements";
import { Assets } from "@/models/Assets";
import { Jobs } from "@/models/Jobs";
import { Projects } from "@/models/Projects";
import { Data } from "@/types";
import { cache } from "react";

export const getData = cache(async (sensitiveData: boolean): Promise<Data> => {
  console.log("GETTING DATA");
  await connectDB();

  const theme = await Assets.findOne({ name: "theme" }).lean().exec();

  const position = await Assets.findOne({ name: "position" }).lean().exec();

  const resume = await Assets.findOne({ name: "resume" }).lean().exec();

  const about = await Assets.findOne({ name: "about-me" }).lean().exec();

  const jobs = await Jobs.find({}, { _id: 0 }).lean().exec();
  jobs
    .sort((a, b) => {
      return formatDate(a.date.start).getTime() - formatDate(b.date.start).getTime();
    })
    .reverse();

  const selected = await Projects.find({ selected: true, ...(!sensitiveData && { visible: true }) }, { _id: 0 })
    .lean()
    .exec();
  selected.sort((a, b) => a.order - b.order);

  const other = await Projects.find({ selected: false, ...(!sensitiveData && { visible: true }) }, { _id: 0 })
    .lean()
    .exec();
  other.sort((a, b) => a.order - b.order);

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
    resume: resume!.data,
    ...(sensitiveData && { resumeLocation: resumeLocation?.data as string }),
  };
});
