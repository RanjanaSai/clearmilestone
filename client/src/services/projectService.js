import apiClient from "./apiClient";

export async function getProjects() {
    const response = await apiClient.get("/projects");
    return response.data;
}
