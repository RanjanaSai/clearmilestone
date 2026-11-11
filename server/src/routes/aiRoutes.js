import { Router } from "express";
import {
    suggestPlan,
    generateMilestoneReminder,
    savePlan
} from "../controllers/aiController.js";

const router = Router();

router.post("/projects/:projectId/suggest-plan", suggestPlan);
router.post("/projects/:projectId/save-plan", savePlan);
router.post("/milestones/:milestoneId/reminder", generateMilestoneReminder);

export default router;
