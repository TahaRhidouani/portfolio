import "@ant-design/v5-patch-for-react-19";
import "dotenv/config";

import { getData } from "@/app/utils";
import Dashboard from "@/components/Dashboard";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import "../globals.css";

export default async function App() {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/api/auth/signin");
  }

  if (session?.user?.email !== process.env.GITHUB_EMAIL) {
    redirect("/dashboard/logout");
  }

  const data = await getData(true);

  return <Dashboard data={data} />;
}
