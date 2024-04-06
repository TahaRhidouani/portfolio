import {
    ModelOptions,
    Severity,
    getModelForClass,
    prop,
    ReturnModelType,
    index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";

@ModelOptions({
    schemaOptions: {
        timestamps: false,
        collection: "projects",
    },
    options: {
        allowMixed: Severity.ALLOW,
        customName: "Projects"
    },
})

class ProjectsClass {

    @prop({required: true, unique: true})
    repoName: string;

    @prop({required: true, unique: true})
    name: string;

    @prop({required: true})
    trailerUrl: string;

    @prop()
    websiteUrl: string;

    @prop()
    repoUrl: string;

    @prop()
    rawRepoUrl: string;

    @prop({required: true})
    description: string;

    @prop()
    content: string;

    @prop()
    images: string[];

    @prop({default: false})
    selected: boolean

    @prop({default: true})
    visible: boolean

    @prop({required: true})
    order: number

}

type ProjectsModelType = ReturnModelType<typeof ProjectsClass>

const Projects = mongoose.models.Projects as ProjectsModelType ?? getModelForClass(ProjectsClass);
export {Projects, ProjectsClass};
