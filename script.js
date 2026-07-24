const STORAGE = {
  accounts: "mf_accounts_v30",
  transactions: "mf_transactions_v30"
};

const LEGACY_KEYS = {
  accounts: ["mf_accounts_v21"],
  transactions: ["mf_transactions_v21"]
};

const PAYMENT_METHODS = [
  "Google Pay","PhonePe","Paytm","CRED Pay","Bank Transfer","Debit Card",
  "Credit Card","Net Banking","Cash","Auto Debit","Cheque"
];

const $ = id => document.getElementById(id);
const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", {maximumFractionDigits: 2});
const numberValue = id => Number($(id).value) || 0;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayText = () => new Date().toISOString().slice(0, 10);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[ch]));

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAccounts() {
  return readJson(STORAGE.accounts);
}

function getTransactions() {
  return readJson(STORAGE.transactions);
}

document.addEventListener("DOMContentLoaded", init);

function init() {
  migrateLegacyData();
  setupNavigation();
  setupPaymentMethods();
  setDefaultDates();
  bindEvents();
  toggleAccountFields();
  applyPreset("dashboard");
  applyPreset("report");
  refreshAll();
}

function migrateLegacyData() {
  if (!localStorage.getItem(STORAGE.accounts)) {
    for (const key of LEGACY_KEYS.accounts) {
      const data = readJson(key);
      if (data.length) {
        saveJson(STORAGE.accounts, data);
        break;
      }
    }
  }
  if (!localStorage.getItem(STORAGE.transactions)) {
    for (const key of LEGACY_KEYS.transactions) {
      const data = readJson(key);
      if (data.length) {
        saveJson(STORAGE.transactions, data);
        break;
      }
    }
  }
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
      button.classList.add("active");
      $(button.dataset.page).classList.add("active-page");
      refreshAll();
    });
  });
}

function setupPaymentMethods() {
  ["incomeMethod", "expenseMethod"].forEach(id => {
    $(id).innerHTML = "";
    PAYMENT_METHODS.forEach(method => $(id).add(new Option(method, method)));
  });
}

function setDefaultDates() {
  ["incomeDate", "expenseDate", "transferDate"].forEach(id => $(id).value = todayText());
}

function bindEvents() {
  $("accountType").addEventListener("change", toggleAccountFields);
  $("saveAccount").addEventListener("click", saveAccount);
  $("cancelAccountEdit").addEventListener("click", clearAccountForm);
  $("accountFilter").addEventListener("change", renderAccounts);

  $("saveIncome").addEventListener("click", saveIncome);
  $("cancelIncomeEdit").addEventListener("click", clearIncomeForm);

  $("saveExpense").addEventListener("click", saveExpense);
  $("cancelExpenseEdit").addEventListener("click", clearExpenseForm);

  $("saveTransfer").addEventListener("click", saveTransfer);
  $("cancelTransferEdit").addEventListener("click", clearTransferForm);

  ["historySearch", "historyType", "historyFrom", "historyTo", "historyAccount"]
    .forEach(id => $(id).addEventListener("input", renderHistory));
  $("clearHistoryFilters").addEventListener("click", clearHistoryFilters);

  $("dashboardPreset").addEventListener("change", () => applyPreset("dashboard"));
  $("showDashboard").addEventListener("click", renderDashboard);

  $("reportPreset").addEventListener("change", () => applyPreset("report"));
  $("generateReport").addEventListener("click", renderReports);

  $("downloadBackup").addEventListener("click", downloadBackup);
  $("restoreBackup").addEventListener("click", restoreBackup);
  $("clearAllData").addEventListener("click", clearAllData);
}

function refreshAll() {
  populateAccountSelects();
  populatePeople();
  renderAccounts();
  renderHistory();
  renderDashboard();
  renderReports();
}

