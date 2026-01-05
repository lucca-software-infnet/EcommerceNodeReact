import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AccountLayout from "../../components/account/AccountLayout.jsx";
import ProductsSection from "./sections/ProductsSection.jsx";

function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(15, 23, 42, 0.08)",
        borderRadius: 16,
        boxShadow: "0 10px 20px rgba(15, 23, 42, 0.06)",
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 950 }}>{title}</h1>
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

export default function Me() {
  const { user, logout, isInitializing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialFromNav = useMemo(() => location?.state?.activeSection, [location?.state?.activeSection]);
  const [activeSection, setActiveSection] = useState(initialFromNav || "account");

  useEffect(() => {
    if (!initialFromNav) return;
    setActiveSection(initialFromNav);
    // limpa o state para não ficar “grudado” se o usuário navegar de novo
    navigate(location.pathname, { replace: true, state: {} });
  }, [initialFromNav, location.pathname, navigate]);

  const handleSelectSection = (key) => {
    // REGRA: trocar conteúdo à direita sem mudar rota (/account)
    setActiveSection(key);
  };

  return (
    <AccountLayout user={user} onLogout={logout} activeSection={activeSection} onSelectSection={handleSelectSection}>
      {isInitializing ? (
        <SectionCard title="Minha Conta">
          <div style={{ color: "#334155", fontWeight: 800 }}>Carregando sessão...</div>
        </SectionCard>
      ) : null}

      {!isInitializing && !user ? (
        <SectionCard title="Minha Conta">
          <div style={{ color: "crimson", fontWeight: 900 }}>Você não está logado.</div>
          <div style={{ marginTop: 10, color: "#334155" }}>
            Faça login para acessar sua área de conta.
          </div>
        </SectionCard>
      ) : null}

      {user && !isInitializing ? (
        <>
          {activeSection === "products" ? (
            <ProductsSection />
          ) : activeSection === "purchases" ? (
            <SectionCard title="Minhas Compras">
              <div style={{ color: "#334155", fontWeight: 700 }}>Em breve.</div>
            </SectionCard>
          ) : activeSection === "sales" ? (
            <SectionCard title="Minhas Vendas">
              <div style={{ color: "#334155", fontWeight: 700 }}>Em breve.</div>
            </SectionCard>
          ) : activeSection === "settings" ? (
            <SectionCard title="Configurações">
              <div style={{ color: "#334155", fontWeight: 700 }}>Em breve.</div>
            </SectionCard>
          ) : (
            <SectionCard title="Minha Conta">
              <div style={{ color: "#0f172a", fontWeight: 900 }}>Bem-vindo(a)!</div>
              <div style={{ marginTop: 10, color: "#334155", fontWeight: 700 }}>
                Use o menu à esquerda para navegar entre as seções da sua conta.
              </div>
            </SectionCard>
          )}
        </>
      ) : null}
    </AccountLayout>
  );
}

