import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
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
    <div style={{ 
      padding: "20px", 
      minHeight: "100vh",
      backgroundColor: "#f6f8fc" 
    }}>
      <div style={{ 
        display: "flex", 
        gap: "20px", 
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {/* Sidebar */}
        <aside style={{ 
          width: "250px",
          flexShrink: 0,
          position: "sticky",
          top: "20px",
          alignSelf: "flex-start"
        }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#2c3e50", 
              fontSize: "18px", 
              fontWeight: "bold" 
            }}>
              Dashboard
            </h2>

            <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sidebarItems.map((it) => (
                <Link 
                  key={it.to} 
                  to={it.to}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#2c3e50",
                    fontWeight: "600",
                    backgroundColor: "rgba(52, 152, 219, 0.05)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(52, 152, 219, 0.1)"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(52, 152, 219, 0.05)"}
                >
                  {it.label}
                </Link>
              ))}

              {/* Seção Produtos */}
              <div style={{ 
                marginTop: "20px",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "rgba(52, 152, 219, 0.03)",
                border: "1px solid rgba(52, 152, 219, 0.1)"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: "12px" 
                }}>
                  <div style={{ 
                    fontWeight: "bold", 
                    color: "#2c3e50",
                    fontSize: "16px"
                  }}>
                    Produtos
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setActive("add")}
                    style={{
                      padding: "12px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: active === "add" ? "rgba(52, 152, 219, 0.2)" : "rgba(52, 152, 219, 0.1)",
                      color: "#2c3e50",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Adicionar Produto
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive("list")}
                    style={{
                      padding: "12px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: active === "list" ? "rgba(52, 152, 219, 0.2)" : "rgba(52, 152, 219, 0.1)",
                      color: "#2c3e50",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Meus Produtos
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            minHeight: "500px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(44, 62, 80, 0.1)"
            }}>
              <h1 style={{ 
                margin: 0, 
                color: "#2c3e50", 
                fontSize: "24px", 
                fontWeight: "bold" 
              }}>
                {active === "add" ? "Adicionar Novo Produto" : "Meus Produtos"}
              </h1>

              {active === "list" && (
                <button 
                  type="button" 
                  onClick={() => fetchProdutos()} 
                  disabled={isLoadingList}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#3498db",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  {isLoadingList ? "Carregando..." : "Atualizar"}
                </button>
              )}
            </div>

            {notice?.message && (
              <div style={{ 
                marginBottom: "20px",
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: notice.type === "error" ? "rgba(231, 76, 60, 0.1)" : "rgba(52, 152, 219, 0.1)",
                color: notice.type === "error" ? "#c0392b" : "#2c3e50",
                fontWeight: "600"
              }}>
                {notice.message}
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              {active === "add" ? (
                <ProdutoForm 
                  mode="create" 
                  isBusy={isBusy} 
                  onSubmit={handleCreate} 
                  onCancel={() => navigate("/dashboard/produtos")} 
                />
              ) : (
                <ProdutosList
                  produtos={produtos}
                  isLoading={isLoadingList}
                  onEdit={(id) => navigate(`/dashboard/produtos/editar/${id}`)}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}