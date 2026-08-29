import { router } from "../trpc";
import { chapterRouter } from "./chapterRouter";
import { seriesRouter } from "./seriesRouter";
import { creatorRouter } from "./creatorRouter";
import { collaborationRouter } from "./collaborationRouter";
import { adminRouter } from "./adminRouter";
import { userRouter } from "./userRouter";
import { postRouter } from "./postRouter";

export const appRouter = router({
  chapter: chapterRouter,
  series: seriesRouter,
  creator: creatorRouter,
  collaboration: collaborationRouter,
  admin: adminRouter,
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;

