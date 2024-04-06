import "dotenv/config";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taha Rhidouani's portfolio",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
