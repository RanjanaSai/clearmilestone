import cors from "cors";
import express from "express";
import helmet from "helmet";

import projectRoutes from "./routes/projectRoutes.js";
import { getPayPalAccessToken } from "./services/paypal/paypalAuthService.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";



const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "[localhost](http://localhost:5173)" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (request, response) => {
    response.json({ status: "ok", message: "ClearMilestone server is connected" });
});

app.get("/api/health/paypal", async (request, response) => {
    try {
        await getPayPalAccessToken();
        response.json({ status: "ok", message: "PayPal authentication working" });
    } catch (error) {
        response.status(500).json({ message: error.message });
    }
});

app.use("/api/projects", projectRoutes);
app.use("/api/paypal", paymentRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/clients", clientRoutes);

app.use("/api/ai", aiRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;
