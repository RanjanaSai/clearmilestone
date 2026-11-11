let cachedToken = null;
let tokenExpiresAt = 0;

export async function getPayPalAccessToken() {
    const now = Date.now();

    if (cachedToken && now < tokenExpiresAt) {
        return cachedToken;
    }
    const baseUrl = (process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com").trim();

    // const baseUrl = "https://api-m.sandbox.paypal.com";
    const clientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
    const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials are not configured");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    if (!response.ok) {
        throw new Error(`PayPal authentication failed (${response.status})`);
    }

    const data = await response.json();

    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in - 60) * 1000;

    return cachedToken;
}
