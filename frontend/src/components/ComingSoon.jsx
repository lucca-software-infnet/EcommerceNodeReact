export default function ComingSoon({ title = "Em breve", description = null }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>{title}</h1>
      <p style={{ color: "#666" }}>
        {description || "Esta funcionalidade está sendo preparada para a versão do e-commerce."}
      </p>
    </div>
  );
}

