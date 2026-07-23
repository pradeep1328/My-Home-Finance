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
