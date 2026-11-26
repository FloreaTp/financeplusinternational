(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
  const fmtMoney = value => money.format(Number.isFinite(value) ? value : 0);
  const header = $(".site-header"), progress = $("#readingProgress"), backToTop = $("#backToTop");
  const menuToggle = $("#menuToggle"), primaryNav = $("#primaryNav");

  function updateScrollUI() {
    const top = window.scrollY || document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("scrolled", top > 12);
    if (progress) progress.style.width = `${total > 0 ? top / total * 100 : 0}%`;
    if (backToTop) backToTop.classList.toggle("visible", top > 550);
  }
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    primaryNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    document.body.classList.remove("menu-open");
  }
  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      primaryNav.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
    });
    $$(".nav-link, .nav-apply", primaryNav).forEach(link => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  }
  if (backToTop) backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add("is-visible"));

  const navLinks = $$(".nav-link");
  navLinks.map(link => $(link.getAttribute("href"))).filter(Boolean).forEach(section => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    }), { rootMargin: "-35% 0px -55% 0px" });
    observer.observe(section);
  });

  const year = $("#currentYear");
  if (year) year.textContent = String(new Date().getFullYear());

  const amountInput = $("#loanAmount"), monthsInput = $("#loanMonths"), rateInput = $("#interestRate");
  const amountDisplay = $("#loanAmountDisplay"), monthsDisplay = $("#loanMonthsDisplay"), rateDisplay = $("#interestRateDisplay");
  const monthlyPayment = $("#monthlyPayment"), totalInterest = $("#totalInterest"), totalRepayment = $("#totalRepayment");
  const scheduleToggle = $("#showSchedule"), scheduleWrap = $("#amortizationWrap"), scheduleBody = $("#amortizationBody"), printSchedule = $("#printSchedule");
  let chart = null, currentSchedule = [];

  function renderSchedule() {
    if (!scheduleBody) return;
    scheduleBody.innerHTML = currentSchedule.slice(0, 60).map(row =>
      `<tr><td>${row.month}</td><td>${fmtMoney(row.payment)}</td><td>${fmtMoney(row.principal)}</td><td>${fmtMoney(row.interest)}</td><td>${fmtMoney(row.balance)}</td></tr>`
    ).join("");
    if (currentSchedule.length > 60) scheduleBody.insertAdjacentHTML("beforeend",
      `<tr><td colspan="5" style="text-align:left;color:#78869a">Showing first 60 of ${currentSchedule.length} months. Adjust the term for a shorter schedule.</td></tr>`);
  }
  function renderChart(principal, interest) {
    const canvas = $("#repaymentChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (chart) chart.destroy();
    chart = new Chart(canvas, {
      type: "doughnut",
      data: { labels: ["Loan principal", "Estimated interest"], datasets: [{ data: [principal, interest], backgroundColor: ["#d9b66f", "#4d7db7"], borderWidth: 0, hoverOffset: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "73%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.label}: ${fmtMoney(context.raw)}` } } } }
    });
  }
  function calculate() {
    if (!amountInput || !monthsInput || !rateInput) return;
    const principal = Math.max(0, Number(amountInput.value) || 0);
    const months = Math.max(1, Number(monthsInput.value) || 1);
    const annualRate = Math.max(0, Number(rateInput.value) || 0) / 100;
    const r = annualRate / 12;
    const payment = r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months));
    const total = payment * months, interest = Math.max(0, total - principal);
    amountDisplay.textContent = fmtMoney(principal).replace(/\.00$/, "");
    monthsDisplay.textContent = `${months} ${months === 1 ? "month" : "months"}`;
    rateDisplay.textContent = `${Number(rateInput.value).toLocaleString("en", { maximumFractionDigits: 2 })}%`;
    monthlyPayment.textContent = fmtMoney(payment);
    totalInterest.textContent = fmtMoney(interest);
    totalRepayment.textContent = fmtMoney(total);
    currentSchedule = [];
    let balance = principal;
    for (let month = 1; month <= months; month++) {
      const interestPart = balance * r;
      let principalPart = payment - interestPart;
      if (month === months || principalPart > balance) principalPart = balance;
      balance = Math.max(0, balance - principalPart);
      currentSchedule.push({ month, payment: month === months ? principalPart + interestPart : payment, principal: principalPart, interest: interestPart, balance });
    }
    renderSchedule();
    renderChart(principal, interest);
  }
  [amountInput, monthsInput, rateInput].filter(Boolean).forEach(input => input.addEventListener("input", calculate));
  if (scheduleToggle && scheduleWrap) scheduleToggle.addEventListener("click", () => {
    const expanded = scheduleToggle.getAttribute("aria-expanded") === "true";
    scheduleToggle.setAttribute("aria-expanded", String(!expanded));
    scheduleWrap.hidden = expanded;
    scheduleToggle.innerHTML = expanded ? 'View repayment schedule <span aria-hidden="true">↓</span>' : 'Hide repayment schedule <span aria-hidden="true">↑</span>';
  });
  if (printSchedule) printSchedule.addEventListener("click", () => { if (scheduleWrap) scheduleWrap.hidden = false; window.print(); });
  calculate();

  const faqItems = $$(".faq-item");
  faqItems.forEach(item => item.addEventListener("toggle", () => { if (item.open) faqItems.forEach(other => { if (other !== item) other.open = false; }); }));
  const form = $(".application-form");
  if (form) form.addEventListener("submit", event => { if (!form.checkValidity()) { event.preventDefault(); form.reportValidity(); } });
})();