function populateAccountSelects() {
  const activeAccounts = getAccounts().filter(account => account.active);
  ["incomeAccount", "expenseAccount", "transferFrom", "transferTo"].forEach(id => {
    const current = $(id).value;
    $(id).innerHTML = '<option value="">Select Account</option>';
    activeAccounts.forEach(account => {
      $(id).add(new Option(`${account.name} (${account.type})`, account.id));
    });
    if ([...$(id).options].some(option => option.value === current)) {
      $(id).value = current;
    }
  });

  const history = $("historyAccount");
  const currentHistory = history.value;
  history.innerHTML = '<option value="All">All Accounts</option>';
  getAccounts().forEach(account => history.add(new Option(account.name, account.id)));
  if ([...history.options].some(option => option.value === currentHistory)) {
    history.value = currentHistory;
  }
}

function populatePeople() {
  const names = [...new Set(getTransactions().map(tx => tx.party).filter(Boolean))].sort();
  $("peopleList").innerHTML = names.map(name => `<option value="${escapeHtml(name)}">`).join("");
}

function toggleAccountFields() {
  const isCreditCard = $("accountType").value === "Credit Card";
  document.querySelectorAll(".credit-account").forEach(el => el.classList.toggle("hidden", !isCreditCard));
  document.querySelectorAll(".normal-account").forEach(el => el.classList.toggle("hidden", isCreditCard));
}

function saveAccount() {
  const editId = $("accountEditId").value;
  const name = $("accountName").value.trim();
  const type = $("accountType").value;

  if (!name) {
    alert("Account name enter చేయండి.");
    return;
  }

  let list = getAccounts();
  const old = list.find(account => account.id === editId);

  const account = {
    id: editId || uid(),
    name,
    type,
    openingBalance: type === "Credit Card" ? 0 : numberValue("openingBalance"),
    creditLimit: type === "Credit Card" ? numberValue("creditLimit") : 0,
    openingOutstanding: type === "Credit Card" ? numberValue("openingOutstanding") : 0,
    billDate: type === "Credit Card" ? numberValue("billDate") : 0,
    dueDate: type === "Credit Card" ? numberValue("dueDate") : 0,
    notes: $("accountNotes").value.trim(),
    active: old ? old.active : true
  };

  if (editId) {
    list = list.map(item => item.id === editId ? account : item);
  } else {
    list.push(account);
  }

  saveJson(STORAGE.accounts, list);
  clearAccountForm();
  refreshAll();
  alert(editId ? "Account updated." : "Account saved.");
}

function clearAccountForm() {
  ["accountEditId","accountName","openingBalance","creditLimit","openingOutstanding","billDate","dueDate","accountNotes"]
    .forEach(id => $(id).value = "");
  $("accountType").value = "Bank";
  $("accountFormTitle").textContent = "Add Account";
  $("saveAccount").textContent = "Save Account";
  $("cancelAccountEdit").classList.add("hidden");
  toggleAccountFields();
}

function accountBalance(accountId) {
  const account = getAccounts().find(item => item.id === accountId);
  if (!account) return 0;

  let balance = account.type === "Credit Card"
    ? Number(account.openingOutstanding || 0)
    : Number(account.openingBalance || 0);

  getTransactions().forEach(tx => {
    const amount = Number(tx.amount || 0);

    if (tx.type === "Income" && tx.accountId === accountId && account.type !== "Credit Card") {
      balance += amount;
    }

    if (tx.type === "Expense" && tx.accountId === accountId) {
      balance += account.type === "Credit Card" ? amount : -amount;
    }

    if (tx.type === "Transfer") {
      if (tx.fromAccountId === accountId) {
        balance += account.type === "Credit Card" ? amount : -amount;
      }
      if (tx.toAccountId === accountId) {
        balance += account.type === "Credit Card" ? -amount : amount;
      }
    }
  });

  return balance;
}

