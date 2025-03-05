"use client";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("./Dashboard").then((mod) => mod.Dashboard), {
  ssr: false,
});

export default Dashboard;
