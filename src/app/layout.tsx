import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyForge — AI-Powered Study Planner",
  description:
    "Prepare for any competition with AI-generated study plans. Upload your syllabus, set your timeline, and let AI build your personalized roadmap to success.",
  keywords: ["study plan", "competition", "AI", "education", "exam preparation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Background orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {children}
      </body>
    </html>
  );
}
