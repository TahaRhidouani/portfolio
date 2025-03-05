"use client";
import dynamic from "next/dynamic";

const Homepage = dynamic(() => import("./Homepage").then((mod) => mod.Homepage), {
  ssr: false,
});

export default Homepage;
