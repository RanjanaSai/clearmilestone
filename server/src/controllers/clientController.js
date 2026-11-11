import Client from "../models/Client.js";

export async function createClient(request, response, next) {
    try {
        const { name, email, company } = request.body;

        const client = await Client.create({ name, email, company });

        response.status(201).json(client);
    } catch (error) {
        next(error);
    }
}

export async function listClients(request, response, next) {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        response.json(clients);
    } catch (error) {
        next(error);
    }
}
