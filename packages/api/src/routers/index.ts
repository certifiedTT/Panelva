import { router } from "../trpc";
import { chapterRouter } from "./chapterRouter";
import { seriesRouter } from "./seriesRouter";
import { creatorRouter } from "./creatorRouter";
import { collaborationRouter } from "./collaborationRouter";

import { adminRouter } from "./adminRouter";

export const appRouter = router({
  chapter: chapterRouter,
  series: seriesRouter,
  creator: creatorRouter,
  collaboration: collaborationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

