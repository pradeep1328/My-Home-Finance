function calculate() {

    let income = Number(document.getElementById("income").value) || 0;
    let groceries = Number(document.getElementById("groceries").value) || 0;
    let petrol = Number(document.getElementById("petrol").value) || 0;
    let emi = Number(document.getElementById("emi").value) || 0;
    let insurance = Number(document.getElementById("insurance").value) || 0;
    let school = Number(document.getElementById("school").value) || 0;
    let mobile = Number(document.getElementById("mobile").value) || 0;
    let other = Number(document.getElementById("other").value) || 0;

    let totalExpense =
        groceries +
        petrol +
        emi +
        insurance +
        school +
        mobile +
        other;

    let balance = income - totalExpense;

    document.getElementById("totalExpense").innerHTML =
        totalExpense.toLocaleString("en-IN");

    document.getElementById("balance").innerHTML =
        balance.toLocaleString("en-IN");
document.getElementById("incomeCard").innerHTML =
    "₹" + income.toLocaleString("en-IN");

document.getElementById("expenseCard").innerHTML =
    "₹" + totalExpense.toLocaleString("en-IN");

document.getElementById("balanceCard").innerHTML =
    "₹" + balance.toLocaleString("en-IN");
    if (balance >= 0) {
        document.getElementById("balance").style.color = "green";
    } else {
        document.getElementById("balance").style.color = "red";
    }
}

function saveData() {

    let month = document.getElementById("month").value;
    
    localStorage.setItem(month + "_income", document.getElementById("income").value);
    localStorage.setItem(month + "_groceries", document.getElementById("groceries").value);
    localStorage.setItem(month + "_petrol", document.getElementById("petrol").value);
    localStorage.setItem(month + "_emi", document.getElementById("emi").value);
    localStorage.setItem(month + "_insurance", document.getElementById("insurance").value);
    localStorage.setItem(month + "_school", document.getElementById("school").value);
    localStorage.setItem(month + "_mobile", document.getElementById("mobile").value);
    localStorage.setItem(month + "_other", document.getElementById("other").value);
    
    alert("Data Saved Successfully!");
}

function resetData() {

    localStorage.clear();
    location.reload();

}

window.onload = function () {

    let month = document.getElementById("month").value;

    document.getElementById("income").value = localStorage.getItem(month + "_income") || "";
    document.getElementById("groceries").value = localStorage.getItem("groceries") || "";
    document.getElementById("petrol").value = localStorage.getItem("petrol") || "";
    document.getElementById("emi").value = localStorage.getItem("emi") || "";
    document.getElementById("insurance").value = localStorage.getItem("insurance") || "";
    document.getElementById("school").value = localStorage.getItem("school") || "";
    document.getElementById("mobile").value = localStorage.getItem("mobile") || "";
    document.getElementById("other").value = localStorage.getItem("other") || "";

};
