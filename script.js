const K={a:'mf_accounts_v21',t:'mf_transactions_v21'},M=['Google Pay','PhonePe','Paytm','CRED Pay','Bank Transfer','Debit Card','Credit Card','Net Banking','Cash','Auto Debit','Cheque'];const $=i=>document.getElementById(i),G=k=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),A=()=>G(K.a),T=()=>G(K.t),N=i=>Number($(i).value)||0,U=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7),D=()=>new Date().toISOString().slice(0,10),R=n=>'₹'+Number(n||0).toLocaleString('en-IN'),E=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));document.addEventListener('DOMContentLoaded',init);
function init(){document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.page).classList.add('active');refresh()});$('dashMonth').value=D().slice(0,7);['inDate','exDate','trDate'].forEach(i=>$(i).value=D());['inMethod','exMethod'].forEach(i=>M.forEach(m=>$(i).add(new Option(m,m))));$('accType').onchange=fields;$('saveAcc').onclick=saveAcc;$('cancelAcc').onclick=clearAcc;$('accFilter').onchange=renderAcc;$('saveIn').onclick=saveIn;$('cancelIn').onclick=clearIn;$('saveEx').onclick=saveEx;$('cancelEx').onclick=clearEx;$('saveTr').onclick=saveTr;$('cancelTr').onclick=clearTr;['hSearch','hType','hMonth','hAcc'].forEach(i=>$(i).oninput=renderHistory);$('clearFilters').onclick=()=>{$('hSearch').value='';$('hType').value='All';$('hMonth').value='';$('hAcc').value='All';renderHistory()};$('dashMonth').onchange=dashboard;fields();refresh()}
function refresh(){selects();people();renderAcc();renderHistory();dashboard()}
function selects(){let l=A().filter(a=>a.active);['inAcc','exAcc','trFrom','trTo'].forEach(i=>{let v=$(i).value;$(i).innerHTML='<option value="">Select Account</option>';l.forEach(a=>$(i).add(new Option(a.name+' ('+a.type+')',a.id)));$(i).value=v});let v=$('hAcc').value;$('hAcc').innerHTML='<option value="All">All Accounts</option>';A().forEach(a=>$('hAcc').add(new Option(a.name,a.id)));$('hAcc').value=v||'All'}
function people(){let n=[...new Set(T().map(t=>t.party).filter(Boolean))];$('people').innerHTML=n.map(x=>`<option value="${E(x)}">`).join('')}
function fields(){let c=$('accType').value==='Credit Card';document.querySelectorAll('.credit').forEach(x=>x.classList.toggle('hidden',!c));document.querySelectorAll('.normal').forEach(x=>x.classList.toggle('hidden',c))}
function saveAcc(){let id=$('accId').value,name=$('accName').value.trim(),type=$('accType').value;if(!name)return alert('Account name enter చేయండి.');let l=A(),o=l.find(x=>x.id===id),a={id:id||U(),name,type,opening:type==='Credit Card'?0:N('accOpening'),limit:type==='Credit Card'?N('accLimit'):0,outstanding:type==='Credit Card'?N('accOutstanding'):0,bill:type==='Credit Card'?N('accBill'):0,due:type==='Credit Card'?N('accDue'):0,notes:$('accNotes').value.trim(),active:o?o.active:true};l=id?l.map(x=>x.id===id?a:x):[...l,a];S(K.a,l);clearAcc();refresh();alert(id?'Account updated.':'Account saved.')}
function clearAcc(){['accId','accName','accOpening','accLimit','accOutstanding','accBill','accDue','accNotes'].forEach(i=>$(i).value='');$('accType').value='Bank';$('accTitle').textContent='Add Account';$('saveAcc').textContent='Save Account';$('cancelAcc').classList.add('hidden');fields()}
function bal(id){let a=A().find(x=>x.id===id);if(!a)return 0;let v=a.type==='Credit Card'?Number(a.outstanding):Number(a.opening);T().forEach(t=>{if(t.type==='Income'&&t.accountId===id&&a.type!=='Credit Card')v+=+t.amount;if(t.type==='Expense'&&t.accountId===id)v+=a.type==='Credit Card'?+t.amount:-t.amount;if(t.type==='Transfer'){if(t.from===id)v+=a.type==='Credit Card'?+t.amount:-t.amount;if(t.to===id)v+=a.type==='Credit Card'?-t.amount:+t.amount}});return v}
function renderAcc(){let f=$('accFilter').value,l=A().filter(a=>f==='All'||f===a.type||(f==='Active'&&a.active)||(f==='Inactive'&&!a.active));$('accList').innerHTML=l.length?`<div class='account-grid'>${l.map(a=>`<article class='account ${a.active?'':'inactive'}'><div class='between'><div><b>${E(a.name)}</b><div class='muted'>${a.type}</div></div><span class='badge'>${a.active?'Active':'Inactive'}</span></div><div class='details'>${a.type==='Credit Card'?`<div class='detail'><span>Outstanding</span><b>${R(bal(a.id))}</b></div><div class='detail'><span>Available Limit</span><b>${R(Math.max(0,a.limit-bal(a.id)))}</b></div><div class='detail'><span>Bill / Due</span><b>${a.bill||'-'} / ${a.due||'-'}</b></div>`:`<div class='detail'><span>Current Balance</span><b>${R(bal(a.id))}</b></div>`}${a.notes?`<div class='muted'>${E(a.notes)}</div>`:''}</div><div class='card-actions'><button class='mini edit' onclick="editAcc('${a.id}')">Edit</button><button class='mini toggle' onclick="toggleAcc('${a.id}')">${a.active?'Deactivate':'Activate'}</button><button class='mini delete' onclick="delAcc('${a.id}')">Delete</button></div></article>`).join('')}</div>`:'<div class="empty">No accounts found.</div>'}
function editAcc(id){let a=A().find(x=>x.id===id);$('accId').value=a.id;$('accName').value=a.name;$('accType').value=a.type;$('accOpening').value=a.opening||'';$('accLimit').value=a.limit||'';$('accOutstanding').value=a.outstanding||'';$('accBill').value=a.bill||'';$('accDue').value=a.due||'';$('accNotes').value=a.notes||'';$('accTitle').textContent='Edit Account';$('saveAcc').textContent='Update Account';$('cancelAcc').classList.remove('hidden');fields();scrollTo({top:0,behavior:'smooth'})}
function toggleAcc(id){let l=A(),a=l.find(x=>x.id===id);a.active=!a.active;S(K.a,l);refresh()}
function delAcc(id){if(T().some(t=>t.accountId===id||t.from===id||t.to===id))return alert('This account has transactions. Deactivate it or delete transactions first.');if(confirm('Delete this account?')){S(K.a,A().filter(x=>x.id!==id));refresh()}}
function up(t){let l=T(),i=l.findIndex(x=>x.id===t.id);i>=0?l[i]=t:l.push(t);S(K.t,l)}
function saveIn(){let id=$('inId').value,a=$('inAcc').value,m=N('inAmount');if(!a||m<=0)return alert('Account select చేసి amount enter చేయండి.');up({id:id||U(),type:'Income',date:$('inDate').value,category:$('inCat').value,party:$('inParty').value.trim(),accountId:a,method:$('inMethod').value,amount:m,notes:$('inNotes').value.trim()});clearIn();refresh();alert(id?'Income updated.':'Income saved.')}
function saveEx(){let id=$('exId').value,a=$('exAcc').value,m=N('exAmount');if(!a||m<=0)return alert('Account select చేసి amount enter చేయండి.');up({id:id||U(),type:'Expense',date:$('exDate').value,category:$('exCat').value,party:$('exParty').value.trim(),accountId:a,method:$('exMethod').value,amount:m,notes:$('exNotes').value.trim()});clearEx();refresh();alert(id?'Expense updated.':'Expense saved.')}
function saveTr(){let id=$('trId').value,f=$('trFrom').value,t=$('trTo').value,m=N('trAmount');if(!f||!t||m<=0)return alert('From, To accounts select చేసి amount enter చేయండి.');if(f===t)return alert('From and To same account ఉండకూడదు.');up({id:id||U(),type:'Transfer',date:$('trDate').value,from:f,to:t,amount:m,notes:$('trNotes').value.trim()});clearTr();refresh();alert(id?'Transfer updated.':'Transfer saved.')}
function clearIn(){['inId','inParty','inAmount','inNotes'].forEach(i=>$(i).value='');$('inDate').value=D();$('inAcc').value='';$('saveIn').textContent='Save Income';$('cancelIn').classList.add('hidden')}
function clearEx(){['exId','exParty','exAmount','exNotes'].forEach(i=>$(i).value='');$('exDate').value=D();$('exAcc').value='';$('saveEx').textContent='Save Expense';$('cancelEx').classList.add('hidden')}
function clearTr(){['trId','trAmount','trNotes'].forEach(i=>$(i).value='');$('trDate').value=D();$('trFrom').value='';$('trTo').value='';$('saveTr').textContent='Save Transfer';$('cancelTr').classList.add('hidden')}
function name(id){return A().find(a=>a.id===id)?.name||'Unknown'}function date(s){let [y,m,d]=s.split('-');return `${d}-${m}-${y}`}
function renderHistory(){let q=$('hSearch').value.toLowerCase(),ty=$('hType').value,mo=$('hMonth').value,ac=$('hAcc').value,l=[...T()].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).filter(t=>{let text=[t.category,t.party,t.notes,name(t.accountId),name(t.from),name(t.to)].join(' ').toLowerCase();return(!q||text.includes(q))&&(ty==='All'||t.type===ty)&&(!mo||t.date.startsWith(mo))&&(ac==='All'||t.accountId===ac||t.from===ac||t.to===ac)});$('txList').innerHTML=l.length?l.map(tx=>{let title,sub;if(tx.type==='Income'){title=`${E(tx.category)}${tx.party?' • '+E(tx.party):''}`;sub=`Received in ${E(name(tx.accountId))} • ${E(tx.method)}`}if(tx.type==='Expense'){title=`${E(tx.category)}${tx.party?' • '+E(tx.party):''}`;sub=`Paid from ${E(name(tx.accountId))} • ${E(tx.method)}`}if(tx.type==='Transfer'){title=`${E(name(tx.from))} → ${E(name(tx.to))}`;sub=E(tx.notes||'Account transfer')}return `<div class='tx'><div>${date(tx.date)}</div><span class='badge-type ${tx.type}'>${tx.type}</span><div><b>${title}</b><div class='muted'>${sub}</div></div><b class='amount ${tx.type==='Income'?'plus':tx.type==='Expense'?'minus':'move'}'>${tx.type==='Income'?'+':tx.type==='Expense'?'-':''}${R(tx.amount)}</b><div class='tx-actions'><button class='mini edit' onclick="editTx('${tx.id}')">Edit</button> <button class='mini delete' onclick="delTx('${tx.id}')">Delete</button></div></div>`}).join(''):'<div class="empty">No transactions found.</div>'}
function editTx(id){let t=T().find(x=>x.id===id);document.querySelector(`[data-page="${t.type.toLowerCase()}"]`).click();if(t.type==='Income'){$('inId').value=t.id;$('inDate').value=t.date;$('inCat').value=t.category;$('inParty').value=t.party||'';$('inAcc').value=t.accountId;$('inMethod').value=t.method;$('inAmount').value=t.amount;$('inNotes').value=t.notes||'';$('saveIn').textContent='Update Income';$('cancelIn').classList.remove('hidden')}if(t.type==='Expense'){$('exId').value=t.id;$('exDate').value=t.date;$('exCat').value=t.category;$('exParty').value=t.party||'';$('exAcc').value=t.accountId;$('exMethod').value=t.method;$('exAmount').value=t.amount;$('exNotes').value=t.notes||'';$('saveEx').textContent='Update Expense';$('cancelEx').classList.remove('hidden')}if(t.type==='Transfer'){$('trId').value=t.id;$('trDate').value=t.date;$('trFrom').value=t.from;$('trTo').value=t.to;$('trAmount').value=t.amount;$('trNotes').value=t.notes||'';$('saveTr').textContent='Update Transfer';$('cancelTr').classList.remove('hidden')}}
function delTx(id){if(confirm('Delete this transaction?')){S(K.t,T().filter(x=>x.id!==id));refresh()}}
function dashboard(){let mo=$('dashMonth').value,l=T().filter(t=>t.date.startsWith(mo)),inc=l.filter(t=>t.type==='Income').reduce((s,t)=>s+ +t.amount,0),ex=l.filter(t=>t.type==='Expense').reduce((s,t)=>s+ +t.amount,0),a=A();$('dIncome').textContent=R(inc);$('dExpense').textContent=R(ex);$('dBalance').textContent=R(inc-ex);$('dCash').textContent=R(a.filter(x=>x.type!=='Credit Card').reduce((s,x)=>s+bal(x.id),0));$('dCard').textContent=R(a.filter(x=>x.type==='Credit Card').reduce((s,x)=>s+bal(x.id),0));$('dCount').textContent=a.length;let r=[...T()].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,5);$('recent').innerHTML=r.length?r.map(t=>`<div class='detail'><span>${t.type} • ${date(t.date)}</span><b>${R(t.amount)}</b></div>`).join(''):'<div class="empty">No transactions yet.</div>';let c={};l.filter(t=>t.type==='Expense').forEach(t=>c[t.category]=(c[t.category]||0)+ +t.amount);let max=Math.max(1,...Object.values(c));$('categories').innerHTML=Object.keys(c).length?Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class='barrow'><span>${E(k)}</span><div class='bar'><span style='width:${v/max*100}%'></span></div><b>${R(v)}</b></div>`).join(''):'<div class="empty">No expenses this month.</div>'}


function dateText(d){
  return d.toISOString().slice(0,10);
}
function presetDates(preset){
  const now=new Date();
  let from=new Date(now),to=new Date(now);
  if(preset==="today"){}
  else if(preset==="yesterday"){from.setDate(from.getDate()-1);to=new Date(from)}
  else if(preset==="thisWeek"){
    const day=(now.getDay()+6)%7;
    from.setDate(now.getDate()-day);
  }
  else if(preset==="lastMonth"){
    from=new Date(now.getFullYear(),now.getMonth()-1,1);
    to=new Date(now.getFullYear(),now.getMonth(),0);
  }
  else if(preset==="thisYear"){
    from=new Date(now.getFullYear(),0,1);
    to=new Date(now.getFullYear(),11,31);
  }
  else{
    from=new Date(now.getFullYear(),now.getMonth(),1);
    to=new Date(now.getFullYear(),now.getMonth()+1,0);
  }
  return {from:dateText(from),to:dateText(to)};
}
function applyPreset(prefix){
  const preset=$(prefix+"Preset").value;
  if(preset!=="custom"){
    const range=presetDates(preset);
    $(prefix+"From").value=range.from;
    $(prefix+"To").value=range.to;
  }
  if(prefix==="dashboard")renderDashboard();else renderReports();
}
function categoryHtml(cats){
  const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...entries.map(x=>x[1]));
  return entries.length?entries.map(([k,v])=>`<div class="category-row"><span>${esc(k)}</span><div class="bar"><span style="width:${v/max*100}%"></span></div><b>${money(v)}</b></div>`).join(""):'<div class="empty">No expenses for selected dates.</div>';
}
function renderReports(){
  const from=$("reportFrom").value,to=$("reportTo").value;
  const list=transactions().filter(t=>(!from||t.date>=from)&&(!to||t.date<=to));
  const income=list.filter(t=>t.type==="Income").reduce((s,t)=>s+Number(t.amount),0);
  const expense=list.filter(t=>t.type==="Expense").reduce((s,t)=>s+Number(t.amount),0);
  const savings=income-expense;
  $("reportIncome").textContent=money(income);
  $("reportExpense").textContent=money(expense);
  $("reportSavings").textContent=money(savings);
  $("reportSavingsPercent").textContent=income>0?`${((savings/income)*100).toFixed(1)}%`:"0%";

  const cats={};
  list.filter(t=>t.type==="Expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+Number(t.amount));
  $("reportCategorySummary").innerHTML=categoryHtml(cats);

  const acc=accounts();
  $("reportAccountBalances").innerHTML=acc.length?acc.map(a=>`<div class="account-report-row"><span>${esc(a.name)} <small class="muted">(${a.type})</small></span><b>${money(accountBalance(a.id))}</b></div>`).join(""):'<div class="empty">No accounts found.</div>';

  const months={};
  list.forEach(t=>{
    const m=t.date.slice(0,7);
    if(!months[m])months[m]={income:0,expense:0};
    if(t.type==="Income")months[m].income+=Number(t.amount);
    if(t.type==="Expense")months[m].expense+=Number(t.amount);
  });
  const entries=Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0]));
  const max=Math.max(1,...entries.flatMap(([,v])=>[v.income,v.expense]));
  $("monthlyTrend").innerHTML=entries.length?entries.map(([m,v])=>{
    const label=new Date(m+"-01").toLocaleString("en-IN",{month:"short",year:"numeric"});
    return `<div class="trend-row"><b>${label}</b><div class="trend-bars"><div class="trend-bar trend-income"><span style="width:${v.income/max*100}%"></span></div><div class="trend-bar trend-expense"><span style="width:${v.expense/max*100}%"></span></div></div><span class="trend-income-value">Income ${money(v.income)}</span><span class="trend-expense-value">Expense ${money(v.expense)}</span></div>`;
  }).join(""):'<div class="empty">No report data for selected dates.</div>';
}
function downloadBackup(){
  const data={
    app:"My Finance",
    version:"2.2",
    exportedAt:new Date().toISOString(),
    accounts:accounts(),
    transactions:transactions()
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`my-finance-backup-${today()}.json`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function restoreBackup(){
  const file=$("restoreFile").files[0];
  if(!file)return alert("Backup file select చేయండి.");
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!Array.isArray(data.accounts)||!Array.isArray(data.transactions))throw new Error("Invalid");
      if(!confirm("Existing data replace చేసి backup restore చేయాలా?"))return;
      save(STORAGE.accounts,data.accounts);
      save(STORAGE.transactions,data.transactions);
      $("restoreFile").value="";
      refreshAll();renderReports();
      alert("Backup restored successfully.");
    }catch(e){alert("Invalid backup file.");}
  };
  reader.readAsText(file);
}
function clearAllData(){
  if(confirm("Accounts and transactions అన్నీ permanently delete చేయాలా?")){
    if(confirm("Final confirmation: ఈ action undo చేయలేరు.")){
      localStorage.removeItem(STORAGE.accounts);
      localStorage.removeItem(STORAGE.transactions);
      refreshAll();renderReports();
      alert("All data deleted.");
    }
  }
}
