function calculateLoan() {

    const amount =
    parseFloat(document.getElementById("loanAmount").value);

    const months =
    parseInt(document.getElementById("loanMonths").value);

    if (!amount || !months) {

        document.getElementById("loanResult").innerHTML =
        "Please enter a valid amount and duration.";

        return;
    }

    const annualRate = 0.02;

    const monthlyRate =
    annualRate / 12;

    const monthlyPayment =
    amount *
    monthlyRate /
    (1 - Math.pow(1 + monthlyRate, -months));

    const totalPayment =
    monthlyPayment * months;

    const totalInterest =
    totalPayment - amount;

    document.getElementById("loanResult").innerHTML = `
        <h3>Loan Results</h3>
        <p><strong>Loan Amount:</strong> €${amount.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${months} months</p>
        <p><strong>Interest Rate:</strong> 2% per year</p>
        <p><strong>Monthly Payment:</strong> €${monthlyPayment.toFixed(2)}</p>
        <p><strong>Total Interest:</strong> €${totalInterest.toFixed(2)}</p>
        <p><strong>Total Repayment:</strong> €${totalPayment.toFixed(2)}</p>
    `;

    let balance = amount;

    let tableHTML = `
    <table>
        <thead>
            <tr>
                <th>Month</th>
                <th>Payment</th>
                <th>Interest</th>
                <th>Principal</th>
                <th>Remaining Balance</th>
            </tr>
        </thead>
        <tbody>
    `;

    for(let month = 1; month <= months; month++){

        let interest =
        balance * monthlyRate;

        let principal =
        monthlyPayment - interest;

        balance =
        balance - principal;

        if(balance < 0){
            balance = 0;
        }

        tableHTML += `
        <tr>
            <td>${month}</td>
            <td>€${monthlyPayment.toFixed(2)}</td>
            <td>€${interest.toFixed(2)}</td>
            <td>€${principal.toFixed(2)}</td>
            <td>€${balance.toFixed(2)}</td>
        </tr>
        `;
    }

    tableHTML += `
        </tbody>
    </table>
    `;

    document.getElementById("amortizationTable").innerHTML =
    tableHTML;
}