function renderAccounts() {
  const filter = $("accountFilter").value;
  const list = getAccounts().filter(account =>
    filter === "All" ||
    filter === account.type ||
    (filter === "Active" && account.active) ||
    (filter === "Inactive" && !account.active)
  );

  if (!list.length) {
    $("accountsList").innerHTML = '<div class="empty">No accounts found.</div>';
    return;
  }

  $("accountsList").innerHTML = `<div class="account-grid">${list.map(account => {
    const balance = accountBalance(account.id);
    const details = account.type === "Credit Card"
      ? `<div class="detail"><span>Outstanding</span><b>${money(balance)}</b></div>
         <div class="detail"><span>Available Limit</span><b>${money(Math.max(0, Number(account.creditLimit || 0) - balance))}</b></div>
         <div class="detail"><span>Bill / Due</span><b>${account.billDate || "-"} / ${account.dueDate || "-"}</b></div>`
      : `<div class="detail"><span>Current Balance</span><b>${money(balance)}</b></div>`;

    return `<article class="account-card ${account.active ? "" : "inactive"}">
      <div class="row-between">
        <div><b>${escapeHtml(account.name)}</b><div class="muted">${account.type}</div></div>
        <span class="badge">${account.active ? "Active" : "Inactive"}</span>
      </div>
      <div class="detail-list">${details}${account.notes ? `<div class="muted">${escapeHtml(account.notes)}</div>` : ""}</div>
      <div class="card-actions">
        <button class="mini-btn edit-btn" onclick="editAccount('${account.id}')">Edit</button>
        <button class="mini-btn toggle-btn" onclick="toggleAccount('${account.id}')">${account.active ? "Deactivate" : "Activate"}</button>
        <button class="mini-btn delete-btn" onclick="deleteAccount('${account.id}')">Delete</button>
      </div>
    </article>`;
  }).join("")}</div>`;
}

