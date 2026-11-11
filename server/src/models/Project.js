import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        totalMinor: { type: Number, required: true, min: 1 },
        currency: { type: String, required: true, default: "USD", uppercase: true },
        paymentPlanType: {
            type: String,
            enum: ["INSTALLMENTS", "AFTER_COMPLETION"],
            default: "INSTALLMENTS"
        },
        status: {
            type: String,
            enum: [
                "DRAFT",
                "AWAITING_DEPOSIT",
                "IN_PROGRESS",
                "AWAITING_FINAL_PAYMENT",
                "COMPLETED",
                "CANCELLED"
            ],
            default: "DRAFT"
        },
        expectedCompletionDate: { type: Date }
    },
    { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
