import Link from "next/link";
import { TALK_BEATS } from "@/lib/config";

export function TalkBeats({ active }: { active?: string }) {
  return (
    <ol className="beats" aria-label="Talk beats">
      {TALK_BEATS.map((beat) => (
        <li key={beat.slug}>
          <Link
            href={beat.href}
            className={`beat${active === beat.slug ? " card-sage" : ""}`}
          >
            <span className="n">Beat {beat.n}</span>
            <strong>{beat.label}</strong>
          </Link>
        </li>
      ))}
    </ol>
  );
}
