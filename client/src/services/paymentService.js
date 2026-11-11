import apiClient from "./apiClient";

export async function getMilestone(milestoneId) {
    const response = await apiClient.get(`/milestones/${milestoneId}`);
    return response.data;
}

export async function createPayPalOrder(milestoneId) {
    const response = await apiClient.post(`/paypal/milestones/${milestoneId}/orders`);
    return response.data;
}

export async function capturePayPalOrder(orderId) {
    const response = await apiClient.post(`/paypal/orders/${orderId}/capture`);
    return response.data;
}