function editAccount(id) {
  const account = getAccounts().find(item => item.id === id);
  if (!account) return;

  $("accountEditId").value = account.id;
  $("accountName").value = account.name;
  $("accountType").value = account.type;
  $("openingBalance").value = account.openingBalance || "";
  $("creditLimit").value = account.creditLimit || "";
  $("openingOutstanding").value = account.openingOutstanding || "";
  $("billDate").value = account.billDate || "";
  $("dueDate").value = account.dueDate || "";
  $("accountNotes").value = account.notes || "";
  $("accountFormTitle").textContent = "Edit Account";
  $("saveAccount").textContent = "Update Account";
  $("cancelAccountEdit").classList.remove("hidden");
  toggleAccountFields();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function toggleAccount(id) {
  const list = getAccounts();
  const account = list.find(item => item.id === id);
  if (!account) return;
  account.active = !account.active;
  saveJson(STORAGE.accounts, list);
  refreshAll();
}

function deleteAccount(id) {
  const used = getTransactions().some(tx =>
    tx.accountId === id || tx.fromAccountId === id || tx.toAccountId === id
  );
  if (used) {
    alert("This account has transactions. Delete transactions first or deactivate the account.");
    return;
  }

  const account = getAccounts().find(item => item.id === id);
  if (account && confirm(`${account.name} delete చేయాలా?`)) {
    saveJson(STORAGE.accounts, getAccounts().filter(item => item.id !== id));
    refreshAll();
  }
}

function saveIncome() {
  const editId = $("incomeEditId").value;
  const accountId = $("incomeAccount").value;
  const amount = numberValue("incomeAmount");

  if (!$("incomeDate").value || !accountId || amount <= 0) {
    alert("Date, account select చేసి valid amount enter చేయండి.");
    return;
  }

  upsertTransaction({
    id: editId || uid(),
    type: "Income",
    date: $("incomeDate").value,
    category: $("incomeCategory").value,
    party: $("receivedFrom").value.trim(),
    accountId,
    method: $("incomeMethod").value,
    amount,
    notes: $("incomeNotes").value.trim()
  });

  clearIncomeForm();
  refreshAll();
  alert(editId ? "Income updated." : "Income saved.");
}

function saveExpense() {
  const editId = $("expenseEditId").value;
  const accountId = $("expenseAccount").value;
  const amount = numberValue("expenseAmount");

  if (!$("expenseDate").value || !accountId || amount <= 0) {
    alert("Date, account select చేసి valid amount enter చేయండి.");
    return;
  }

  upsertTransaction({
    id: editId || uid(),
    type: "Expense",
    date: $("expenseDate").value,
    category: $("expenseCategory").value,
    party: $("paidTo").value.trim(),
    accountId,
    method: $("expenseMethod").value,
    amount,
    notes: $("expenseNotes").value.trim()
  });

  clearExpenseForm();
  refreshAll();
  alert(editId ? "Expense updated." : "Expense saved.");
}

function saveTransfer() {
  const editId = $("transferEditId").value;
  const fromAccountId = $("transferFrom").value;
  const toAccountId = $("transferTo").value;
  const amount = numberValue("transferAmount");

  if (!$("transferDate").value || !fromAccountId || !toAccountId || amount <= 0) {
    alert("Date, From, To accounts select చేసి valid amount enter చేయండి.");
    return;
  }
  if (fromAccountId === toAccountId) {
    alert("From and To accounts same ఉండకూడదు.");
    return;
  }

  upsertTransaction({
    id: editId || uid(),
    type: "Transfer",
    date: $("transferDate").value,
    fromAccountId,
    toAccountId,
    amount,
    notes: $("transferNotes").value.trim()
  });

  clearTransferForm();
  refreshAll();
  alert(editId ? "Transfer updated." : "Transfer saved.");
}

function upsertTransaction(transaction) {
  const list = getTransactions();
  const index = list.findIndex(item => item.id === transaction.id);
  if (index >= 0) list[index] = transaction;
  else list.push(transaction);
  saveJson(STORAGE.transactions, list);
}

function clearIncomeForm() {
  ["incomeEditId","receivedFrom","incomeAmount","incomeNotes"].forEach(id => $(id).value = "");
  $("incomeDate").value = todayText();
  $("incomeCategory").value = "Salary";
  $("incomeAccount").value = "";
  $("saveIncome").textContent = "Save Income";
  $("cancelIncomeEdit").classList.add("hidden");
}

function clearExpenseForm() {
  ["expenseEditId","paidTo","expenseAmount","expenseNotes"].forEach(id => $(id).value = "");
  $("expenseDate").value = todayText();
  $("expenseCategory").value = "Groceries";
  $("expenseAccount").value = "";
  $("saveExpense").textContent = "Save Expense";
  $("cancelExpenseEdit").classList.add("hidden");
}

function clearTransferForm() {
  ["transferEditId","transferAmount","transferNotes"].forEach(id => $(id).value = "");
  $("transferDate").value = todayText();
  $("transferFrom").value = "";
  $("transferTo").value = "";
  $("saveTransfer").textContent = "Save Transfer";
  $("cancelTransferEdit").classList.add("hidden");
}

function accountName(id) {
  return getAccounts().find(account => account.id === id)?.name || "Unknown Account";
}

function clearHistoryFilters() {
  $("historySearch").value = "";
  $("historyType").value = "All";
  $("historyFrom").value = "";
  $("historyTo").value = "";
  $("historyAccount").value = "All";
  renderHistory();
}

function renderHistory() {
  const search = $("historySearch").value.toLowerCase();
  const type = $("historyType").value;
  const from = $("historyFrom").value;
  const to = $("historyTo").value;
  const account = $("historyAccount").value;

  let list = [...getTransactions()].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );

  list = list.filter(tx => {
    const searchable = [
      tx.category, tx.party, tx.notes,
      accountName(tx.accountId), accountName(tx.fromAccountId), accountName(tx.toAccountId)
    ].join(" ").toLowerCase();

    const accountMatches = account === "All" ||
      tx.accountId === account ||
      tx.fromAccountId === account ||
      tx.toAccountId === account;

    const dateMatches = (!from || tx.date >= from) && (!to || tx.date <= to);

    return (!search || searchable.includes(search)) &&
      (type === "All" || tx.type === type) &&
      accountMatches &&
      dateMatches;
  });

  $("transactionList").innerHTML = list.length
    ? list.map(transactionHtml).join("")
    : '<div class="empty">No transactions found.</div>';
}

