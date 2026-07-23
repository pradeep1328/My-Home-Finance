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

    if (balance >= 0) {
        document.getElementById("balance").style.color = "green";
    } else {
        document.getElementById("balance").style.color = "red";
    }
}

function saveData() {

    localStorage.setItem("income", document.getElementById("income").value);
    localStorage.setItem("groceries", document.getElementById("groceries").value);
    localStorage.setItem("petrol", document.getElementById("petrol").value);
    localStorage.setItem("emi", document.getElementById("emi").value);
    localStorage.setItem("insurance", document.getElementById("insurance").value);
    localStorage.setItem("school", document.getElementById("school").value);
    localStorage.setItem("mobile", document.getElementById("mobile").value);
    localStorage.setItem("other", document.getElementById("other").value);

    alert("Data Saved Successfully!");
}

function resetData() {

    localStorage.clear();
    location.reload();

}
