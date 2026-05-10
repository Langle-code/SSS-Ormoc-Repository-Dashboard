import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import employersRouter from "./employers";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import loginHistoryRouter from "./loginHistory";
import jurisdictionsRouter from "./jurisdictions";
import documentTypesRouter from "./document-types";
import backupRouter from "./backup";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(employersRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(loginHistoryRouter);
router.use(jurisdictionsRouter);
router.use(documentTypesRouter);
router.use(backupRouter);

export default router;
