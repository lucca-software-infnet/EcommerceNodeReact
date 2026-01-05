import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AccountLayout from "../../components/account/AccountLayout.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../api/client.js";
import "./EditProduct.css";

function getApiErrorMessage(err, fallback) {
  return err?.response?.data?.error || err?.response?.data?.erro || fallback || "Ocorreu um erro";
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function asNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const produtoId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }, [id]);

  const [notice, setNotice] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [produto, setProduto] = useState(null);

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

  const load = useCallback(async () => {
    setIsLoading(true);
    setNotice({ type: "", message: "" });
    try {
      const res = await api.get(`/produtos/${produtoId}`);
      const data = res?.data?.data ?? res?.data ?? null;
      setProduto(data);
    } catch (err) {
      setProduto(null);
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao carregar produto") });
    } finally {
      setIsLoading(false);
    }
  }, [produtoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!produto) return;
    setValues({
      codigoBarra: produto.codigoBarra ?? "",
      descricao: produto.descricao ?? "",
      validade: toDateInputValue(produto.validade),
      volume: produto.volume ?? "",
      quantidade: produto.quantidade ?? "",
      marca: produto.marca ?? "",
      precoCusto: produto.precoCusto ?? "",
      precoVenda: produto.precoVenda ?? "",
      departamento: produto.departamento ?? "",
    });
  }, [produto]);

  const update = (field) => (e) => {
    const next = e.target.value;
    setValues((v) => ({ ...v, [field]: next }));
  };

  const goBackToProducts = () => {
    navigate("/account?section=products");
  };

  const handleSelectSection = (key) => {
    // Na tela de edição, trocar seção significa voltar para /account e renderizar a seção à direita.
    navigate(`/account?section=${encodeURIComponent(key)}`);
  };

  const handleSubmit = async (e) => {
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

      await api.put(`/produtos/${produtoId}`, payload);
      setNotice({ type: "success", message: "Produto atualizado com sucesso." });
      goBackToProducts();
    } catch (err) {
      setNotice({ type: "error", message: getApiErrorMessage(err, "Falha ao atualizar produto") });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AccountLayout
      user={user}
      onLogout={logout}
      activeSection="products"
      onSelectSection={handleSelectSection}
    >
      <div className="editProduct">
        <div className="editProduct__head">
          <h1 className="editProduct__title">Editar Produto</h1>
          <div className="editProduct__headActions">
            <button type="button" className="editProduct__secondary" onClick={goBackToProducts}>
              Cancelar
            </button>
          </div>
        </div>

        {notice?.message ? (
          <div className={`editProduct__notice ${notice.type === "error" ? "editProduct__notice--error" : ""}`}>
            {notice.message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="editProduct__loading">Carregando produto...</div>
        ) : !produto ? (
          <div className="editProduct__empty">
            <div className="editProduct__emptyTitle">Produto não encontrado.</div>
            <button type="button" className="editProduct__secondary" onClick={goBackToProducts}>
              Voltar
            </button>
          </div>
        ) : (
          <form className="editProduct__form" onSubmit={handleSubmit}>
            <div className="editProduct__grid">
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
                <input
                  className="field__input"
                  inputMode="numeric"
                  value={values.quantidade}
                  onChange={update("quantidade")}
                  required
                />
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

            <div className="editProduct__actions">
              <button type="button" className="editProduct__secondary" onClick={goBackToProducts} disabled={isBusy}>
                Cancelar
              </button>
              <button type="submit" className="editProduct__primary" disabled={isBusy}>
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </AccountLayout>
  );
}

