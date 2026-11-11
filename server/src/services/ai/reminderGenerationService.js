import Milestone from "../../models/Milestone.js";
import Project from "../../models/Project.js";
import { askModel, parseJsonResponse } from "./aiClient.js";

export async function generateReminder(milestoneId, tone = "friendly") {
    const milestone = await Milestone.findById(milestoneId);

    if (!milestone) {
        const error = new Error("Milestone not found");
        error.status = 404;
        throw error;
    }

    const project = await Project.findById(milestone.projectId).populate("clientId");
    const clientName = project?.clientId?.name || "the client";
    const amount = (milestone.amountMinor / 100).toFixed(2);

    const daysOverdue = milestone.dueDate
        ? Math.max(
            0,
            Math.floor((Date.now() - new Date(milestone.dueDate)) / 86400000)
        )
        : 0;

    const prompt = `Write a payment reminder using only these facts.

Client: ${clientName}
Project: ${project?.title || "the project"}
Milestone: ${milestone.title}
Amount due: ${amount} USD
Due date: ${milestone.dueDate ? milestone.dueDate.toISOString().slice(0, 10) : "not set"}
Days overdue: ${daysOverdue}
Tone: ${tone}

Rules:
- Do not invent late fees, penalties, legal consequences or new deadlines.
- Do not include any payment link or URL.
- Keep it under 120 words.
- Return JSON only in this shape:
{"subject":"...","body":"..."}`;

    const raw = await askModel([
        { role: "system", content: "You write short, professional payment reminders as strict JSON only." },
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

    if (!parsed.subject || !parsed.body) {
        const error = new Error("The AI response was missing a subject or body");
        error.status = 502;
        throw error;
    }

    return {
        subject: parsed.subject,
        body: parsed.body,
        tone,
        daysOverdue,
        clientName,
        amountDue: amount,
        paymentPath: `/pay/${milestone._id}`
    };
}
