import Image from "next/image";
import Link from "next/link";
import { GAMES } from "@/features/arcade/games";

export const metadata = { title: "Arcade · Jev" };

export default function Arcade() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-296 px-8 pt-9 pb-16 max-[760px]:px-4 max-[760px]:pt-6 max-[760px]:pb-12"
    >
      <div className="mb-9 max-[760px]:mb-7">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] font-medium tracking-tight">
          Arcade
        </h1>
        <p className="mt-2.5 max-w-[60ch] leading-normal text-muted-foreground">
          Small games. Questionable decisions.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 max-[760px]:grid-cols-1">
        {Object.entries(GAMES).map(([id, game], index) => (
          <Link
            key={id}
            href={game.href}
            className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card hover:border-ring motion-safe:transition-[border-color] motion-safe:duration-150 motion-safe:ease-out"
          >
            <div
              className={`relative grid aspect-4/3 place-items-center overflow-hidden max-[760px]:aspect-video ${id === "draw" ? "bg-foreground text-background" : "bg-muted"}`}
              aria-hidden="true"
            >
              {id === "draw" && (
                <svg
                  className="size-[90%]"
                  viewBox="0 0 320 240"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M108 181 99 87 133 111Q159 99 186 111L222 83 211 179Q160 215 108 181Z" />
                  <path d="M135 147h1m46-1h1m-32 19 9 7 10-8m-10 8v9m-42-22-36-5m38 17-40 4m117-17 38-8m-38 21 40 2" />
                </svg>
              )}
              {id === "even" && (
                <span className="font-mono text-[clamp(4rem,8vw,6.5rem)] font-medium tracking-[-0.08em]">
                  42<span className="ms-2 text-muted-foreground">?</span>
                </span>
              )}
              {id === "pizza" && (
                <Image
                  src="/arcade/margherita.png"
                  alt=""
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-6">
              <span className="font-mono text-xs leading-normal text-muted-foreground">
                0{index + 1} / {game.kind}
              </span>
              <h2 className="mt-3 text-lg leading-[1.3] font-medium">
                {game.title}
              </h2>
              <p className="mt-2 text-sm leading-normal text-muted-foreground">
                {game.description}
              </p>
              <span className="mt-8 flex items-center justify-between gap-3 text-[0.8125rem]">
                Play <span aria-hidden="true">↗</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
