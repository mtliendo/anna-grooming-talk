"use client";

import { useState } from "react";

export function CopyableUrl({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="copy-url">
      <p className="copy-url-label">{label}</p>
      <div className="copy-url-row">
        <code className="copy-url-value">{url}</code>
        <button className="btn btn-ghost btn-small" type="button" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