function transactionHtml(tx) {
  let title = "";
  let sub = "";

  if (tx.type === "Income") {
    title = `${escapeHtml(tx.category)}${tx.party ? ` • ${escapeHtml(tx.party)}` : ""}`;
    sub = `Received in ${escapeHtml(accountName(tx.accountId))} • ${escapeHtml(tx.method || "")}`;
  } else if (tx.type === "Expense") {
    title = `${escapeHtml(tx.category)}${tx.party ? ` • ${escapeHtml(tx.party)}` : ""}`;
    sub = `Paid from ${escapeHtml(accountName(tx.accountId))} • ${escapeHtml(tx.method || "")}`;
  } else {
    title = `${escapeHtml(accountName(tx.fromAccountId))} → ${escapeHtml(accountName(tx.toAccountId))}`;
    sub = escapeHtml(tx.notes || "Account transfer");
  }

  const sign = tx.type === "Expense" ? "-" : tx.type === "Income" ? "+" : "";

  return `<div class="transaction">
    <div>${formatDate(tx.date)}</div>
    <span class="type-badge type-${tx.type}">${tx.type}</span>
    <div><div class="tx-title">${title}</div><div class="tx-sub">${sub}</div></div>
    <b class="tx-amount amount-${tx.type}">${sign}${money(tx.amount)}</b>
    <div class="tx-actions">
      <button class="mini-btn edit-btn" onclick="editTransaction('${tx.id}')">Edit</button>
      <button class="mini-btn delete-btn" onclick="deleteTransaction('${tx.id}')">Delete</button>
    </div>
  </div>`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

function editTransaction(id) {
  const tx = getTransactions().find(item => item.id === id);
  if (!tx) return;

  document.querySelector(`[data-page="${tx.type.toLowerCase()}"]`).click();

  if (tx.type === "Income") {
    $("incomeEditId").value = tx.id;
    $("incomeDate").value = tx.date;
    $("incomeCategory").value = tx.category;
    $("receivedFrom").value = tx.party || "";
    $("incomeAccount").value = tx.accountId;
    $("incomeMethod").value = tx.method;
    $("incomeAmount").value = tx.amount;
    $("incomeNotes").value = tx.notes || "";
    $("saveIncome").textContent = "Update Income";
    $("cancelIncomeEdit").classList.remove("hidden");
  } else if (tx.type === "Expense") {
    $("expenseEditId").value = tx.id;
    $("expenseDate").value = tx.date;
    $("expenseCategory").value = tx.category;
    $("paidTo").value = tx.party || "";
    $("expenseAccount").value = tx.accountId;
    $("expenseMethod").value = tx.method;
    $("expenseAmount").value = tx.amount;
    $("expenseNotes").value = tx.notes || "";
    $("saveExpense").textContent = "Update Expense";
    $("cancelExpenseEdit").classList.remove("hidden");
  } else {
    $("transferEditId").value = tx.id;
    $("transferDate").value = tx.date;
    $("transferFrom").value = tx.fromAccountId;
    $("transferTo").value = tx.toAccountId;
    $("transferAmount").value = tx.amount;
    $("transferNotes").value = tx.notes || "";
    $("saveTransfer").textContent = "Update Transfer";
    $("cancelTransferEdit").classList.remove("hidden");
  }
}

function deleteTransaction(id) {
  if (confirm("ఈ transaction delete చేయాలా?")) {
    saveJson(STORAGE.transactions, getTransactions().filter(item => item.id !== id));
    refreshAll();
  }
}

function dateText(date) {
  return date.toISOString().slice(0, 10);
}

function presetDates(preset) {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);

  if (preset === "yesterday") {
    from.setDate(from.getDate() - 1);
    to = new Date(from);
  } else if (preset === "thisWeek") {
    const mondayOffset = (now.getDay() + 6) % 7;
    from.setDate(now.getDate() - mondayOffset);
  } else if (preset === "lastMonth") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (preset === "thisYear") {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear(), 11, 31);
  } else if (preset === "thisMonth") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {from: dateText(from), to: dateText(to)};
}

