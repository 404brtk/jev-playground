import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { GAMES, type Game } from "../games";
import { DrawGame } from "./draw-game";
import { EvenGame } from "./even-game";
import { PizzaGame } from "./pizza-game";

async function ConnectedGame({ game }: { game: Game }) {
  await connection();
  const configured = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  if (game === "draw") return <DrawGame configured={configured} />;
  if (game === "even") return <EvenGame configured={configured} />;
  return <PizzaGame configured={configured} />;
}

export function GamePage({ game }: { game: Game }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-[1184px] px-8 pt-5 pb-6 max-[760px]:px-4 max-[760px]:pt-6 max-[760px]:pb-12"
    >
      <Link
        href="/arcade"
        className="mb-2 inline-flex min-h-10 items-center text-[0.8125rem] text-muted-foreground hover:text-foreground"
      >
        ← All games
      </Link>
      <div className="mb-6">
        <h1 className="text-[clamp(1.75rem,3vw,2rem)] leading-[1.2] font-medium tracking-[-0.025em]">
          {GAMES[game].title}
        </h1>
        <p className="mt-2 max-w-[60ch] leading-normal text-muted-foreground">
          {GAMES[game].description}
        </p>
      </div>
      <Suspense
        fallback={
          <p role="status" className="py-16 text-muted-foreground">
            Loading game…
          </p>
        }
      >
        <ConnectedGame game={game} />
      </Suspense>
    </main>
  );
}
