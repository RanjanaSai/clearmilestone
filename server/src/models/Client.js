import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        company: { type: String, trim: true, default: "" }
    },
    { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
