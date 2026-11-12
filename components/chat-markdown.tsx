import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(<code key={`${keyPrefix}-c-${i}`}>{token.slice(1, -1)}</code>);
    }
    last = match.index + token.length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isUl(line: string) {
  return /^[-*•]\s+/.test(line);
}
function isOl(line: string) {
  return /^\d+[.)]\s+/.test(line);
}
function stripBullet(line: string) {
  return line.replace(/^([-*•]|\d+[.)])\s+/, "");
}

function renderLines(lines: string[], key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isUl(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && isUl(lines[i])) {
        items.push(stripBullet(lines[i]));
        i += 1;
      }
      out.push(
        <ul key={`${key}-ul-${i}`}>
          {items.map((item, li) => (
            <li key={li}>{inline(item, `${key}-u-${li}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (isOl(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(stripBullet(lines[i]));
        i += 1;
      }
      out.push(
        <ol key={`${key}-ol-${i}`}>
          {items.map((item, li) => (
            <li key={li}>{inline(item, `${key}-o-${li}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && !isUl(lines[i]) && !isOl(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    out.push(
      <p key={`${key}-p-${i}`}>
        {para.map((line, li) => (
          <span key={li}>
            {li > 0 ? <br /> : null}
            {inline(line, `${key}-p-${li}`)}
          </span>
        ))}
      </p>,
    );
  }
  return out;
}

export function ChatMarkdown({ text }: { text: string }) {
  if (!text.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);

  return (
    <div className="bubble-md">
      {blocks.flatMap((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        return renderLines(lines, String(bi));
      })}
    </div>
  );
}
