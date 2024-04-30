import { ModelOptions, ReturnModelType, Severity, getModelForClass, prop } from "@typegoose/typegoose";
import mongoose from "mongoose";

@ModelOptions({
  schemaOptions: {
    timestamps: false,
    collection: "achievements",
  },
  options: {
    allowMixed: Severity.ALLOW,
    customName: "Achievements",
  },
})
class AchievementsClass {
  @prop({ required: true })
  id: string;

  @prop({ required: true })
  logo: string;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  description: string;

  @prop()
  url: string;
}

type AchievementsModelType = ReturnModelType<typeof AchievementsClass>;
const Achievements = (mongoose.models.Achievements as AchievementsModelType) ?? getModelForClass(AchievementsClass);

export { Achievements, AchievementsClass };
