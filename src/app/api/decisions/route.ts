import { Effect } from "effect";
import { decide } from "@/features/decisions/server/decide";
import { readRequest } from "@/features/decisions/server/read-request";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const program = readRequest(request).pipe(
    Effect.flatMap(decide),
    Effect.match({
      onSuccess: (result) => Response.json(result, { headers }),
      onFailure: (error) =>
        Response.json(
          { error: { code: error.code, message: error.message } },
          { status: error.status, headers },
        ),
    }),
  );

  try {
    return await Effect.runPromise(program, { signal: request.signal });
  } catch {
    return Response.json(
      {
        error: {
          code: request.signal.aborted ? "cancelled" : "internal_error",
          message: request.signal.aborted
            ? "The request was cancelled."
            : "The decision could not be completed. Please try again.",
        },
      },
      { status: request.signal.aborted ? 408 : 500, headers },
    );
  }
}
