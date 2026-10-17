export const GAMES = {
  draw: {
    title: "Draw & guess",
    description: "Your drawing skills. Jev’s best guess.",
    kind: "Sketch",
    href: "/arcade/draw",
  },
  even: {
    title: "Is it even?",
    description: "An entire AI model. One very small question.",
    kind: "Numbers",
    href: "/arcade/even",
  },
  pizza: {
    title: "Pizza or not pizza",
    description: "The only two food groups that matter.",
    kind: "Vision",
    href: "/arcade/pizza",
  },
};
export type Game = keyof typeof GAMES;
