import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import {
  EXPENSE_LABEL,
  STATUS_LABEL,
  type ExpenseCategory,
  type OrderStatus,
  type ReportsOverview,
} from "../types";

export function ReportsPage() {
  const { token } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ReportsOverview>("/reports/overview", {
        token,
        query: {
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
        },
      });
      setOverview(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить отчёт");
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>Отчёты руководителя</h1>
      </div>

      <div className="filters">
        <div className="field">
          <label>С</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>По</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="field">
          <label>&nbsp;</label>
          <button className="btn" onClick={load}>
            Применить
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}

      {overview ? (
        <>
          <div className="stat-grid">
            <Stat label="Всего заявок" value={overview.orders.total} />
            <Stat label="Сумма заявок" value={overview.orders.totalAmount} />
            <Stat label="Оплачено" value={overview.orders.paidAmount} />
            <Stat label="Долг по заявкам" value={overview.orders.outstanding} />
            <Stat label="Касса: приход" value={overview.cash.income} color="var(--success)" />
            <Stat label="Касса: расход" value={overview.cash.expense} color="var(--danger)" />
            <Stat label="Остаток кассы" value={overview.cash.balance} />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>По статусам</h3>
            <table className="table" style={{ border: "none" }}>
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Кол-во</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(overview.orders.byStatus) as OrderStatus[]).map((s) => (
                  <tr key={s}>
                    <td>{STATUS_LABEL[s]}</td>
                    <td>{overview.orders.byStatus[s]}</td>
                    <td>{overview.orders.amountByStatus[s]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(overview.cash.expenseByCategory).length > 0 ? (
            <div className="card">
              <h3 style={{ margin: 0, marginBottom: 8 }}>Расходы по категориям</h3>
              <table className="table" style={{ border: "none" }}>
                <thead>
                  <tr>
                    <th>Категория</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(overview.cash.expenseByCategory).map(([cat, amount]) => (
                    <tr key={cat}>
                      <td>{EXPENSE_LABEL[cat as ExpenseCategory]}</td>
                      <td>{amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
