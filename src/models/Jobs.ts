import { ModelOptions, Severity, getModelForClass, prop, ReturnModelType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import type { Dates } from "@/types";

@ModelOptions({
  schemaOptions: {
    timestamps: false,
    collection: "jobs",
  },
  options: {
    allowMixed: Severity.ALLOW,
    customName: "Jobs",
  },
})
class JobsClass {
  @prop({ required: true })
  company: string;

  @prop({ required: true })
  position: string;

  @prop()
  type: string;

  @prop({ required: true })
  date: Dates;

  @prop({ required: true })
  logo: string;

  @prop({ required: true })
  colors: string[];

  @prop()
  description: string;

  @prop()
  preview: string;

  @prop()
  repoUrl: string;

  @prop()
  websiteUrl: string;
}

type JobsModelType = ReturnModelType<typeof JobsClass>;

const Jobs = (mongoose.models.Jobs as JobsModelType) ?? getModelForClass(JobsClass);
export { Jobs, JobsClass };
