import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../../components/Header.jsx";
import { api } from "../../api/client.js";
import "../account/Account.css";
import ProdutoForm from "./produtos/ProdutoForm.jsx";
import ProdutosList from "./produtos/ProdutosList.jsx";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

export default function DashboardProdutos() {
  const navigate = useNavigate();
  const [active, setActive] = useState("add"); // add | list
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [produtos, setProdutos] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const fetchProdutos = useCallback(async () => {
    setIsLoadingList(true);
    setNotice({ type: "", message: "" });
    try {
      // Endpoint real para "meus produtos" (dashboard)
      const res = await api.get("/produtos/vendedor/meus");
      setProdutos(res?.data?.data || []);
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao carregar produtos") });
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (active !== "list") return;
    fetchProdutos();
  }, [active, fetchProdutos]);

  const sidebarItems = useMemo(
    () => [
      { label: "Minhas Compras", to: "/orders" },
      { label: "Minhas Vendas", to: "/sales" },
      { label: "Configurações", to: "/settings" },
      { label: "Ajuda", to: "/help" },
    ],
    []
  );

  const handleCreate = useCallback(
    async ({ produtoPayload, imagens }) => {
      setIsBusy(true);
      setNotice({ type: "", message: "" });
      try {
        const created = await api.post("/produtos", produtoPayload);
        const produtoId = created?.data?.data?.id;

        // Upload de imagens (tabela ImagemProduto) via endpoint existente
        if (produtoId && imagens?.length) {
          const fd = new FormData();
          imagens.slice(0, 5).forEach((file) => fd.append("files", file));
          await api.post(`/produtos/${produtoId}/imagens`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        setNotice({ type: "success", message: "Produto salvo com sucesso." });
        setActive("list");
      } catch (err) {
        setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao salvar produto") });
      } finally {
        setIsBusy(false);
      }
    },
    [setActive]
  );

  const handleDelete = useCallback(
    async (id) => {
      const ok = window.confirm("Deseja realmente excluir este produto?");
      if (!ok) return;
      setNotice({ type: "", message: "" });
      try {
        await api.delete(`/produtos/${id}`);
        setProdutos((prev) => prev.filter((p) => p?.id !== id));
        setNotice({ type: "success", message: "Produto excluído com sucesso." });
      } catch (err) {
        setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao excluir produto") });
      }
    },
    [setProdutos]
  );

  return (
    <div className="account">
      <Header />

      <main className="account__main">
        <div className="account__grid">
          {/* Sidebar */}
          <aside
            className="account-card"
            style={{ position: "sticky", top: 76, alignSelf: "start", height: "fit-content" }}
            aria-label="Menu do dashboard"
          >
            <h2 className="account-links__title" style={{ marginBottom: 10 }}>
              Dashboard
            </h2>

            <nav className="account-links" aria-label="Atalhos">
              {sidebarItems.map((it) => (
                <Link key={it.to} className="account-link" to={it.to}>
                  {it.label} <span className="account-link__chev">›</span>
                </Link>
              ))}

              {/* Accordion Produtos */}
              <div className="account-card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900, color: "#2c3e50" }}>Produtos</div>
                  <span style={{ color: "rgba(44, 62, 80, 0.55)", fontWeight: 900 }}>▾</span>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <button
                    type="button"
                    className="product-card__btn"
                    onClick={() => setActive("add")}
                    aria-pressed={active === "add"}
                    style={{ background: active === "add" ? "rgba(52, 152, 219, 0.18)" : undefined }}
                  >
                    Adicionar Produto
                  </button>
                  <button
                    type="button"
                    className="product-card__btn"
                    onClick={() => setActive("list")}
                    aria-pressed={active === "list"}
                    style={{ background: active === "list" ? "rgba(52, 152, 219, 0.18)" : undefined }}
                  >
                    Mostrar Produtos
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          {/* Conteúdo */}
          <section className="account-card" aria-label="Conteúdo do dashboard">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h1 style={{ margin: 0, color: "#2c3e50", fontSize: 18, fontWeight: 900 }}>
                {active === "add" ? "Adicionar Produto" : "Mostrar Produtos"}
              </h1>

              {active === "list" ? (
                <button type="button" className="shop-header__loginBtn" onClick={() => fetchProdutos()} disabled={isLoadingList}>
                  Atualizar
                </button>
              ) : null}
            </div>

            {notice?.message ? (
              <div style={{ marginTop: 12, color: notice.type === "error" ? "crimson" : "#2c3e50", fontWeight: 800 }}>
                {notice.message}
              </div>
            ) : null}

            {active === "add" ? (
              <div style={{ marginTop: 14 }}>
                <ProdutoForm mode="create" isBusy={isBusy} onSubmit={handleCreate} onCancel={() => navigate("/dashboard/produtos")} />
              </div>
            ) : (
              <div style={{ marginTop: 14 }}>
                <ProdutosList
                  produtos={produtos}
                  isLoading={isLoadingList}
                  onEdit={(id) => navigate(`/dashboard/produtos/editar/${id}`)}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

