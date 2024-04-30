import connectDB from "@/lib/connectDB";
import { Jobs } from "@/models/Jobs";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  await connectDB();

  const jobs = await Jobs.findOne({ id: params.id }, { logo: 1 }).lean().exec();

  if (jobs) {
    let data = jobs.logo.split(",");

    let mimeType = data[0].split(":")[1];
    let logoData = data[1];

    return new NextResponse(Buffer.from(logoData, "base64"), {
      status: 200,
      headers: new Headers({
        "content-type": mimeType,
      }),
    });
  } else {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}
