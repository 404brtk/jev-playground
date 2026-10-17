export const PIZZA_SAMPLES = [
  {
    id: "margherita",
    src: "/arcade/margherita.png",
    label: "Margherita",
    alt: "Margherita pizza with mozzarella and basil",
    expected: "pizza",
  },
  {
    id: "pancakes",
    src: "/arcade/pancakes.png",
    label: "Pancakes",
    alt: "Pancakes with butter, syrup, and blueberries",
    expected: "not_pizza",
  },
  {
    id: "pepperoni",
    src: "/arcade/pepperoni.png",
    label: "Pepperoni",
    alt: "Sliced pepperoni pizza",
    expected: "pizza",
  },
  {
    id: "fruit-tart",
    src: "/arcade/fruit-tart.png",
    label: "Fruit tart",
    alt: "Custard tart topped with strawberries, kiwi, and blueberries",
    expected: "not_pizza",
  },
];

export async function loadSampleImage(
  src: string,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(src, { signal });
  if (!response.ok)
    throw new Error(
      "Could not load the sample image. Reload the page and try again.",
    );
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    reader.onloadend = () => signal.removeEventListener("abort", abort);
    reader.onerror = () =>
      reject(
        new Error(
          "Could not read the sample image. Reload the page and try again.",
        ),
      );
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read the sample image. Try again."));
    if (signal.aborted) {
      abort();
      signal.removeEventListener("abort", abort);
    } else reader.readAsDataURL(blob);
  });
}
