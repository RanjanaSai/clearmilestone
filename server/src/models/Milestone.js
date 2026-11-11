import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        sequence: { type: Number, required: true, min: 1 },
        amountMinor: { type: Number, required: true, min: 1 },
        triggerType: { type: String, trim: true, default: "" },
        dueDate: { type: Date },
        status: {
            type: String,
            enum: ["DRAFT", "READY", "PAYMENT_PENDING", "PAID", "OVERDUE", "CANCELLED"],
            default: "DRAFT"
        },
        paypalOrderId: { type: String, unique: true, sparse: true },
        paypalCaptureId: { type: String, unique: true, sparse: true },
        paidAt: { type: Date, default: null }
    },
    { timestamps: true }
);

export default mongoose.model("Milestone", milestoneSchema);
