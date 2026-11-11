import { createOrderForMilestone } from "../services/paypal/paypalOrderService.js";
import { captureOrder } from "../services/paypal/paypalCaptureService.js";

export async function createMilestoneOrder(request, response, next) {
    try {
        const result = await createOrderForMilestone(request.params.milestoneId);
        response.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function captureMilestoneOrder(request, response, next) {
    try {
        const result = await captureOrder(request.params.orderId);
        response.json(result);
    } catch (error) {
        next(error);
    }
}
