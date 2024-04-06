import "dotenv/config";
import type {Metadata, Viewport} from "next";
import "./globals.css";

export const metadata: Metadata = {
    icons: [
        {
            rel: "icon",
            url: "/assets/icons/favicon-light.png",
            media: "(prefers-color-scheme: light)",
        },
        {
            rel: "icon",
            url: "/assets/icons/favicon-dark.png",
            media: "(prefers-color-scheme: dark)",
        },
    ],
    metadataBase: new URL(("https://" + process.env.URL) as string),
    openGraph: {images: "/icon/favicon-alt.png"},
};

export const viewport: Viewport = {
    themeColor: "black",
};


export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body suppressHydrationWarning>
        {children}
        </body>
        </html>
    );
}
