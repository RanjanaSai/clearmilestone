import { Router } from "express";
import { createClient, listClients } from "../controllers/clientController.js";

const router = Router();

router.post("/", createClient);
router.get("/", listClients);

export default router;
