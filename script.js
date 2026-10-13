// ===== Settings =====
const FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxx". Empty = falls back to email app.
const EMAIL = "hello@flowxen.in";

// ===== Mobile menu =====
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", e => { if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); } });

// ===== Reviews (from reviews.json) =====
const grid = document.getElementById("reviewGrid");
const more = document.getElementById("moreReviews");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

fetch("reviews.json").then(r => r.json()).then(({ reviews }) => {
  if (!reviews || !reviews.length) { grid.innerHTML = "<p>Reviews coming soon.</p>"; return; }
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  document.getElementById("avg").textContent = `${avg.toFixed(1)} / 5 from ${reviews.length} client reviews`;
  grid.innerHTML = reviews.map((r, i) => `
    <figure class="card review${i >= 6 ? " extra" : ""}">
      <div class="stars" role="img" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</div>
      <blockquote>“${esc(r.text)}”</blockquote>
      <figcaption><strong>${esc(r.name)}</strong>${r.role ? ", " + esc(r.role) : ""}</figcaption>
    </figure>`).join("");
  if (reviews.length > 6) {
    more.hidden = false;
    more.onclick = () => { grid.classList.add("show-all"); more.hidden = true; };
  }
}).catch(() => { grid.innerHTML = "<p>Reviews are temporarily unavailable.</p>"; });

// ===== Forms (contact + review share one handler) =====
document.querySelectorAll("form[data-form]").forEach(form => {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const status = form.querySelector(".status");
    const data = Object.fromEntries(new FormData(form));
    data.form_type = form.dataset.form;
    if (data.website) return; // honeypot: bots fill this in
    if (!FORM_ENDPOINT) {
      const body = Object.entries(data).filter(([k]) => k !== "website").map(([k, v]) => `${k}: ${v}`).join("\n");
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("FlowXen " + data.form_type)}&body=${encodeURIComponent(body)}`;
      return;
    }
    status.textContent = "Sending…";
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw 0;
      status.textContent = "Thank you! We'll be in touch shortly.";
      form.reset();
    } catch { status.textContent = `Something went wrong. Please email ${EMAIL}.`; }
  });
});

// ===== Scroll reveal =====
document.documentElement.classList.add("js");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  const watch = () => document.querySelectorAll(".card:not(.reveal),h2:not(.reveal)").forEach(el => { el.classList.add("reveal"); io.observe(el); });
  watch(); setTimeout(watch, 800); // second pass catches reviews loaded from reviews.json
} else { document.documentElement.classList.remove("js"); }
