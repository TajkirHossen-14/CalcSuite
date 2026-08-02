/** Loan / EMI Calculator with a full amortization schedule. */
import { qs, on } from '../../utils/dom.js';
import { fmtFixed, fmt } from '../../utils/format.js';
import { isNumber } from '../../utils/validators.js';

export function emi(principal, annualRate, months) {
  const i = annualRate / 100 / 12;
  if (i === 0) return principal / months;
  return (principal * i * (1 + i) ** months) / ((1 + i) ** months - 1);
}

export function schedule(principal, annualRate, months, extra = 0) {
  const i = annualRate / 100 / 12;
  const payment = emi(principal, annualRate, months) + extra;
  const rows = [];
  let balance = principal;
  let totalInterest = 0;
  for (let m = 1; m <= months * 2 && balance > 0.005; m += 1) {
    const interest = balance * i;
    let principalPart = payment - interest;
    if (principalPart > balance) principalPart = balance;
    balance -= principalPart;
    totalInterest += interest;
    rows.push({ m, payment: principalPart + interest, interest, principal: principalPart, balance: Math.max(0, balance) });
  }
  return { rows, totalInterest, payment, months: rows.length };
}

export default {
  resultLabel: 'Monthly payment',
  how: `
    <p>An amortising loan charges interest on whatever is still outstanding, while your payment
    stays constant. Solving that for the payment gives the EMI (equated monthly instalment) formula:</p>
    <code class="formula">EMI = P × i × (1 + i)ⁿ / ((1 + i)ⁿ − 1)

P = principal, i = annual rate ÷ 12 ÷ 100, n = number of monthly payments</code>
    <h4>Where each payment goes</h4>
    <p>Every month, interest is taken first (<code>balance × i</code>) and whatever is left reduces
    the balance. Early on the interest slice dominates; as the balance falls the principal slice
    grows, which is why the schedule below looks lopsided at the start. That's also why overpaying
    early saves far more than overpaying late.</p>
    <h4>Extra payments</h4>
    <p>Add an optional extra amount and it is applied straight to the principal each month. The
    schedule then simply runs until the balance reaches zero, and the summary shows how many months
    and how much interest you saved.</p>
    <h4>Zero-interest case</h4>
    <p>At 0% the formula divides by zero, so the tool falls back to <code>P / n</code> — the honest
    answer for an interest-free plan.</p>`,

  body: () => `
    <div class="grid grid-2">
      <div class="field"><label for="amount">Loan amount</label><input type="number" id="amount" value="250000" min="0" step="any"></div>
      <div class="field"><label for="rate">Annual interest rate (%)</label><input type="number" id="rate" value="6.5" step="any"></div>
      <div class="field"><label for="years">Term (years)</label><input type="number" id="years" value="25" min="0.1" step="any"></div>
      <div class="field"><label for="extra">Extra monthly payment</label><input type="number" id="extra" value="0" min="0" step="any"></div>
    </div>
    <div class="stat-grid mt-4" id="loan-stats"></div>
    <div class="row mt-4">
      <button class="btn btn-sm" id="toggle-table" type="button"><i class="fa-solid fa-table-list"></i> Show amortization schedule</button>
      <span class="field-hint" id="table-note"></span>
    </div>
    <div class="table-wrap mt-3" id="amort-wrap" hidden style="max-height:460px;overflow:auto">
      <table class="data-table">
        <thead><tr><th>#</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead>
        <tbody id="amort-body"></tbody>
      </table>
    </div>`,

  init(root, ctx) {
    const el = (id) => qs(`#${id}`, root);
    let showTable = false;

    const calc = () => {
      if (!['amount', 'rate', 'years'].every((id) => isNumber(el(id).value))) return ctx.setError('Fill in amount, rate and term');
      const P = Number(el('amount').value);
      const rate = Number(el('rate').value);
      const months = Math.round(Number(el('years').value) * 12);
      const extra = Number(el('extra').value) || 0;
      if (P <= 0 || months <= 0) return ctx.setError('Amount and term must be greater than zero');
      if (rate < 0) return ctx.setError('Rate cannot be negative');

      const base = emi(P, rate, months);
      const plan = schedule(P, rate, months, extra);
      const baseline = schedule(P, rate, months, 0);
      const totalPaid = P + plan.totalInterest;

      ctx.setResult(fmtFixed(base + extra, 2),
        `<span class="mono">${fmtFixed(P, 2)}</span> over <span class="mono">${months}</span> months at <span class="mono">${fmt(rate, 3)}%</span>${extra ? ` including <span class="mono">${fmtFixed(extra, 2)}</span> extra` : ''}`,
        { copy: (base + extra).toFixed(2) });

      qs('#loan-stats', root).innerHTML = [
        ['Base EMI', fmtFixed(base, 2)],
        ['Total interest', fmtFixed(plan.totalInterest, 2)],
        ['Total repaid', fmtFixed(totalPaid, 2)],
        ['Interest as % of loan', `${fmt((plan.totalInterest / P) * 100, 2)}%`],
        ['Payments made', `${plan.months} months`],
        ['Payoff time', `${Math.floor(plan.months / 12)}y ${plan.months % 12}m`],
        ['Interest saved by extra', extra ? fmtFixed(baseline.totalInterest - plan.totalInterest, 2) : '—'],
        ['Months saved', extra ? `${baseline.months - plan.months}` : '—'],
        ['First month interest', fmtFixed(plan.rows[0] ? plan.rows[0].interest : 0, 2)],
        ['First month principal', fmtFixed(plan.rows[0] ? plan.rows[0].principal : 0, 2)]
      ].map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`).join('');

      qs('#table-note', root).textContent = `${plan.months} rows`;
      if (showTable) {
        qs('#amort-body', root).innerHTML = plan.rows.map((r) => `
          <tr><td>${r.m}</td><td class="num">${fmtFixed(r.payment, 2)}</td><td class="num">${fmtFixed(r.interest, 2)}</td>
          <td class="num">${fmtFixed(r.principal, 2)}</td><td class="num">${fmtFixed(r.balance, 2)}</td></tr>`).join('');
      }
    };

    on(el('toggle-table'), 'click', (event) => {
      showTable = !showTable;
      qs('#amort-wrap', root).hidden = !showTable;
      event.currentTarget.innerHTML = showTable
        ? '<i class="fa-solid fa-eye-slash"></i> Hide amortization schedule'
        : '<i class="fa-solid fa-table-list"></i> Show amortization schedule';
      calc();
    });

    ctx.live(calc, { debounceMs: 120 });
  }
};
