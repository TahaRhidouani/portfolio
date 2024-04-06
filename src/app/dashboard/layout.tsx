import "dotenv/config";
import type {Metadata} from "next";
import {AntdRegistry} from '@ant-design/nextjs-registry';
import {getServerSession} from "next-auth";
import SessionProvider from "@/components/SessionProvider"

export const metadata: Metadata = {
    title: "Taha Rhidouani's portfolio dashboard",
};


export default async function DashboardLayout({children}: { children: React.ReactNode }) {
    const session = await getServerSession();

    return (
        <AntdRegistry>
            <SessionProvider session={session}>
                {children}
            </SessionProvider>
        </AntdRegistry>
    );
}
