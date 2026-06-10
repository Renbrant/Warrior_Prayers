import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import invitationsRouter from "./invitations";
import prayerRequestsRouter from "./prayerRequests";
import categoriesRouter from "./categories";
import prayerSessionsRouter from "./prayerSessions";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(invitationsRouter);
router.use(prayerRequestsRouter);
router.use(categoriesRouter);
router.use(prayerSessionsRouter);
router.use(notificationsRouter);

export default router;
