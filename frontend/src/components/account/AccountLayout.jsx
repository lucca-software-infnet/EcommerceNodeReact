import "./AccountLayout.css";
import AccountSidebar from "./AccountSidebar.jsx";

export default function AccountLayout({
  children,
  activeSection,
  onSelectSection,
  user,
  onLogout,
}) {
  return (
    <div className="accountLayout">
      <aside className="accountLayout__sidebar" aria-label="Menu da conta">
        <AccountSidebar
          user={user}
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          onLogout={onLogout}
        />
      </aside>

      <main className="accountLayout__main" aria-label="Conteúdo da conta">
        <div className="accountLayout__mainInner">{children}</div>
      </main>
    </div>
  );
}

