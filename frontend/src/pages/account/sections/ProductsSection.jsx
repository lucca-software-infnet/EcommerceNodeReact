import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client.js";
import "./ProductsSection.css";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(String(value).replace(",", ".")) : Number(value);
  if (!Number.isFinite(num)) return String(value);
  return num.toFixed(2);
}

function normalizeListResponse(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function asNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
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

  const [open, setOpen] = useState({ add: true, list: false });

  const [notice, setNotice] = useState({ type: "", message: "" });
  const [isBusy, setIsBusy] = useState(false);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const [values, setValues] = useState(() => ({
    codigoBarra: "",
    descricao: "",
    validade: "",
    volume: "",
    quantidade: "",
    marca: "",
    precoCusto: "",
    precoVenda: "",
    departamento: "",
  }));

  const departamentoOptions = useMemo(
    () => [
      { value: "", label: "Selecione..." },
      { value: "Bebidas", label: "Bebidas" },
      { value: "Alimentos", label: "Alimentos" },
      { value: "Higiene", label: "Higiene" },
      { value: "Limpeza", label: "Limpeza" },
      { value: "Pet", label: "Pet" },
      { value: "Outros", label: "Outros" },
    ],
    []
  );

  const update = (field) => (e) => {
    const next = e.target.value;
    setValues((v) => ({ ...v, [field]: next }));
  };

  const fetchProdutos = useCallback(async () => {
    setIsLoadingList(true);
    setNotice({ type: "", message: "" });
    try {
      try {
        const res = await api.get("/produtos");
        setProdutos(normalizeListResponse(res));
      } catch (err) {
        // fallback compatível com o backend já usado no projeto
        if (err?.response?.status === 404) {
          const res2 = await api.get("/produtos/vendedor/meus");
          setProdutos(normalizeListResponse(res2));
        } else {
          throw err;
        }
      }
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao carregar produtos") });
      setProdutos([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!open.list) return;
    fetchProdutos();
  }, [open.list, fetchProdutos]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsBusy(true);
    setNotice({ type: "", message: "" });
    try {
      const payload = {
        codigoBarra: String(values.codigoBarra).trim(),
        descricao: String(values.descricao).trim(),
        validade: values.validade ? new Date(values.validade).toISOString() : null,
        volume: asNumberOrNull(values.volume) ?? 0,
        quantidade: asNumberOrNull(values.quantidade) ?? 0,
        marca: String(values.marca).trim() || null,
        precoCusto: String(values.precoCusto).trim(),
        precoVenda: String(values.precoVenda).trim(),
        departamento: String(values.departamento).trim(),
      };

      await api.post("/produtos", payload);
      setNotice({ type: "success", message: "Produto salvo com sucesso." });
      setValues({
        codigoBarra: "",
        descricao: "",
        validade: "",
        volume: "",
        quantidade: "",
        marca: "",
        precoCusto: "",
        precoVenda: "",
        departamento: "",
      });

      setOpen({ add: false, list: true });
      await fetchProdutos();
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao salvar produto") });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (id) => {
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
  };

  const handleEdit = (id) => {
    navigate(`/account/edit-product/${id}`);
  };

  return (
    <section className="productsSection" aria-label="Gerenciamento de Produtos">
      <div className="productsSection__header">
        <h1 className="productsSection__title">Gerenciamento de Produtos</h1>
        {open.list ? (
          <button type="button" className="productsSection__refresh" onClick={fetchProdutos} disabled={isLoadingList}>
            Atualizar
          </button>
        ) : null}
      </div>

      {notice?.message ? (
        <div className={`productsSection__notice ${notice.type === "error" ? "productsSection__notice--error" : ""}`}>
          {notice.message}
        </div>
      ) : null}

      <div className="acc" role="region" aria-label="Opções de produtos">
        <AccordionItem
          title="📦 Adicionar Produto"
          isOpen={open.add}
          onToggle={() => setOpen((s) => ({ add: !s.add, list: s.add ? s.list : false }))}
          defaultId="acc-add"
        >
          <form className="productForm" onSubmit={handleCreate}>
            <div className="productForm__grid">
              <div className="field">
                <label className="field__label">Código de barras</label>
                <input className="field__input" value={values.codigoBarra} onChange={update("codigoBarra")} required />
              </div>

              <div className="field">
                <label className="field__label">Departamento</label>
                <select className="field__input" value={values.departamento} onChange={update("departamento")} required>
                  {departamentoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field--full">
                <label className="field__label">Descrição</label>
                <input className="field__input" value={values.descricao} onChange={update("descricao")} required />
              </div>

              <div className="field">
                <label className="field__label">Marca</label>
                <input className="field__input" value={values.marca} onChange={update("marca")} />
              </div>

              <div className="field">
                <label className="field__label">Validade</label>
                <input className="field__input" type="date" value={values.validade} onChange={update("validade")} />
              </div>

              <div className="field">
                <label className="field__label">Volume</label>
                <input className="field__input" inputMode="numeric" value={values.volume} onChange={update("volume")} required />
              </div>

              <div className="field">
                <label className="field__label">Quantidade</label>
                <input className="field__input" inputMode="numeric" value={values.quantidade} onChange={update("quantidade")} required />
              </div>

              <div className="field">
                <label className="field__label">Preço Custo</label>
                <input className="field__input" value={values.precoCusto} onChange={update("precoCusto")} required />
              </div>

              <div className="field">
                <label className="field__label">Preço Venda</label>
                <input className="field__input" value={values.precoVenda} onChange={update("precoVenda")} required />
              </div>
            </div>

            <div className="productForm__actions">
              <button type="submit" className="productForm__primary" disabled={isBusy}>
                Salvar Produto
              </button>
            </div>
          </form>
        </AccordionItem>

        <AccordionItem
          title="📋 Mostrar Produtos"
          isOpen={open.list}
          onToggle={() => setOpen((s) => ({ add: s.list ? s.add : false, list: !s.list }))}
          defaultId="acc-list"
        >
          <div className="tableWrap">
            {isLoadingList ? <div className="tableWrap__loading">Carregando...</div> : null}

            {!isLoadingList && !produtos.length ? (
              <div className="tableWrap__empty">Nenhum produto encontrado.</div>
            ) : null}

            {produtos.length ? (
              <div className="tableScroll" role="region" aria-label="Tabela de produtos">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descrição</th>
                      <th>Marca</th>
                      <th>Preço Custo</th>
                      <th>Preço Venda</th>
                      <th>Validade</th>
                      <th>Estoque</th>
                      <th>Volume</th>
                      <th>Quantidade</th>
                      <th>Departamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map((p) => {
                      const estoque = p?.estoque ?? p?.quantidade ?? 0;
                      const quantidade = p?.quantidade ?? 0;
                      return (
                        <tr key={p?.id ?? p?.codigoBarra}>
                          <td className="td--mono">{p?.codigoBarra ?? "-"}</td>
                          <td className="td--strong">{p?.descricao ?? "-"}</td>
                          <td>{p?.marca || "-"}</td>
                          <td className="td--money">{formatMoney(p?.precoCusto)}</td>
                          <td className="td--money">{formatMoney(p?.precoVenda)}</td>
                          <td>{toDateInputValue(p?.validade) ? new Date(p.validade).toLocaleDateString() : "-"}</td>
                          <td>{estoque}</td>
                          <td>{p?.volume ?? "-"}</td>
                          <td>{quantidade}</td>
                          <td>{p?.departamento ?? "-"}</td>
                          <td>
                            <div className="rowActions">
                              <button type="button" className="rowActions__btn" onClick={() => handleEdit(p?.id)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className="rowActions__btn rowActions__btn--danger"
                                onClick={() => handleDelete(p?.id)}
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
        </AccordionItem>
      </div>
    </section>
  );
}

