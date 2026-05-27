// Shared nav and footer injected on every sub-page
// Root path is relative — sub-pages pass their depth as an argument

(function() {
  const root = document.currentScript.getAttribute('data-root') || '';

  // ── NAV ──────────────────────────────────────────────────────────────
  const navHTML = `
  <div class="mockup-banner">
    &#9888; DESIGN MOCKUP v4 &nbsp;|&nbsp; For Review Purposes Only &nbsp;|&nbsp; Content marked <span style="background:#1a1a1a;color:#e8a84e;padding:1px 6px;border-radius:2px;font-size:11px;">[ CONTENT NEEDED ]</span> requires Brian-provided input
  </div>
  <nav>
    <div class="nav-logo">
      <a href="${root}index.html"><img src="${root}assets/logo.png" alt="Vanguard Realty Group" /></a>
    </div>
    <ul class="nav-links">
      <li class="has-dropdown">
        <a href="${root}commercial/index.html">Commercial ▾</a>
        <ul class="dropdown">
          <li><a href="${root}commercial/office/index.html">Office Space</a></li>
          <li><a href="${root}commercial/industrial/index.html">Industrial</a></li>
          <li><a href="${root}commercial/retail/index.html">Retail</a></li>
          <li><a href="${root}commercial/multi-family/index.html">Multi-Family</a></li>
        </ul>
      </li>
      <li><a href="${root}residential/index.html">Residential</a></li>
      <li><a href="${root}team/index.html">Our Team</a></li>
      <li><a href="${root}contact/index.html">Contact</a></li>
    </ul>
    <a href="tel:5419799929" class="nav-phone">541-979-9929</a>
  </nav>`;

  // ── FOOTER ────────────────────────────────────────────────────────────
  const footerHTML = `
  <footer>
    <a href="${root}index.html"><img src="${root}assets/logo.png" alt="Vanguard Realty Group" /></a>
    <div class="footer-copy">© 2026 Vanguard Realty Group, Inc. &middot; Oregon License #200510090</div>
    <div class="footer-links">
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
      <a href="${root}contact/index.html">Contact</a>
    </div>
  </footer>`;

  // Inject nav before <main> or at top of body
  const main = document.querySelector('main') || document.body.firstChild;
  const navDiv = document.createElement('div');
  navDiv.innerHTML = navHTML;
  document.body.insertBefore(navDiv, document.body.firstChild);

  // Inject footer at end of body
  const footerDiv = document.createElement('div');
  footerDiv.innerHTML = footerHTML;
  document.body.appendChild(footerDiv);
})();