function applyPreset(prefix) {
  const preset = $(`${prefix}Preset`).value;
  if (preset !== "custom") {
    const range = presetDates(preset);
    $(`${prefix}From`).value = range.from;
    $(`${prefix}To`).value = range.to;
  }

  if (prefix === "dashboard") renderDashboard();
  else renderReports();
}

function shortPeriodLabel(from, to) {
  if (!from && !to) return "All Dates";
  if (from && to && from.slice(0, 7) === to.slice(0, 7)) {
    const first = new Date(from + "T00:00:00");
    const last = new Date(to + "T00:00:00");
    if (first.getDate() === 1 && last.getDate() === new Date(last.getFullYear(), last.getMonth() + 1, 0).getDate()) {
      return first.toLocaleString("en-IN", {month: "short", year: "2-digit"}).replace(" ", "-");
    }
  }
  const nice = date => new Date(date + "T00:00:00").toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"2-digit"});
  return `${from ? nice(from) : "Start"} to ${to ? nice(to) : "Today"}`;
}

function filteredTransactions(from, to) {
  return getTransactions().filter(tx => (!from || tx.date >= from) && (!to || tx.date <= to));
}

function categorySummaryHtml(categories) {
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '<div class="empty">No expenses for selected dates.</div>';

  const max = Math.max(...entries.map(([, value]) => value), 1);
  return entries.map(([category, value]) =>
    `<div class="category-row">
      <span>${escapeHtml(category)}</span>
      <div class="bar"><span style="width:${(value / max) * 100}%"></span></div>
      <b>${money(value)}</b>
    </div>`
  ).join("");
}

function renderDashboard() {
  const from = $("dashboardFrom").value;
  const to = $("dashboardTo").value;
  const list = filteredTransactions(from, to);

  const income = list.filter(tx => tx.type === "Income").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = list.filter(tx => tx.type === "Expense").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const savings = income - expense;
  const highest = list.filter(tx => tx.type === "Expense").sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  $("dashboardPeriodLabel").textContent = shortPeriodLabel(from, to);
  $("dashIncome").textContent = money(income);
  $("dashExpense").textContent = money(expense);
  $("dashSavings").textContent = money(savings);
  $("dashSavingsPercent").textContent = income > 0 ? `${((savings / income) * 100).toFixed(1)}%` : "0%";
  $("dashHighestExpense").textContent = highest ? money(highest.amount) : money(0);
  $("dashHighestCategory").textContent = highest ? highest.category : "No expense";

  const accounts = getAccounts();
  $("dashLiquidBalance").textContent = money(
    accounts.filter(account => account.type !== "Credit Card")
      .reduce((sum, account) => sum + accountBalance(account.id), 0)
  );
  $("dashCardOutstanding").textContent = money(
    accounts.filter(account => account.type === "Credit Card")
      .reduce((sum, account) => sum + accountBalance(account.id), 0)
  );
  $("dashAccountCount").textContent = accounts.length;

  const recent = [...getTransactions()]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  $("recentTransactions").innerHTML = recent.length
    ? recent.map(tx => `<div class="detail"><span>${tx.type} • ${formatDate(tx.date)}</span><b class="amount-${tx.type}">${money(tx.amount)}</b></div>`).join("")
    : '<div class="empty">No transactions yet.</div>';

  const categories = {};
  list.filter(tx => tx.type === "Expense").forEach(tx => {
    categories[tx.category] = (categories[tx.category] || 0) + Number(tx.amount);
  });
  $("dashboardCategorySummary").innerHTML = categorySummaryHtml(categories);
}

