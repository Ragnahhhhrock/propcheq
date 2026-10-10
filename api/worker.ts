import app from "./boot";
import { setBindings, type Bindings } from "./lib/env";

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    setBindings(env);
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Bindings>;
