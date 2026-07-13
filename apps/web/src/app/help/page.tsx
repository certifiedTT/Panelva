"use client";

export default function HelpPage() {
  const faqs = [
    { q: "What is the 7-day drop schedule?", a: "To make story access fair, new chapters drop by one tier every 7 days (Premium -> Ad-supported -> Free). You can see the countdown timers showing exactly when a chapter will become free or ad-unlockable on the series page." },
    { q: "How do Creator/Collaboration splits work?", a: "Creators must agree on collaboration splits prior to publication. The platform retains a standard 25% cut of net earnings, and the rest is divided according to the creator agreements." },
    { q: "Why didn't my views increase after using a promo code?", a: "Admin-generated promotional subscription codes (Plus or Premium) are marked as 'promotional' subscriptions. To prevent promotional abuse, views by these users do not increment creator view counts, protecting creators' organic earnings based on paid views." },
    { q: "How are comments ordered?", a: "Comments are ordered by role ranks. Admin comments are rank 4, Creator comments are rank 3, Panelva Premium members are rank 2, Panelva Plus members are rank 1, and standard users are rank 0. This ensures high-value or staff comments are pinned to the top." }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Help <span style={{ color: "var(--secondary)" }}>Center</span>
          </h1>
          <p style={{ color: "var(--text-dark-muted)", fontSize: "1.1rem" }}>
            Find answers to frequently asked questions about the Panelva platform rules.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: "2rem" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "1.2rem", color: "#fff" }}>Q: {faq.q}</h3>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-dark-muted)", lineHeight: 1.5 }}>A: {faq.a}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
