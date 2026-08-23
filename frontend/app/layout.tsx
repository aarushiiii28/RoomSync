import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import UserProfileMenu from "@/components/layout/UserProfileMenu";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata = {
  title: "RoomSync - Roommate Matching Platform",
  description: "Find compatible roommates with AI that understands your lifestyle and habits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body>
        <AuthProvider>
          {children}
          <UserProfileMenu />
        </AuthProvider>
      </body>
    </html>
  );
}