import { Router } from "express";
import {
    createMilestoneOrder,
    captureMilestoneOrder
} from "../controllers/paymentController.js";

const router = Router();

router.post("/milestones/:milestoneId/orders", createMilestoneOrder);
router.post("/orders/:orderId/capture", captureMilestoneOrder);

export default router;
