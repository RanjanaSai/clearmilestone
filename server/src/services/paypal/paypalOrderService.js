
import Milestone from "../../models/Milestone.js";
import { getPayPalAccessToken } from "./paypalAuthService.js";

const PAYPAL_BASE_URL = (process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com").trim();

function toDecimalString(amountMinor) {
    return (amountMinor / 100).toFixed(2);
}

export async function createOrderForMilestone(milestoneId) {
    const milestone = await Milestone.findById(milestoneId);

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

    // Reuse an existing pending order instead of blocking the buyer.
    if (milestone.status === "PAYMENT_PENDING" && milestone.paypalOrderId) {
        return { paypalOrderId: milestone.paypalOrderId, status: "CREATED" };
    }

    if (!["READY", "OVERDUE"].includes(milestone.status)) {
        const error = new Error(
            `Milestone is not payable in its current state (${milestone.status})`
        );
        error.status = 409;
        throw error;
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: milestone._id.toString(),
                    description: milestone.title,
                    amount: {
                        currency_code: "USD",
                        value: toDecimalString(milestone.amountMinor)
                    }
                }
            ]
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        const error = new Error(
            `PayPal order creation failed (${response.status}): ${detail}`
        );
        error.status = 502;
        throw error;
    }

    const order = await response.json();

    milestone.paypalOrderId = order.id;
    milestone.status = "PAYMENT_PENDING";
    await milestone.save();

    return { paypalOrderId: order.id, status: order.status };
}
