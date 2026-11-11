import Milestone from "../models/Milestone.js";
import Project from "../models/Project.js";
import { suggestPaymentPlan } from "../services/ai/paymentPlanService.js";
import { generateReminder } from "../services/ai/reminderGenerationService.js";

export async function suggestPlan(request, response, next) {
    try {
        const plan = await suggestPaymentPlan(request.params.projectId);
        response.json(plan);
    } catch (error) {
        next(error);
    }
}

export async function generateMilestoneReminder(request, response, next) {
    try {
        const tone = request.body?.tone || "friendly";
        const reminder = await generateReminder(request.params.milestoneId, tone);
        response.json(reminder);
    } catch (error) {
        next(error);
    }
}

export async function savePlan(request, response, next) {
    try {
        const { milestones } = request.body;
        const project = await Project.findById(request.params.projectId);

        if (!project) {
            const error = new Error("Project not found");
            error.status = 404;
            throw error;
        }

        if (!Array.isArray(milestones) || milestones.length === 0) {
            const error = new Error("No milestones supplied");
            error.status = 400;
            throw error;
        }

        const sum = milestones.reduce((total, m) => total + m.amountMinor, 0);

        if (sum !== project.totalMinor) {
            const error = new Error(
                `Milestones total ${sum} but the project total is ${project.totalMinor}`
            );
            error.status = 400;
            throw error;
        }

        const existing = await Milestone.countDocuments({ projectId: project._id });

        if (existing > 0) {
            const error = new Error("This project already has milestones");
            error.status = 409;
            throw error;
        }

        const created = await Milestone.create(
            milestones.map((m, index) => ({
                projectId: project._id,
                title: m.title,
                sequence: index + 1,
                amountMinor: m.amountMinor,
                triggerType: m.trigger || "",
                status: index === 0 ? "READY" : "DRAFT"
            }))
        );

        response.status(201).json(created);
    } catch (error) {
        next(error);
    }
}
