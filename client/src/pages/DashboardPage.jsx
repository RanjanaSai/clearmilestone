import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import Layout from "../components/common/Layout";
import { getProjects } from "../services/projectService";

function money(value) {
  return `$${((value || 0) / 100).toFixed(2)}`;
}

export default function DashboardPage() {
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(setRowData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const total = rowData.reduce((sum, p) => sum + (p.totalMinor || 0), 0);
    const paid = rowData.reduce((sum, p) => sum + (p.paidMinor || 0), 0);
    return { total, paid, remaining: total - paid };
  }, [rowData]);

  const columnDefs = useMemo(
    () => [
      { field: "clientId.name", headerName: "Client", flex: 1, minWidth: 150 },
      {
        field: "title",
        headerName: "Project",
        flex: 1.4,
        minWidth: 180,
        cellRenderer: (p) => (
          <Link className="pay-link" to={`/projects/${p.data._id}`}>
            {p.data.title}
          </Link>
        )
      },
      {
        headerName: "Total",
        valueGetter: (p) => p.data.totalMinor,
        valueFormatter: (p) => money(p.value),
        type: "numericColumn",
        width: 120
      },
      {
        headerName: "Paid",
        valueGetter: (p) => p.data.paidMinor,
        valueFormatter: (p) => money(p.value),
        type: "numericColumn",
        width: 120
      },
      {
        headerName: "Remaining",
        valueGetter: (p) => p.data.remainingMinor,
        valueFormatter: (p) => money(p.value),
        type: "numericColumn",
        width: 130
      },
      {
        headerName: "Progress",
        valueGetter: (p) =>
          p.data.totalMinor
            ? Math.round((p.data.paidMinor / p.data.totalMinor) * 100)
            : 0,
        valueFormatter: (p) => `${p.value}%`,
        width: 120
      },
      {
        headerName: "Status",
        valueGetter: (p) =>
          !p.data.nextMilestoneId && p.data.paidMinor === 0
            ? "No milestones"
            : p.data.remainingMinor === 0
            ? "Completed"
            : p.data.paidMinor === 0
            ? "Awaiting deposit"
            : "In progress",
        cellRenderer: (p) => {
          const cls =
            p.value === "Completed"
              ? "pill pill-paid"
              : p.value === "No milestones"
              ? "pill pill-draft"
              : p.value === "Awaiting deposit"
              ? "pill pill-pending"
              : "pill pill-draft";
          return <span className={cls}>{p.value}</span>;
        },
        width: 170
      },
      {
        headerName: "Pay",
        width: 160,
        sortable: false,
        filter: false,
        cellRenderer: (p) =>
          p.data.nextMilestoneId ? (
            <Link className="pay-link" to={`/pay/${p.data.nextMilestoneId}`}>
              Pay {p.data.nextMilestoneTitle}
            </Link>
          ) : (
            <span style={{ color: "var(--muted)" }}>
              {p.data.paidMinor === 0 ? "—" : "Settled"}
            </span>
          )
      }
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  return (
    <Layout>
      <header className="page-header">
        <div>
          <h1>Collections</h1>
          <p>Every project, its milestones and what is still owed.</p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          New project
        </Link>
      </header>

      <section className="cards">
        <div className="card">
          <div className="label">Total invoiced</div>
          <div className="value navy">{money(totals.total)}</div>
        </div>
        <div className="card">
          <div className="label">Collected</div>
          <div className="value green">{money(totals.paid)}</div>
        </div>
        <div className="card">
          <div className="label">Outstanding</div>
          <div className="value amber">{money(totals.remaining)}</div>
        </div>
        <div className="card">
          <div className="label">Active projects</div>
          <div className="value navy">{rowData.length}</div>
        </div>
      </section>

      <section className="panel">
        <h2>Projects</h2>
        <div className="ag-theme-quartz grid-wrap">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination
            paginationPageSize={10}
            loading={loading}
          />
        </div>
      </section>
    </Layout>
  );
}
