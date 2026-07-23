function calculate() {

    let income = Number(document.getElementById("income").value);
    let expense = Number(document.getElementById("expense").value);

    if (income === 0 && expense === 0) {
        alert("Please enter Income and Expense.");
        return;
    }

    let balance = income - expense;

    document.getElementById("balance").innerHTML = balance.toLocaleString("en-IN");

    if (balance < 0) {
        document.getElementById("balance").style.color = "red";
    } else {
        document.getElementById("balance").style.color = "green";
    }
}
