import { Link } from "react-router-dom";

export default function CheckoutPending() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Pagamento pendente</h1>
      <p style={{ color: "#666" }}>
        Seu pagamento está pendente de confirmação pelo Mercado Pago. Assim que houver atualização, vamos refletir o status
        aqui.
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/" style={{ textDecoration: "underline" }}>
          Voltar para a loja
        </Link>
        <Link to="/cart" style={{ textDecoration: "underline" }}>
          Ver carrinho
        </Link>
      </div>
    </div>
  );
}

