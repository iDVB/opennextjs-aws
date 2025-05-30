import { createServer } from "node:http";

import type { Wrapper, WrapperHandler } from "types/overrides";

import type { StreamCreator } from "types/open-next";
import { debug, error } from "../../adapters/logger";

const wrapper: WrapperHandler = async (handler, converter) => {
  const server = createServer(async (req, res) => {
    const internalEvent = await converter.convertFrom(req);
    const streamCreator: StreamCreator = {
      writeHeaders: (prelude) => {
        res.setHeader("Set-Cookie", prelude.cookies);
        res.writeHead(prelude.statusCode, prelude.headers);
        res.flushHeaders();
        return res;
      },
    };
    if (internalEvent.rawPath === "/__health") {
      res.writeHead(200, {
        "Content-Type": "text/plain",
      });
      res.end("OK");
    } else {
      await handler(internalEvent, { streamCreator });
    }
  });

  await new Promise<void>((resolve) => {
    server.on("listening", () => {
      const cleanup = (code: number) => {
        debug("Closing server");
        server.close(() => {
          debug("Server closed");
          process.exit(code);
        });
      };
      console.log(`Listening on port ${process.env.PORT ?? "3000"}`);
      debug(`Open Next version: ${process.env.OPEN_NEXT_VERSION}`);

      process.on("exit", (code) => cleanup(code));

      process.on("SIGINT", () => cleanup(0));
      process.on("SIGTERM", () => cleanup(0));

      resolve();
    });

    server.listen(Number.parseInt(process.env.PORT ?? "3000", 10));
  });

  server.on("error", (err) => {
    error(err);
  });

  return () => {
    server.close();
  };
};

export default {
  wrapper,
  name: "node",
  supportStreaming: true,
} satisfies Wrapper;
