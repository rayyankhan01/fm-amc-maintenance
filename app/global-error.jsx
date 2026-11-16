"use client";

import { useEffect } from "react";

export default function GlobalError({ error, retry }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>Unable to load the application</h1>
          <p>Please try again. If the problem continues, contact an administrator.</p>
          <button type="button" onClick={retry}>Try again</button>
        </main>
      </body>
    </html>
  );
}