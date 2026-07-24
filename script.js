const APP_KEY="myFinance_v31";
const incomeCategories=["Salary","Bonus","Refund","Friend Returned","Loan Received","Interest","Gift","Rental Income","Other"];
const expenseCategories=["Groceries","Petrol","EMI","Insurance","School Fees","Mobile/Internet","Medical","Shopping","Travel","Bills","Other"];
const paymentMethods=["Google Pay","PhonePe","Paytm","CRED Pay","Bank Transfer","Debit Card","Credit Card","Net Banking","Cash","Auto Debit","Cheque"];

let db={accounts:[],transactions:[]};
let dashRange=null, reportRange=null;

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n||0));
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const parseDate=s=>new Date(s+"T00:00:00");
const fmtDate=s=>parseDate(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"});
const inRange=(d,range)=>!range||(parseDate(d)>=parseDate(range.from)&&parseDate(d)<=parseDate(range.to));

function saveDB(){localStorage.setItem(APP_KEY,JSON.stringify(db))}
function loadDB(){
  try{const raw=localStorage.getItem(APP_KEY); if(raw) db=JSON.parse(raw)}
  catch(e){console.error(e)}
  if(!db.accounts)db.accounts=[]; if(!db.transactions)db.transactions=[];
}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function fillSelect(id,items){$(id).innerHTML=items.map(x=>`<option value="${x}">${x}</option>`).join("")}
function monthRange(){
  const d=new Date(), y=d.getFullYear(), m=d.getMonth();
  const from=new Date(y,m,1), to=new Date(y,m+1,0);
  const iso=x=>x.toISOString().slice(0,10);
  return {from:iso(from),to:iso(to)}
}

function accountComputed(id){
  const a=db.accounts.find(x=>x.id===id); if(!a)return 0;
  let v=Number(a.opening||0);
  for(const t of db.transactions){
    const amt=Number(t.amount||0);
    if(a.type==="credit"){
      if(t.type==="expense"&&t.accountId===id)v+=amt;
      if(t.type==="transfer"&&t.toAccountId===id)v=Math.max(0,v-amt);
      if(t.type==="transfer"&&t.fromAccountId===id)v+=amt;
    }else{
      if(t.type==="income"&&t.accountId===id)v+=amt;
      if(t.type==="expense"&&t.accountId===id)v-=amt;
      if(t.type==="transfer"&&t.fromAccountId===id)v-=amt;
      if(t.type==="transfer"&&t.toAccountId===id)v+=amt;
    }
  }
  return v;
}
function getAccountName(id){return db.accounts.find(a=>a.id===id)?.name||"Deleted Account"}
function nonCreditAccounts(){return db.accounts.filter(a=>a.type!=="credit")}

function renderAccountOptions(){
  const all=db.accounts.map(a=>`<option value="${a.id}">${a.name}${a.type==="credit"?" (Credit Card)":""}</option>`).join("");
  ["incomeAccount","expenseAccount","transferFrom","transferTo"].forEach(id=>$(id).innerHTML='<option value="">Select Account</option>'+all);
}
function renderAccounts(){
  const box=$("accountsList");
  if(!db.accounts.length){box.innerHTML='<div class="empty">No accounts added yet.</div>';return}
  box.innerHTML=db.accounts.map(a=>{
    const bal=accountComputed(a.id);
    const label=a.type==="credit"?"Outstanding":"Current Balance";
    return `<div class="account-card">
      <div class="muted">${a.type==="credit"?"Credit Card":a.type[0].toUpperCase()+a.type.slice(1)}</div>
      <h3>${escapeHtml(a.name)}</h3>
      <div class="muted">${label}</div>
      <div class="amount">${money(bal)}</div>
      ${a.type==="credit"?`<div class="muted">Limit: ${money(a.limit||0)} · Available: ${money(Math.max(0,(a.limit||0)-bal))}</div>`:""}
      <div class="account-actions">
        <button class="icon-btn edit" onclick="editAccount('${a.id}')">Edit</button>
        <button class="icon-btn delete" onclick="deleteAccount('${a.id}')">Delete</button>
      </div></div>`
  }).join("")
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function saveAccount(e){
  e.preventDefault();
  const id=$("accountId").value;
  const obj={id:id||uid(),name:$("accountName").value.trim(),type:$("accountType").value,opening:Number($("accountOpening").value||0),limit:Number($("accountLimit").value||0)};
  if(!obj.name)return toast("Enter account name");
  if(id){const i=db.accounts.findIndex(a=>a.id===id);db.accounts[i]=obj}else db.accounts.push(obj);
  saveDB();resetAccountForm();refreshAll();toast(id?"Account updated":"Account added")
}
window.editAccount=id=>{
  const a=db.accounts.find(x=>x.id===id);if(!a)return;
  $("accountId").value=a.id;$("accountName").value=a.name;$("accountType").value=a.type;$("accountOpening").value=a.opening;$("accountLimit").value=a.limit||0;
  $("limitWrap").classList.toggle("hidden",a.type!=="credit");showPage("accounts")
}
window.deleteAccount=id=>{
  if(db.transactions.some(t=>t.accountId===id||t.fromAccountId===id||t.toAccountId===id))return alert("This account has transactions. Delete or edit those transactions first.");
  if(confirm("Delete this account?")){db.accounts=db.accounts.filter(a=>a.id!==id);saveDB();refreshAll()}
}
function resetAccountForm(){$("accountForm").reset();$("accountId").value="";$("accountOpening").value=0;$("accountLimit").value=0;$("limitWrap").classList.add("hidden")}

function transactionObject(type){
  if(type==="income")return {id:$("incomeEditId").value||uid(),type,date:$("incomeDate").value,category:$("incomeCategory").value,party:$("incomeParty").value.trim(),accountId:$("incomeAccount").value,method:$("incomeMethod").value,amount:Number($("incomeAmount").value),notes:$("incomeNotes").value.trim()};
  if(type==="expense")return {id:$("expenseEditId").value||uid(),type,date:$("expenseDate").value,category:$("expenseCategory").value,party:$("expenseParty").value.trim(),accountId:$("expenseAccount").value,method:$("expenseMethod").value,amount:Number($("expenseAmount").value),notes:$("expenseNotes").value.trim()};
  return {id:$("transferEditId").value||uid(),type,date:$("transferDate").value,fromAccountId:$("transferFrom").value,toAccountId:$("transferTo").value,method:$("transferMethod").value,amount:Number($("transferAmount").value),notes:$("transferNotes").value.trim()};
}
function saveTransaction(type,e){
  e.preventDefault(); const t=transactionObject(type);
  if(!t.date||!t.amount||t.amount<=0)return toast("Enter valid date and amount");
  if(type==="transfer"){
    if(!t.fromAccountId||!t.toAccountId)return toast("Select both accounts");
    if(t.fromAccountId===t.toAccountId)return toast("From and To accounts must be different");
  }else if(!t.accountId)return toast("Select account");
  const editId= type==="income"?$("incomeEditId").value:type==="expense"?$("expenseEditId").value:$("transferEditId").value;
  if(editId){const i=db.transactions.findIndex(x=>x.id===editId);db.transactions[i]=t}else db.transactions.push(t);
  saveDB();resetTransactionForm(type);refreshAll();toast(editId?"Transaction updated":"Transaction saved")
}
function resetTransactionForm(type){
  const form=$(type+"Form"); form.reset(); $(type+"Date").value=today(); $(type+"EditId").value="";
}
window.editTransaction=id=>{
  const t=db.transactions.find(x=>x.id===id); if(!t)return;
  if(t.type==="income"){
    $("incomeEditId").value=t.id;$("incomeDate").value=t.date;$("incomeCategory").value=t.category;$("incomeParty").value=t.party||"";$("incomeAccount").value=t.accountId;$("incomeMethod").value=t.method;$("incomeAmount").value=t.amount;$("incomeNotes").value=t.notes||"";
  }else if(t.type==="expense"){
    $("expenseEditId").value=t.id;$("expenseDate").value=t.date;$("expenseCategory").value=t.category;$("expenseParty").value=t.party||"";$("expenseAccount").value=t.accountId;$("expenseMethod").value=t.method;$("expenseAmount").value=t.amount;$("expenseNotes").value=t.notes||"";
  }else{
    $("transferEditId").value=t.id;$("transferDate").value=t.date;$("transferFrom").value=t.fromAccountId;$("transferTo").value=t.toAccountId;$("transferMethod").value=t.method;$("transferAmount").value=t.amount;$("transferNotes").value=t.notes||"";
  }
  showPage(t.type); window.scrollTo({top:0,behavior:"smooth"})
}
window.deleteTransaction=id=>{if(confirm("Delete this transaction?")){db.transactions=db.transactions.filter(t=>t.id!==id);saveDB();refreshAll();toast("Transaction deleted")}}

function filteredTransactions(){
  const q=$("historySearch").value.toLowerCase().trim(), type=$("historyType").value, from=$("historyFrom").value, to=$("historyTo").value;
  return [...db.transactions].filter(t=>{
    if(type!=="all"&&t.type!==type)return false;
    if(from&&parseDate(t.date)<parseDate(from))return false;if(to&&parseDate(t.date)>parseDate(to))return false;
    const text=[t.type,t.category,t.party,t.notes,t.method,getAccountName(t.accountId),getAccountName(t.fromAccountId),getAccountName(t.toAccountId)].join(" ").toLowerCase();
    return !q||text.includes(q)
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))
}
function renderHistory(){
  const rows=filteredTransactions(); const body=$("historyBody");
  if(!rows.length){body.innerHTML='<tr><td colspan="6" class="empty">No transactions found.</td></tr>';return}
  body.innerHTML=rows.map(t=>{
    const details=t.type==="transfer"?`${escapeHtml(getAccountName(t.fromAccountId))} → ${escapeHtml(getAccountName(t.toAccountId))}`:`${escapeHtml(t.category)}${t.party?` · ${escapeHtml(t.party)}`:""}`;
    const account=t.type==="transfer"?escapeHtml(t.method):escapeHtml(getAccountName(t.accountId));
    const sign=t.type==="income"?"+":t.type==="expense"?"-":"";
    return `<tr><td>${fmtDate(t.date)}</td><td><span class="type-badge type-${t.type}">${t.type}</span></td><td>${details}</td><td>${account}</td><td class="amount-${t.type}">${sign}${money(t.amount)}</td><td><div class="row-actions"><button class="icon-btn edit" onclick="editTransaction('${t.id}')">Edit</button><button class="icon-btn delete" onclick="deleteTransaction('${t.id}')">Delete</button></div></td></tr>`
  }).join("")
}

function rangeStats(range){
  const tx=db.transactions.filter(t=>inRange(t.date,range));
  const income=tx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const expCat={};tx.filter(t=>t.type==="expense").forEach(t=>expCat[t.category]=(expCat[t.category]||0)+t.amount);
  const incCat={};tx.filter(t=>t.type==="income").forEach(t=>incCat[t.category]=(incCat[t.category]||0)+t.amount);
  const highest=Object.entries(expCat).sort((a,b)=>b[1]-a[1])[0]||["—",0];
  return {income,expense,net:income-expense,savings:income?((income-expense)/income*100):0,expCat,incCat,highest,tx}
}
function renderDashboard(){
  const r=dashRange||monthRange(), s=rangeStats(r);
  $("dashIncome").textContent=money(s.income);$("dashExpense").textContent=money(s.expense);$("dashBalance").textContent=money(s.net);$("dashSavings").textContent=`${s.savings.toFixed(1)}%`;
  $("dashHighest").textContent=money(s.highest[1]);$("dashHighestCat").textContent=s.highest[0];
  $("dashCards").textContent=money(db.accounts.filter(a=>a.type==="credit").reduce((sum,a)=>sum+accountComputed(a.id),0));
  $("periodLabel").textContent=`${fmtDate(r.from)} to ${fmtDate(r.to)}`;
  $("dashAccounts").innerHTML=db.accounts.length?db.accounts.map(a=>`<div class="list-row"><span>${escapeHtml(a.name)}</span><strong>${money(accountComputed(a.id))}</strong></div>`).join(""):'<div class="empty">No accounts added.</div>';
  const recent=[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,5);
  $("recentTransactions").innerHTML=recent.length?recent.map(t=>`<div class="list-row"><span>${fmtDate(t.date)} · ${t.type==="transfer"?"Transfer":escapeHtml(t.category)}</span><strong class="amount-${t.type}">${money(t.amount)}</strong></div>`).join(""):'<div class="empty">No transactions yet.</div>';
}
function barsHtml(obj){
  const entries=Object.entries(obj).sort((a,b)=>b[1]-a[1]), max=entries[0]?.[1]||1;
  if(!entries.length)return '<div class="empty">No data for selected period.</div>';
  return entries.map(([k,v])=>`<div class="bar-row"><span>${escapeHtml(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${(v/max)*100}%"></div></div><strong>${money(v)}</strong></div>`).join("")
}
function renderReports(){
  const r=reportRange||monthRange(),s=rangeStats(r);
  $("reportIncome").textContent=money(s.income);$("reportExpense").textContent=money(s.expense);$("reportNet").textContent=money(s.net);
  $("expenseReport").innerHTML=barsHtml(s.expCat);$("incomeReport").innerHTML=barsHtml(s.incCat)
}
function refreshAll(){renderAccountOptions();renderAccounts();renderHistory();renderDashboard();renderReports()}

function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  $("nav").classList.remove("open")
}

function downloadBackup(){
  const blob=new Blob([JSON.stringify({version:"3.1",exportedAt:new Date().toISOString(),data:db},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`My-Finance-Backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)
}
function restoreBackup(){
  const f=$("restoreFile").files[0];if(!f)return toast("Choose a backup file");
  const reader=new FileReader();reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result), data=parsed.data||parsed;
      if(!Array.isArray(data.accounts)||!Array.isArray(data.transactions))throw new Error();
      if(confirm("Replace current data with this backup?")){db=data;saveDB();refreshAll();toast("Backup restored")}
    }catch{alert("Invalid backup file")}
  };reader.readAsText(f)
}

document.addEventListener("DOMContentLoaded",()=>{
  loadDB();
  fillSelect("incomeCategory",incomeCategories);fillSelect("expenseCategory",expenseCategories);
  ["incomeMethod","expenseMethod","transferMethod"].forEach(id=>fillSelect(id,paymentMethods));
  ["incomeDate","expenseDate","transferDate"].forEach(id=>$(id).value=today());
  const mr=monthRange();["dashFrom","reportFrom"].forEach(id=>$(id).value=mr.from);["dashTo","reportTo"].forEach(id=>$(id).value=mr.to);

  document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $("menuBtn").onclick=()=>$("nav").classList.toggle("open");
  $("accountType").onchange=()=>$("limitWrap").classList.toggle("hidden",$("accountType").value!=="credit");
  $("accountForm").onsubmit=saveAccount;$("cancelAccountEdit").onclick=resetAccountForm;
  $("incomeForm").onsubmit=e=>saveTransaction("income",e);$("expenseForm").onsubmit=e=>saveTransaction("expense",e);$("transferForm").onsubmit=e=>saveTransaction("transfer",e);
  $("cancelIncomeEdit").onclick=()=>resetTransactionForm("income");$("cancelExpenseEdit").onclick=()=>resetTransactionForm("expense");$("cancelTransferEdit").onclick=()=>resetTransactionForm("transfer");
  ["historySearch","historyType","historyFrom","historyTo"].forEach(id=>$(id).addEventListener("input",renderHistory));
  $("clearHistoryFilters").onclick=()=>{$("historySearch").value="";$("historyType").value="all";$("historyFrom").value="";$("historyTo").value="";renderHistory()};
  $("applyDashFilter").onclick=()=>{if(!$("dashFrom").value||!$("dashTo").value)return toast("Select both dates");dashRange={from:$("dashFrom").value,to:$("dashTo").value};renderDashboard()};
  $("resetDashFilter").onclick=()=>{dashRange=monthRange();$("dashFrom").value=dashRange.from;$("dashTo").value=dashRange.to;renderDashboard()};
  $("applyReport").onclick=()=>{if(!$("reportFrom").value||!$("reportTo").value)return toast("Select both dates");reportRange={from:$("reportFrom").value,to:$("reportTo").value};renderReports()};
  $("resetReport").onclick=()=>{reportRange=monthRange();$("reportFrom").value=reportRange.from;$("reportTo").value=reportRange.to;renderReports()};
  $("downloadBackup").onclick=downloadBackup;$("restoreBackup").onclick=restoreBackup;
  $("resetAllData").onclick=()=>{if(confirm("Delete all accounts and transactions?")){db={accounts:[],transactions:[]};saveDB();refreshAll();toast("All data deleted")}};
  refreshAll()
});
