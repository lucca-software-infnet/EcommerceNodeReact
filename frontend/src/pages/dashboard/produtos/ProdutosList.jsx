import "../../../pages/Home.css";

function toShortDate(value) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  const num = typeof value === "string" ? Number(String(value).replace(",", ".")) : Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(2);
}

export default function ProdutosList({ produtos, isLoading, onEdit, onDelete }) {
  const rows = Array.isArray(produtos) ? produtos : [];

  return (
    <div>
      {isLoading ? <p>Carregando...</p> : null}

      {!isLoading && !rows.length ? (
        <p style={{ color: "#7f8c8d", fontWeight: 700, margin: 0 }}>Nenhum produto encontrado.</p>
      ) : null}

      {rows.length ? (
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>Thumb</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>id</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>codigoBarra</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>descricao</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>departamento</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>marca</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>validade</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>volume</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>quantidade</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>precoCusto</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>precoVenda</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>dataRegistro</th>
                <th style={{ padding: "10px 8px", color: "#2c3e50" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const thumb = p?.imagens?.[0]?.url || "";
                return (
                  <tr key={p?.id} style={{ borderTop: "1px solid rgba(44, 62, 80, 0.08)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p?.descricao || `Produto ${p?.id}`}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "1px solid rgba(44, 62, 80, 0.12)",
                            background: "#f5f5f5",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            border: "1px solid rgba(44, 62, 80, 0.12)",
                            background: "#f5f5f5",
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 800, color: "#2c3e50" }}>{p?.id}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50", fontWeight: 700 }}>{p?.codigoBarra}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{p?.descricao}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{p?.departamento}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{p?.marca || "-"}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{toShortDate(p?.validade)}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{p?.volume}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{p?.quantidade}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{formatMoney(p?.precoCusto)}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{formatMoney(p?.precoVenda)}</td>
                    <td style={{ padding: "10px 8px", color: "#2c3e50" }}>{toShortDate(p?.dataRegistro)}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="product-card__btn" onClick={() => onEdit?.(p?.id)} style={{ width: 110 }}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="product-card__btn"
                          onClick={() => onDelete?.(p?.id)}
                          style={{ width: 110, background: "rgba(231, 76, 60, 0.10)", color: "#c0392b" }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

