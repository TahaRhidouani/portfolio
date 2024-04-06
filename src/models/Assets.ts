import {
    ModelOptions,
    Severity,
    getModelForClass,
    prop,
    ReturnModelType,
} from "@typegoose/typegoose";
import mongoose from "mongoose";

@ModelOptions({
    schemaOptions: {
        timestamps: false,
        collection: "assets",
    },
    options: {
        allowMixed: Severity.ALLOW,
        customName: "Assets"
    },
})

class AssetsClass {

    @prop({required: true, unique: true})
    name: string;

    @prop({required: true})
    data: string;

}

type AssetsModelType = ReturnModelType<typeof AssetsClass>

const Assets = mongoose.models.Assets as AssetsModelType ?? getModelForClass(AssetsClass);
export {Assets, AssetsClass};
