import { useEffect, useMemo, useRef, useState } from "react";

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
  if (String(url).startsWith("/uploads/")) return String(url);
  return String(url);
}

export default function ProdutoForm({
  mode,
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

  const [selectedFiles, setSelectedFiles] = useState([]);
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
      return merged.slice(0, 5);
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
      codigoBarra: asString(values.codigoBarra).trim(),
      descricao: asString(values.descricao).trim(),
      departamento: asString(values.departamento).trim(),
      marca: asString(values.marca).trim() || null,
      validade: values.validade ? new Date(values.validade).toISOString() : null,
      volume: Number(values.volume),
      ...(values.quantidade === "" ? {} : { quantidade: Number(values.quantidade) }),
      precoCusto: asString(values.precoCusto).trim(),
      precoVenda: asString(values.precoVenda).trim(),
    };

    await onSubmit({ produtoPayload: payload, imagens: selectedFiles });
  };

  return (

    <div style={{ width: "100%" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* FORMULÁRIO EM GRID ORGANIZADO */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "20px" 
        }}>
          
          {/* Coluna 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Código de Barras */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Código de barras <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.codigoBarra}
                onChange={update("codigoBarra")}
                placeholder="Ex: 789..."
                required
                disabled={isBusy}
              />
            </div>

            {/* Departamento */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Departamento <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.departamento}
                onChange={update("departamento")}
                placeholder="Ex: Bebidas"
                required
                disabled={isBusy}
              />
            </div>

            {/* Volume */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Volume <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                inputMode="numeric"
                value={asIntOrEmpty(values.volume)}
                onChange={update("volume")}
                placeholder="Ex: 1000"
                required
                disabled={isBusy}
              />
            </div>

            {/* Preço de Custo */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Preço de custo <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.precoCusto}
                onChange={update("precoCusto")}
                placeholder="Ex: 10.50"
                required
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Coluna 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Marca */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Marca (opcional)
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.marca}
                onChange={update("marca")}
                placeholder="Ex: MinhaMarca"
                disabled={isBusy}
              />
            </div>

            {/* Validade */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Validade (opcional)
              </label>
              <input
                type="date"
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.validade}
                onChange={update("validade")}
                disabled={isBusy}
              />
            </div>

            {/* Quantidade */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Quantidade {isEdit ? "" : "(opcional)"}
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                inputMode="numeric"
                value={asIntOrEmpty(values.quantidade)}
                onChange={update("quantidade")}
                placeholder={isEdit ? "Ex: 10" : "Deixe vazio para iniciar com 0"}
                disabled={isBusy}
              />
            </div>

            {/* Preço de Venda */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#2c3e50", 
                fontWeight: "600", 
                fontSize: "14px" 
              }}>
                Preço de venda <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 14px",
                  border: "1.5px solid rgba(44, 62, 80, 0.16)",
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box"
                }}
                value={values.precoVenda}
                onChange={update("precoVenda")}
                placeholder="Ex: 12.90"
                required
                disabled={isBusy}
              />
            </div>
          </div>
        </div>

        {/* Descrição (full width) */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            color: "#2c3e50", 
            fontWeight: "600", 
            fontSize: "14px" 
          }}>
            Descrição <span style={{ color: "#e74c3c" }}>*</span>
          </label>
          <input
            style={{
              width: "100%",
              height: "48px",
              padding: "0 14px",
              border: "1.5px solid rgba(44, 62, 80, 0.16)",
              borderRadius: "8px",
              fontSize: "15px",
              boxSizing: "border-box"
            }}
            value={values.descricao}
            onChange={update("descricao")}
            placeholder="Descrição do produto"
            required
            disabled={isBusy}
          />
        </div>

        {/* Seção de Imagens */}
        <div style={{ 
          marginTop: "30px", 
          paddingTop: "20px", 
          borderTop: "1px solid rgba(44, 62, 80, 0.1)" 
        }}>
          <h3 style={{ 
            color: "#2c3e50", 
            fontSize: "18px", 
            fontWeight: "bold", 
            marginBottom: "16px" 
          }}>
            Imagens do Produto
          </h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            disabled={isBusy}
            style={{
              width: "100%",
              height: "48px",
              padding: "0 14px",
              border: "1.5px dashed #3498db",
              borderRadius: "8px",
              background: "rgba(52, 152, 219, 0.05)",
              fontSize: "15px",
              boxSizing: "border-box"
            }}
          />
          
          <div style={{ 
            color: "#7f8c8d", 
            fontSize: "13px", 
            marginTop: "8px" 
          }}>
            Máximo 5 imagens por envio. Tipos permitidos: JPG, PNG, WebP.
          </div>

          {/* Preview de imagens */}
          {previews.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ 
                color: "#2c3e50", 
                fontSize: "16px", 
                fontWeight: "bold", 
                marginBottom: "12px" 
              }}>
                Pré-visualização
              </h4>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
                gap: "12px" 
              }}>
                {previews.map((p, idx) => (
                  <div key={`${p.file.name}-${idx}`} style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "white"
                  }}>
                    <div style={{ 
                      width: "100%", 
                      height: "120px", 
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa"
                    }}>
                      <img 
                        src={p.url} 
                        alt={p.file.name} 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover" 
                        }}
                      />
                    </div>
                    <div style={{ padding: "10px" }}>
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#2c3e50", 
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {p.file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFileAt(idx)}
                        disabled={isBusy}
                        style={{
                          width: "100%",
                          marginTop: "8px",
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          background: "#ffebee",
                          color: "#e74c3c",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: "12px", 
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(44, 62, 80, 0.1)"
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            style={{
              minWidth: "120px",
              height: "48px",
              padding: "0 20px",
              border: "1.5px solid #ccc",
              borderRadius: "8px",
              background: "white",
              color: "#2c3e50",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy}
            style={{
              minWidth: "140px",
              height: "48px",
              padding: "0 20px",
              border: "none",
              borderRadius: "8px",
              background: "#3498db",
              color: "white",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {isBusy ? "Salvando..." : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}