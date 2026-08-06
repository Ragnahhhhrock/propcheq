import { authRouter } from "./auth-router";
import { emailAuthRouter } from "./email-auth";
import { propcheqRouter } from "./propcheq-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  emailAuth: emailAuthRouter,
  propcheq: propcheqRouter,

  // TODO: add feature routers here, e.g.
  // todo: createRouter({
  //   list: publicQuery.query(() => findTodos()),
  // }),
});

export type AppRouter = typeof appRouter;
