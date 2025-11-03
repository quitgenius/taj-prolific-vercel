import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voice Study",
  description: "ElevenLabs voice conversation study",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
