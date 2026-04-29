import type { ReactNode } from "react";

export const metadata = {
  title: "Mnemo Chatbot",
  description: "A chatbot with persistent memory powered by Mnemo.",
};

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          background: "#0b0f17",
          color: "#e6edf3",
        }}
      >
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
