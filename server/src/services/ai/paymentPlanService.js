import Project from "../../models/Project.js";
import { askModel, parseJsonResponse } from "./aiClient.js";

export async function suggestPaymentPlan(projectId) {
    const project = await Project.findById(projectId);

    if (!project) {
        const error = new Error("Project not found");
        error.status = 404;
        throw error;
    }

    const prompt = `Create a milestone payment plan.

Project title: ${project.title}
Total: ${project.totalMinor} minor units (${project.currency})
Completion target: ${project.expectedCompletionDate || "not specified"}

Rules:
- Return exactly 3 milestones.
- Amounts are integers in minor units (for example 30000 means 300.00).
- The amounts must add up to exactly ${project.totalMinor}.
- The first milestone is a deposit paid before work begins.
- Do not add fees, taxes or penalties.
- Return JSON only in this shape:
{"milestones":[{"title":"Deposit","amountMinor":30000,"trigger":"Before work begins"}]}`;

    const raw = await askModel([
        { role: "system", content: "You produce payment plans as strict JSON only." },
        { role: "user", content: prompt }
    ]);

    let parsed;

    try {
        parsed = parseJsonResponse(raw);
    } catch {
        const error = new Error("The AI response was not valid JSON");
        error.status = 502;
        throw error;
    }

    const milestones = parsed.milestones;

    if (!Array.isArray(milestones) || milestones.length === 0) {
        const error = new Error("The AI response contained no milestones");
        error.status = 502;
        throw error;
    }

    let sum = 0;

    for (const milestone of milestones) {
        if (!Number.isInteger(milestone.amountMinor) || milestone.amountMinor <= 0) {
            const error = new Error("The AI returned an invalid milestone amount");
            error.status = 502;
            throw error;
        }
        sum += milestone.amountMinor;
    }

    if (sum !== project.totalMinor) {
        const error = new Error(
            `The AI plan totals ${sum} but the project total is ${project.totalMinor}`
        );
        error.status = 502;
        throw error;
    }

    return {
        projectId: project._id,
        totalMinor: project.totalMinor,
        milestones
    };
}
