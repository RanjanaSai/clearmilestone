import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/common/Layout";
import apiClient from "../services/apiClient";

function money(v) {
  return `$${((v || 0) / 100).toFixed(2)}`;
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const [plan, setPlan] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiClient
      .get(`/milestones?projectId=${projectId}`)
      .then((r) => setMilestones(r.data))
      .catch(console.error);
  }, [projectId]);

  async function handleSuggest() {
    setMessage("Asking the AI...");

    try {
      const r = await apiClient.post(`/ai/projects/${projectId}/suggest-plan`);
      setPlan(r.data);
      setMessage("");
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function handleSave() {
    setMessage("Saving...");

    try {
      const r = await apiClient.post(`/ai/projects/${projectId}/save-plan`, {
        milestones: plan.milestones
      });

      setMilestones(r.data);
      setPlan(null);
      setMessage("Plan saved.");
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <Layout>
      <header className="page-header">
        <div>
          <h1>Project milestones</h1>
          <p>Let AI propose a plan, then approve it.</p>
        </div>
        <button className="btn-primary" onClick={handleSuggest}>
          Suggest plan with AI
        </button>
      </header>

      {message && <p>{message}</p>}

      {plan && (
        <section className="panel">
          <h2>AI suggestion</h2>

          {plan.milestones.map((m, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div className="label">
                {i + 1}. {m.title}
              </div>
              <div className="value navy">{money(m.amountMinor)}</div>
              <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>
                {m.trigger}
              </p>
            </div>
          ))}

          <button className="btn-primary" onClick={handleSave}>
            Approve and save plan
          </button>
        </section>
      )}

      <section className="panel">
        <h2>Saved milestones</h2>

        {milestones.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No milestones yet.</p>
        ) : (
          milestones.map((m) => (
            <div
              key={m._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <span>
                {m.sequence}. {m.title} — {money(m.amountMinor)}
              </span>

              <span>
                <span
                  className={`pill ${
                    m.status === "PAID"
                      ? "pill-paid"
                      : m.status === "READY"
                      ? "pill-pending"
                      : "pill-draft"
                  }`}
                >
                  {m.status}
                </span>{" "}
                {m.status !== "PAID" && (
                  <Link className="pay-link" to={`/pay/${m._id}`}>
                    Pay
                  </Link>
                )}
              </span>
            </div>
          ))
        )}
      </section>
    </Layout>
  );
}
