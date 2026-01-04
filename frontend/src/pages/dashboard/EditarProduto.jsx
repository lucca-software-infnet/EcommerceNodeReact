import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header.jsx";
import { api } from "../../api/client.js";
import "../account/Account.css";
import ProdutoForm from "./produtos/ProdutoForm.jsx";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function EditarProduto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [produto, setProduto] = useState(null);

  const produtoId = useMemo(() => Number(id), [id]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setNotice({ type: "", message: "" });
    try {
      const res = await api.get(`/produtos/${produtoId}`);
      setProduto(res?.data?.data || null);
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao carregar produto") });
    } finally {
      setIsLoading(false);
    }
  }, [produtoId]);

  useEffect(() => {
    if (!Number.isFinite(produtoId)) return;
    load();
  }, [produtoId, load]);

  const handleUpdate = useCallback(
    async ({ produtoPayload, imagens }) => {
      setIsBusy(true);
      setNotice({ type: "", message: "" });
      try {
        await api.put(`/produtos/${produtoId}`, produtoPayload);

        // Endpoint existente apenas para ADICIONAR imagens ao produto
        if (imagens?.length) {
          const fd = new FormData();
          imagens.slice(0, 5).forEach((file) => fd.append("files", file));
          await api.post(`/produtos/${produtoId}/imagens`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        setNotice({ type: "success", message: "Produto atualizado com sucesso." });
        await load();
      } catch (err) {
        setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao atualizar produto") });
      } finally {
        setIsBusy(false);
      }
    },
    [produtoId, load]
  );

  const initialValues = useMemo(() => {
    if (!produto) return null;
    return {
      codigoBarra: produto.codigoBarra ?? "",
      descricao: produto.descricao ?? "",
      validade: toDateInputValue(produto.validade),
      volume: produto.volume ?? "",
      quantidade: produto.quantidade ?? "",
      precoCusto: produto.precoCusto ?? "",
      precoVenda: produto.precoVenda ?? "",
      marca: produto.marca ?? "",
      departamento: produto.departamento ?? "",
    };
  }, [produto]);

  return (
    <div className="account">
      <Header />

      <main className="account__main">
        <div className="account-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 18, fontWeight: 900 }}>Editar Produto</h1>
            <Link className="account-link" to="/dashboard/produtos" style={{ maxWidth: 220 }}>
              Voltar <span className="account-link__chev">›</span>
            </Link>
          </div>

          {notice?.message ? (
            <div style={{ marginTop: 12, color: notice.type === "error" ? "crimson" : "#2c3e50", fontWeight: 800 }}>
              {notice.message}
            </div>
          ) : null}

          {isLoading ? (
            <div style={{ marginTop: 14 }}>
              <p>Carregando produto...</p>
            </div>
          ) : !produto ? (
            <div style={{ marginTop: 14 }}>
              <p style={{ color: "crimson", fontWeight: 800 }}>Produto não encontrado.</p>
              <p style={{ margin: "10px 0 0" }}>
                <button type="button" className="shop-header__loginBtn" onClick={() => navigate("/dashboard/produtos")}>
                  Ir para Dashboard
                </button>
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 14 }}>
              <ProdutoForm
                key={produtoId}
                mode="edit"
                isBusy={isBusy}
                initialValues={initialValues}
                existingImages={produto.imagens || []}
                onSubmit={handleUpdate}
                onCancel={() => navigate("/dashboard/produtos")}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

