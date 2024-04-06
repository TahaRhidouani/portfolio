export type Data = {
  githubUsername: string;
  theme: string;
  position: string;
  about: string;
  projects: {
    selected: Projects;
    other: Projects;
  };
  jobs: Jobs;
  achievements: Achievements;
  resume: string;
  resumeLocation?: string;
};

export type Dates = { start: DateType; end: DateType };
export type DateType = [Month, Year] | ["Present"];
export type Month = "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";
export type Year = number;

export type Jobs = Job[];
export type Job = {
  company: string;
  position: string;
  type?: string;
  date: Dates;
  description?: string;
  preview?: string;
  colors: string[];
  logo: string;
  repoUrl?: string;
  websiteUrl?: string;
};

export type Projects = Project[];
export type Project = {
  repoName: string;
  name: string;
  description: string;
  trailerUrl: string;
  rawRepoUrl: string;
  websiteUrl: string;
  repoUrl: string;
  content: string;
  images: string[];
  selected: boolean;
  order: number;
  visible: boolean;
};

export type Achievements = Achievement[];
export type Achievement = {
  logo: string;
  title: string;
  description: string;
  url: string;
};
