import { router } from "../trpc";
import { chapterRouter } from "./chapterRouter";
import { seriesRouter } from "./seriesRouter";
import { creatorRouter } from "./creatorRouter";

export const appRouter = router({
  chapter: chapterRouter,
  series: seriesRouter,
  creator: creatorRouter,
});

export type AppRouter = typeof appRouter;

