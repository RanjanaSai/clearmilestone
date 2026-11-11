export async function askModel(messages) {
    const url = process.env.AI_API_URL;
    const key = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL;

    if (!url || !key || !model) {
        throw new Error("AI service is not configured");
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`AI request failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export function parseJsonResponse(raw) {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
        throw new Error("The AI response did not contain JSON");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
}
