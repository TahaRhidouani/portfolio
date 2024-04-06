import "dotenv/config";

import "../globals.css";
import React from 'react';
import dynamic from "next/dynamic";
import {getData} from "@/app/utils";
import {getServerSession} from "next-auth";
import {redirect} from "next/navigation";

const Dashboard = dynamic(() => import("@/components/Dashboard").then((mod) => mod), {
    ssr: false,
});

export default async function App() {

    const session = await getServerSession()

    if (!session || !session.user) {
        redirect("/api/auth/signin")
    }

    if (session?.user?.email !== process.env.GITHUB_EMAIL) {
        redirect("/dashboard/logout")
    }

    const data = await getData(true);

    return (<Dashboard data={data}/>)
};