function renderReports() {
  const from = $("reportFrom").value;
  const to = $("reportTo").value;
  const list = filteredTransactions(from, to);

  const income = list.filter(tx => tx.type === "Income").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = list.filter(tx => tx.type === "Expense").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const savings = income - expense;

  $("reportPeriodLabel").textContent = shortPeriodLabel(from, to);
  $("reportIncome").textContent = money(income);
  $("reportExpense").textContent = money(expense);
  $("reportSavings").textContent = money(savings);
  $("reportSavingsPercent").textContent = income > 0 ? `${((savings / income) * 100).toFixed(1)}%` : "0%";

  const categories = {};
  list.filter(tx => tx.type === "Expense").forEach(tx => {
    categories[tx.category] = (categories[tx.category] || 0) + Number(tx.amount);
  });
  $("reportCategorySummary").innerHTML = categorySummaryHtml(categories);

  const accounts = getAccounts();
  $("reportAccountBalances").innerHTML = accounts.length
    ? accounts.map(account =>
      `<div class="account-report-row">
        <span>${escapeHtml(account.name)} <small class="muted">(${account.type})</small></span>
        <b>${money(accountBalance(account.id))}</b>
      </div>`
    ).join("")
    : '<div class="empty">No accounts found.</div>';

  const monthly = {};
  list.forEach(tx => {
    const month = tx.date.slice(0, 7);
    if (!monthly[month]) monthly[month] = {income: 0, expense: 0};
    if (tx.type === "Income") monthly[month].income += Number(tx.amount);
    if (tx.type === "Expense") monthly[month].expense += Number(tx.amount);
  });

  const entries = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(1, ...entries.flatMap(([, values]) => [values.income, values.expense]));

  $("monthlyTrend").innerHTML = entries.length
    ? entries.map(([month, values]) => {
      const label = new Date(month + "-01T00:00:00").toLocaleString("en-IN", {month: "short", year: "2-digit"}).replace(" ", "-");
      return `<div class="trend-row">
        <b>${label}</b>
        <div class="trend-bars">
          <div class="trend-bar trend-income"><span style="width:${(values.income / max) * 100}%"></span></div>
          <div class="trend-bar trend-expense"><span style="width:${(values.expense / max) * 100}%"></span></div>
        </div>
        <span class="trend-income-value">Income ${money(values.income)}</span>
        <span class="trend-expense-value">Expense ${money(values.expense)}</span>
      </div>`;
    }).join("")
    : '<div class="empty">No report data for selected dates.</div>';
}

function downloadBackup() {
  const backup = {
    app: "My Finance",
    version: "3.0",
    exportedAt: new Date().toISOString(),
    accounts: getAccounts(),
    transactions: getTransactions()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-finance-backup-${todayText()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function restoreBackup() {
  const file = $("restoreFile").files[0];
  if (!file) {
    alert("Backup file select చేయండి.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);
      if (!Array.isArray(backup.accounts) || !Array.isArray(backup.transactions)) {
        throw new Error("Invalid backup");
      }
      if (!confirm("Existing data replace చేసి backup restore చేయాలా?")) return;

      saveJson(STORAGE.accounts, backup.accounts);
      saveJson(STORAGE.transactions, backup.transactions);
      $("restoreFile").value = "";
      refreshAll();
      alert("Backup restored successfully.");
    } catch {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm("Accounts and transactions అన్నీ permanently delete చేయాలా?")) return;
  if (!confirm("Final confirmation: ఈ action undo చేయలేరు.")) return;

  localStorage.removeItem(STORAGE.accounts);
  localStorage.removeItem(STORAGE.transactions);
  refreshAll();
  alert("All data deleted.");
}
