import { useEffect, useMemo, useRef, useState } from "react";
import "../../../pages/Home.css";
import "../../../styles/Login.css";

function asIntOrEmpty(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return String(Math.trunc(n));
}

function asString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function resolveUploadUrl(url) {
  if (!url) return "";
  if (String(url).startsWith("http://") || String(url).startsWith("https://")) return String(url);
  // Preferimos usar proxy do Vite (/uploads -> backend)
  if (String(url).startsWith("/uploads/")) return String(url);
  return String(url);
}

export default function ProdutoForm({
  mode, // create | edit
  isBusy,
  initialValues,
  existingImages = [],
  onSubmit,
  onCancel,
}) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState(() => ({
    codigoBarra: initialValues?.codigoBarra ?? "",
    descricao: initialValues?.descricao ?? "",
    validade: initialValues?.validade ?? "",
    volume: initialValues?.volume ?? "",
    quantidade: initialValues?.quantidade ?? "",
    precoCusto: initialValues?.precoCusto ?? "",
    precoVenda: initialValues?.precoVenda ?? "",
    marca: initialValues?.marca ?? "",
    departamento: initialValues?.departamento ?? "",
  }));

  const [selectedFiles, setSelectedFiles] = useState([]); // File[]
  const fileInputRef = useRef(null);

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const update = (field) => (e) => {
    const next = e.target.value;
    setValues((v) => ({ ...v, [field]: next }));
  };

  const addFiles = (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...files];
      return merged.slice(0, 5); // requisito: máximo 5
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof onSubmit !== "function") return;

    const payload = {
      // Produto (schema.prisma)
      codigoBarra: asString(values.codigoBarra).trim(),
      descricao: asString(values.descricao).trim(),
      departamento: asString(values.departamento).trim(),
      marca: asString(values.marca).trim() || null,
      validade: values.validade ? new Date(values.validade).toISOString() : null,
      volume: Number(values.volume),
      // quantidade é opcional no create (default 0); no edit pode ser alterada.
      ...(values.quantidade === "" ? {} : { quantidade: Number(values.quantidade) }),
      precoCusto: asString(values.precoCusto).trim(),
      precoVenda: asString(values.precoVenda).trim(),
    };

    await onSubmit({ produtoPayload: payload, imagens: selectedFiles });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="form-group">
          <label>Código de barras (codigoBarra)</label>
          <input value={values.codigoBarra} onChange={update("codigoBarra")} placeholder="Ex: 789..." required />
        </div>

        <div className="form-group">
          <label>Departamento (departamento)</label>
          <input value={values.departamento} onChange={update("departamento")} placeholder="Ex: Bebidas" required />
        </div>

        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Descrição (descricao)</label>
          <input value={values.descricao} onChange={update("descricao")} placeholder="Descrição do produto" required />
        </div>

        <div className="form-group">
          <label>Marca (marca) (opcional)</label>
          <input value={values.marca} onChange={update("marca")} placeholder="Ex: MinhaMarca" />
        </div>

        <div className="form-group">
          <label>Validade (validade) (opcional)</label>
          <input type="date" value={values.validade} onChange={update("validade")} />
        </div>

        <div className="form-group">
          <label>Volume (volume)</label>
          <input
            inputMode="numeric"
            value={asIntOrEmpty(values.volume)}
            onChange={update("volume")}
            placeholder="Ex: 1000"
            required
          />
        </div>

        <div className="form-group">
          <label>Quantidade (quantidade) {isEdit ? "" : "(opcional)"}</label>
          <input
            inputMode="numeric"
            value={asIntOrEmpty(values.quantidade)}
            onChange={update("quantidade")}
            placeholder={isEdit ? "Ex: 10" : "Deixe vazio para iniciar com 0"}
          />
        </div>

        <div className="form-group">
          <label>Preço de custo (precoCusto)</label>
          <input value={values.precoCusto} onChange={update("precoCusto")} placeholder="Ex: 10.50" required />
        </div>

        <div className="form-group">
          <label>Preço de venda (precoVenda)</label>
          <input value={values.precoVenda} onChange={update("precoVenda")} placeholder="Ex: 12.90" required />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, color: "#2c3e50" }}>Imagens (ImagemProduto)</div>
        <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            disabled={isBusy}
          />
          <div style={{ color: "#7f8c8d", fontWeight: 700, fontSize: 13 }}>
            Máximo 5 imagens por envio. Tipos: JPG/PNG/WebP.
          </div>
        </div>

        {isEdit && existingImages?.length ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: "#2c3e50", fontWeight: 900, marginBottom: 10 }}>Imagens existentes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
              {existingImages.map((img) => (
                <div key={img.id} className="product-card">
                  <div className="product-card__imgWrap">
                    <img
                      className="product-card__img"
                      src={resolveUploadUrl(img.url)}
                      alt={img.nomeArquivo || `Imagem ${img.id}`}
                      style={{ height: 110 }}
                    />
                  </div>
                  <div className="product-card__body" style={{ padding: 10 }}>
                    <div className="product-card__name" style={{ WebkitLineClamp: 1, minHeight: "auto" }}>
                      {img.nomeArquivo}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, color: "#7f8c8d", fontWeight: 700, fontSize: 13 }}>
              Observação: o backend atual possui endpoint apenas para <strong>adicionar</strong> imagens (`POST /produtos/:id/imagens`).
            </div>
          </div>
        ) : null}

        {previews?.length ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ color: "#2c3e50", fontWeight: 900, marginBottom: 10 }}>Pré-visualização (novo envio)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
              {previews.map((p, idx) => (
                <div key={`${p.file.name}-${idx}`} className="product-card">
                  <div className="product-card__imgWrap">
                    <img className="product-card__img" src={p.url} alt={p.file.name} style={{ height: 110 }} />
                  </div>
                  <div className="product-card__body" style={{ padding: 10 }}>
                    <div className="product-card__name" style={{ WebkitLineClamp: 1, minHeight: "auto" }}>
                      {p.file.name}
                    </div>
                  </div>
                  <div className="product-card__footer" style={{ padding: 10 }}>
                    <button type="button" className="hero__ctrlBtn" onClick={() => removeFileAt(idx)} aria-label="Remover imagem">
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" className="product-card__btn" onClick={onCancel} disabled={isBusy} style={{ width: 160 }}>
          Cancelar
        </button>
        <button type="submit" className="shop-header__loginBtn" disabled={isBusy} style={{ width: 180, height: 44 }}>
          Salvar
        </button>
      </div>
    </form>
  );
}

