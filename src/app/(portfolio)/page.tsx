import "dotenv/config";

import { getData } from "@/app/utils";
import Loader from "@/components/Loader";
import { formatText } from "@/lib/formatText";
import { Metadata } from "next";
import dynamic from "next/dynamic";

const Homepage = dynamic(() => import("@/components/Homepage").then((mod) => mod), {
  ssr: false,
});

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
