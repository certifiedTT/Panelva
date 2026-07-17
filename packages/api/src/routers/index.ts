import { router } from "../trpc";
import { chapterRouter } from "./chapterRouter";
import { seriesRouter } from "./seriesRouter";
import { creatorRouter } from "./creatorRouter";
import { collaborationRouter } from "./collaborationRouter";

export const appRouter = router({
  chapter: chapterRouter,
  series: seriesRouter,
  creator: creatorRouter,
  collaboration: collaborationRouter,
});

export type AppRouter = typeof appRouter;

