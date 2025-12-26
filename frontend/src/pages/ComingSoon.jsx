import { Link } from "react-router-dom";

export default function ComingSoon({ title = "Em breve" }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto" }}>
      <h1>{title}</h1>
      <p>Esta área já está preparada como rota protegida para o e-commerce.</p>
      <p>
        <Link to="/me">Voltar</Link>
      </p>
    </div>
  );
}

