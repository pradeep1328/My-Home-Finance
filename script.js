function calculate() {

    let income = document.getElementById("income").value;
    let expense = document.getElementById("expense").value;

    let balance = income - expense;

    document.getElementById("balance").innerHTML = balance;
}
