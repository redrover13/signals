"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function Track() {
  const path = usePathname();
  const q = useSearchParams();

  useEffect(() => {
    const payload = {
      type: "site.view",
      page: path || "/",
      utm: Object.fromEntries(q.entries()),
      ts: new Date().toISOString(),
    };
    fetch(process.env.NEXT_PUBLIC_API_BASE + "/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [path, q]);

  return null;
}
