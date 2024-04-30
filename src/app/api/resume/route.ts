import connectDB from "@/lib/connectDB";
import { Assets } from "@/models/Assets";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  await connectDB();

  const resume = await Assets.findOne({ name: "resume" }).lean().exec();

  if (resume) {
    return new NextResponse(Buffer.from(resume.data, "base64"), {
      status: 200,
      headers: new Headers({
        "content-type": "application/pdf",
      }),
    });
  } else {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
}
