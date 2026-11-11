import Milestone from "../models/Milestone.js";
import Project from "../models/Project.js";

export async function createMilestone(request, response, next) {
    try {
        const { projectId, title, description, sequence, amountMinor, triggerType, dueDate, status } =
            request.body;

        const project = await Project.findById(projectId);

        if (!project) {
            const error = new Error("Project not found");
            error.status = 404;
            throw error;
        }

        const existing = await Milestone.find({ projectId });

        const plannedTotal = existing.reduce((sum, item) => sum + item.amountMinor, 0);

        if (plannedTotal + amountMinor > project.totalMinor) {
            const error = new Error(
                `Milestones would exceed the project total of ${project.totalMinor} minor units`
            );
            error.status = 400;
            throw error;
        }

        const milestone = await Milestone.create({
            projectId,
            title,
            description,
            sequence,
            amountMinor,
            triggerType,
            dueDate,
            status: status || "DRAFT"
        });

        response.status(201).json(milestone);
    } catch (error) {
        next(error);
    }
}

export async function listMilestones(request, response, next) {
    try {
        const filter = request.query.projectId ? { projectId: request.query.projectId } : {};
        const milestones = await Milestone.find(filter).sort({ sequence: 1 });
        response.json(milestones);
    } catch (error) {
        next(error);
    }
}

export async function getMilestone(request, response, next) {
    try {
        const milestone = await Milestone.findById(request.params.milestoneId);

        if (!milestone) {
            const error = new Error("Milestone not found");
            error.status = 404;
            throw error;
        }

        response.json(milestone);
    } catch (error) {
        next(error);
    }
}

export async function updateMilestone(request, response, next) {
    try {
        const allowed = ["title", "description", "dueDate", "triggerType", "status"];
        const updates = {};

        for (const field of allowed) {
            if (request.body[field] !== undefined) {
                updates[field] = request.body[field];
            }
        }

        const milestone = await Milestone.findById(request.params.milestoneId);

        if (!milestone) {
            const error = new Error("Milestone not found");
            error.status = 404;
            throw error;
        }

        if (milestone.status === "PAID") {
            const error = new Error("A paid milestone cannot be modified");
            error.status = 409;
            throw error;
        }

        Object.assign(milestone, updates);
        await milestone.save();

        response.json(milestone);
    } catch (error) {
        next(error);
    }
}

export async function activateMilestone(request, response, next) {
    try {
        const milestone = await Milestone.findById(request.params.milestoneId);

        if (!milestone) {
            const error = new Error("Milestone not found");
            error.status = 404;
            throw error;
        }

        if (milestone.status === "PAID") {
            const error = new Error("This milestone has already been paid");
            error.status = 409;
            throw error;
        }

        if (milestone.status === "PAYMENT_PENDING") {
            const error = new Error("A PayPal order already exists for this milestone");
            error.status = 409;
            throw error;
        }

        milestone.status = "READY";
        await milestone.save();

        response.json(milestone);
    } catch (error) {
        next(error);
    }
}
