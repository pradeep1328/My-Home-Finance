let chart;

function getNumber(id) {
    return Number(document.getElementById(id).value) || 0;
}

function calculate() {
    const income = getNumber("income");
    const groceries = getNumber("groceries");
    const petrol = getNumber("petrol");
    const emi = getNumber("emi");
    const insurance = getNumber("insurance");
    const school = getNumber("school");
    const mobile = getNumber("mobile");
    const other = getNumber("other");

    const totalExpense =
        groceries +
        petrol +
        emi +
        insurance +
        school +
        mobile +
        other;

    const balance = income - totalExpense;

    document.getElementById("totalExpense").textContent =
        totalExpense.toLocaleString("en-IN");

    document.getElementById("balance").textContent =
        balance.toLocaleString("en-IN");

    document.getElementById("incomeCard").textContent =
        "₹" + income.toLocaleString("en-IN");

    document.getElementById("expenseCard").textContent =
        "₹" + totalExpense.toLocaleString("en-IN");

    document.getElementById("balanceCard").textContent =
        "₹" + balance.toLocaleString("en-IN");

    if (balance >= 0) {
        document.getElementById("balance").style.color = "green";
        document.getElementById("balanceCard").style.color = "white";
    } else {
        document.getElementById("balance").style.color = "red";
        document.getElementById("balanceCard").style.color = "#ffeb3b";
    }

    createExpenseChart({
        groceries,
        petrol,
        emi,
        insurance,
        school,
        mobile,
        other
    });
}

function createExpenseChart(expenses) {
    const chartCanvas = document.getElementById("expenseChart");

    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const values = [
        expenses.groceries,
        expenses.petrol,
        expenses.emi,
        expenses.insurance,
        expenses.school,
        expenses.mobile,
        expenses.other
    ];

    if (chart) {
        chart.destroy();
    }

    if (typeof ChartDataLabels !== "undefined") {
        Chart.register(ChartDataLabels);
    }

    chart = new Chart(chartCanvas, {
        type: "pie",

        data: {
            labels: [
                "Groceries",
                "Petrol",
                "EMI",
                "Insurance",
                "School",
                "Mobile",
                "Other"
            ],

            datasets: [{
                data: values,

                backgroundColor: [
                    "#4caf50",
                    "#2196f3",
                    "#ff9800",
                    "#e91e63",
                    "#9c27b0",
                    "#00bcd4",
                    "#795548"
                ],

                borderColor: "#ffffff",
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: true,

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = Number(context.raw) || 0;
                            const total = context.dataset.data.reduce(
                                function (sum, currentValue) {
                                    return sum + Number(currentValue);
                                },
                                0
                            );

                            const percentage =
                                total > 0
                                    ? ((value / total) * 100).toFixed(1)
                                    : "0.0";

                            return (
                                context.label +
                                ": ₹" +
                                value.toLocaleString("en-IN") +
                                " (" +
                                percentage +
                                "%)"
                            );
                        }
                    }
                },

                datalabels: {
                    color: "#ffffff",

                    font: {
                        weight: "bold",
                        size: 13
                    },

                    formatter: function (value, context) {
                        const data =
                            context.chart.data.datasets[0].data;

                        const total = data.reduce(
                            function (sum, currentValue) {
                                return sum + Number(currentValue);
                            },
                            0
                        );

                        if (value === 0 || total === 0) {
                            return "";
                        }

                        const percentage =
                            ((value / total) * 100).toFixed(1);

                        return percentage + "%";
                    }
                }
            }
        }
    });
}

function saveData() {
    const month = document.getElementById("month").value;

    const fields = [
        "income",
        "groceries",
        "petrol",
        "emi",
        "insurance",
        "school",
        "mobile",
        "other"
    ];

    fields.forEach(function (field) {
        localStorage.setItem(
            month + "_" + field,
            document.getElementById(field).value
        );
    });

    calculate();

    alert("Data Saved Successfully!");
}

function loadData() {
    const month = document.getElementById("month").value;

    const fields = [
        "income",
        "groceries",
        "petrol",
        "emi",
        "insurance",
        "school",
        "mobile",
        "other"
    ];

    fields.forEach(function (field) {
        document.getElementById(field).value =
            localStorage.getItem(month + "_" + field) || "";
    });

    calculate();
}

function resetData() {
    const month = document.getElementById("month").value;

    const confirmReset = confirm(
        month + " month data మొత్తం delete చేయాలా?"
    );

    if (!confirmReset) {
        return;
    }

    const fields = [
        "income",
        "groceries",
        "petrol",
        "emi",
        "insurance",
        "school",
        "mobile",
        "other"
    ];

    fields.forEach(function (field) {
        localStorage.removeItem(month + "_" + field);
    });

    loadData();

    alert("Data Reset Successfully!");
}

window.addEventListener("load", function () {
    const monthSelect = document.getElementById("month");

    const currentMonth = new Date().toLocaleString("en-US", {
        month: "long"
    });

    if (monthSelect) {
        monthSelect.value = currentMonth;
        monthSelect.addEventListener("change", loadData);
    }

    loadData();
});
