import "dotenv/config";

import { getData } from "@/app/utils";
import Homepage from "@/components/Homepage";
import Loader from "@/components/Loader";
import { formatText } from "@/lib/formatText";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getData(false);

  return {
    description: formatText(about),
  };
}

export default async function App() {
  const data = await getData(false);

  const accent = `
        :root {
            --accent: ${data.theme};
        }
    `;

  return (
    <>
      <style>{accent}</style>
      <Loader />
      <Homepage data={data} />
    </>
  );
}
