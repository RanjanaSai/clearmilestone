import { Router } from "express";
import {
    createMilestone,
    listMilestones,
    getMilestone,
    updateMilestone,
    activateMilestone
} from "../controllers/milestoneController.js";

const router = Router();

router.post("/", createMilestone);
router.get("/", listMilestones);
router.get("/:milestoneId", getMilestone);
router.patch("/:milestoneId", updateMilestone);
router.post("/:milestoneId/activate", activateMilestone);

export default router;
