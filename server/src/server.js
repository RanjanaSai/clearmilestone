
import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDatabase();

        app.listen(port, () => {
            console.log(`ClearMilestone server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();


