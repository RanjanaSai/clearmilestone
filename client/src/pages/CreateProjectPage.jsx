import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import apiClient from "../services/apiClient";

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    title: "",
    total: ""
  });
  const [message, setMessage] = useState("");

  const update = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Saving...");

    try {
      const client = await apiClient.post("/clients", {
        name: form.clientName,
        email: form.clientEmail
      });

      await apiClient.post("/projects", {
        clientId: client.data._id,
        title: form.title,
        totalMinor: Math.round(Number(form.total) * 100),
        currency: "USD",
        status: "AWAITING_DEPOSIT"
      });

      navigate("/");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <Layout>
      <header className="page-header">
        <div>
          <h1>New project</h1>
          <p>Add a client and the project total.</p>
        </div>
      </header>

      <section className="panel" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <label>Client name</label>
          <input
            value={form.clientName}
            onChange={update("clientName")}
            required
          />

          <label>Client email</label>
          <input
            type="email"
            value={form.clientEmail}
            onChange={update("clientEmail")}
            required
          />

          <label>Project title</label>
          <input value={form.title} onChange={update("title")} required />

          <label>Total (USD)</label>
          <input
            type="number"
            step="0.01"
            value={form.total}
            onChange={update("total")}
            required
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: 16 }}
          >
            Create project
          </button>
        </form>

        {message && <p>{message}</p>}
      </section>
    </Layout>
  );
}
