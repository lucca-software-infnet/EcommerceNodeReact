import { Link } from "react-router-dom";

export default function CheckoutSuccess() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h1>Pagamento aprovado</h1>
      <p style={{ color: "#666" }}>
        Seu pagamento foi aprovado pelo Mercado Pago. Em breve vamos confirmar os detalhes do pedido.
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

