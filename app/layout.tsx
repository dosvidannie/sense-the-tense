import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const previewUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Sense the Tense — English Tenses Practice",
    description:
      "A calm game for practising all 12 English tenses through cards, error-spotting, and real-life situations.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Sense the Tense",
      description: "Don’t guess the rule. Sense the moment.",
      images: [
        {
          url: previewUrl,
          width: 1792,
          height: 933,
          alt: "Sense the Tense — a calm English tenses practice game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sense the Tense",
      description: "Don’t guess the rule. Sense the moment.",
      images: [previewUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
