import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client.js";
import "./ProductsSection.css";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(String(value).replace(",", ".")) : Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(2);
}

/**
 🔥 NORMALIZA QUALQUER RESPOSTA DO BACKEND
 Aceita:
 - []
 - {data:[]}
 - {success:true,data:[]}
 - {data:{...}}
 - objeto direto
*/
function normalizeListResponse(res) {
  const body = res?.data;

  if (!body) return [];

  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;

  if (body.data && typeof body.data === "object") {
    return [body.data];
  }

  if (typeof body === "object") {
    return [body];
  }

  return [];
}

function AccordionItem({ title, isOpen, onToggle, children, defaultId }) {
  return (
    <section className={`accItem ${isOpen ? "accItem--open" : ""}`} aria-label={title}>
      <button type="button" className="accBtn" onClick={onToggle} aria-expanded={isOpen} aria-controls={defaultId}>
        <span className="accBtn__title">{title}</span>
        <span className="accBtn__icon">{isOpen ? "–" : "+"}</span>
      </button>

      <div id={defaultId} className="accPanel">
        <div className="accPanel__inner">{children}</div>
      </div>
    </section>
  );
}

export default function ProductsSection() {
  const navigate = useNavigate();

  const [notice, setNotice] = useState({ type: "", message: "" });

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [produtos, setProdutos] = useState([]);

  /**
   🔥 FETCH PROFISSIONAL
   - tenta /produtos
   - fallback vendedor
   - normaliza resposta
  */
  const fetchProdutos = useCallback(async () => {
    setIsLoadingList(true);
    setNotice({ type: "", message: "" });

    try {
      let res;

      try {
        res = await api.get("/produtos");
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await api.get("/produtos/vendedor/meus");
        } else {
          throw err;
        }
      }

      const lista = normalizeListResponse(res);

      console.log("PRODUTOS NORMALIZADOS:", lista); // 👈 pode remover depois

      setProdutos(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao carregar produtos") });
      setProdutos([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  /**
   🔥 CARREGA AUTOMATICAMENTE AO ABRIR A TELA
  */
  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;

    try {
      await api.delete(`/produtos/${id}`);

      setProdutos((prev) => prev.filter((p) => p?.id !== id));

      setNotice({ type: "success", message: "Produto excluído com sucesso." });
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao excluir produto") });
    }
  };

  const handleEdit = (id) => {
    navigate(`/account/edit-product/${id}`);
  };

  return (
    <section className="productsSection">
      <div className="productsSection__header">
        <h1 className="productsSection__title">Gerenciamento de Produtos</h1>

        <button onClick={fetchProdutos} disabled={isLoadingList}>
          Atualizar
        </button>
      </div>

      {notice?.message && (
        <div className={`productsSection__notice ${notice.type === "error" ? "productsSection__notice--error" : ""}`}>
          {notice.message}
        </div>
      )}

      {/* LISTA DIRETA — sem depender de accordion */}
      <div className="tableWrap">
        {isLoadingList && <div>Carregando produtos...</div>}

        {!isLoadingList && (!Array.isArray(produtos) || produtos.length === 0) && (
          <div>Nenhum produto encontrado.</div>
        )}

        {Array.isArray(produtos) && produtos.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Marca</th>
                <th>Preço Venda</th>
                <th>Estoque</th>
                <th>Departamento</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigoBarra}</td>
                  <td>{p.descricao}</td>
                  <td>{p.marca || "-"}</td>
                  <td>{formatMoney(p.precoVenda)}</td>
                  <td>{p.quantidade ?? 0}</td>
                  <td>{p.departamento}</td>

                  <td>
                    <button onClick={() => handleEdit(p.id)}>Editar</button>

                    <button onClick={() => handleDelete(p.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
