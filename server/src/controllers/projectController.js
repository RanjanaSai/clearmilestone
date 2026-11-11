import Client from "../models/Client.js";
import Project from "../models/Project.js";
import Milestone from "../models/Milestone.js";

export async function createProject(request, response, next) {
    try {
        const {
            clientId,
            client,
            title,
            description,
            totalMinor,
            currency,
            paymentPlanType,
            status,
            expectedCompletionDate
        } = request.body;

        let resolvedClientId = clientId;

        if (!resolvedClientId && client) {
            const savedClient = await Client.create(client);
            resolvedClientId = savedClient._id;
        }

        if (!resolvedClientId) {
            const error = new Error("A clientId or client object is required");
            error.status = 400;
            throw error;
        }

        const project = await Project.create({
            clientId: resolvedClientId,
            title,
            description,
            totalMinor,
            currency,
            paymentPlanType,
            status,
            expectedCompletionDate
        });

        response.status(201).json(project);
    } catch (error) {
        next(error);
    }
}

export async function listProjects(request, response, next) {
    try {
        const projects = await Project.find()
            .populate("clientId")
            .sort({ createdAt: -1 });

        const withBalances = await Promise.all(
            projects.map(async (project) => {
                const milestones = await Milestone.find({ projectId: project._id }).sort({
                    sequence: 1
                });

                const paidMinor = milestones
                    .filter((milestone) => milestone.status === "PAID")
                    .reduce((sum, milestone) => sum + milestone.amountMinor, 0);

                const nextPayable = milestones.find((m) => m.status !== "PAID") || null;

                return {
                    ...project.toObject(),
                    paidMinor,
                    remainingMinor: project.totalMinor - paidMinor,
                    nextMilestoneId: nextPayable ? nextPayable._id : null,
                    nextMilestoneTitle: nextPayable ? nextPayable.title : null
                };
            })
        );

        response.json(withBalances);
    } catch (error) {
        next(error);
    }
}

export async function getProject(request, response, next) {
    try {
        const project = await Project.findById(request.params.projectId).populate(
            "clientId"
        );

        if (!project) {
            const error = new Error("Project not found");
            error.status = 404;
            throw error;
        }

        const milestones = await Milestone.find({ projectId: project._id }).sort({
            sequence: 1
        });

        const paidMinor = milestones
            .filter((milestone) => milestone.status === "PAID")
            .reduce((sum, milestone) => sum + milestone.amountMinor, 0);

        response.json({
            ...project.toObject(),
            paidMinor,
            remainingMinor: project.totalMinor - paidMinor,
            milestones
        });
    } catch (error) {
        next(error);
    }
}
