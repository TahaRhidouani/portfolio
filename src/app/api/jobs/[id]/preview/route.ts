import connectDB from "@/lib/connectDB";
import { Jobs } from "@/models/Jobs";
import { NextResponse } from "next/server";

export async function GET(req: Request, data: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  await connectDB();

  const params = await data.params;
  const jobs = await Jobs.findOne({ id: params.id }, { preview: 1 }).lean().exec();

  if (jobs) {
    let data = jobs.preview.split(",");

    let mimeType = data[0].split(":")[1];
    let previewData = data[1];

    return new NextResponse(Buffer.from(previewData, "base64"), {
      status: 200,
      headers: new Headers({
        "content-type": mimeType,
      }),
    });
  } else {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}
