import { Link } from "react-router-dom";

export default function CheckoutFailure() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Pagamento não concluído</h1>
      <p style={{ color: "#666" }}>
        Não foi possível concluir o pagamento no Mercado Pago. Você pode tentar novamente.
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/cart" style={{ textDecoration: "underline" }}>
          Voltar ao carrinho
        </Link>
        <Link to="/" style={{ textDecoration: "underline" }}>
          Ir para a loja
        </Link>
      </div>
    </div>
  );
}

