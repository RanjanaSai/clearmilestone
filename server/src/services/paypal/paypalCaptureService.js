import Milestone from "../../models/Milestone.js";
import { getPayPalAccessToken } from "./paypalAuthService.js";

const PAYPAL_BASE_URL = (process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com").trim();

export async function captureOrder(orderId) {
    const milestone = await Milestone.findOne({ paypalOrderId: orderId });

    if (!milestone) {
        const error = new Error("No milestone matches this PayPal order");
        error.status = 404;
        throw error;
    }

    if (milestone.status === "PAID") {
        return { alreadyPaid: true, milestone };
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        const detail = await response.text();
        const error = new Error(`PayPal capture failed (${response.status}): ${detail}`);
        error.status = 502;
        throw error;
    }

    const result = await response.json();

    const capture =
        result.purchase_units?.[0]?.payments?.captures?.[0] || null;

    if (!capture || capture.status !== "COMPLETED") {
        const error = new Error("PayPal did not complete this capture");
        error.status = 502;
        throw error;
    }

    const capturedMinor = Math.round(Number(capture.amount.value) * 100);
    const capturedCurrency = capture.amount.currency_code;

    if (capturedMinor !== milestone.amountMinor || capturedCurrency !== "USD") {
        const error = new Error(
            `Capture mismatch: expected ${milestone.amountMinor} USD, received ${capturedMinor} ${capturedCurrency}`
        );
        error.status = 400;
        throw error;
    }

    milestone.paypalCaptureId = capture.id;
    milestone.status = "PAID";
    milestone.paidAt = new Date();
    await milestone.save();

    return { alreadyPaid: false, milestone };
}
