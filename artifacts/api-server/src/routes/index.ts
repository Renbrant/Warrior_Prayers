import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import invitationsRouter from "./invitations";
import prayerRequestsRouter from "./prayerRequests";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(invitationsRouter);
router.use(prayerRequestsRouter);
router.use(categoriesRouter);

export default router;
