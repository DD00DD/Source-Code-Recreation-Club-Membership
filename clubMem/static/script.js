if (document.getElementById('membersTable')) {
    window.onload = fetchMembers;
}

function addMember(event) {
    event.preventDefault(); 
    const name = document.getElementById('newMemberName').value;
    const email = document.getElementById('newMemberEmail').value;

    fetch('/members', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, email: email })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        fetchMembers(); 
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function fetchMembers() {
    fetch('/members')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('membersTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; 
        data.forEach(member => {
            let row = `<tr>
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.attendance_count}</td>
                <td>${member.paid_times}</td>
                <td>${member.not_paid_times}</td>
                <td>
                    <button onclick="removeMember(${member.id})">Remove</button>
                    <button onclick="applyDiscount(${member.id})">Apply 10% Discount</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    });
}

function searchMembers() {
    var input, filter, table, tr, tdName, tdEmail, i, txtValueName, txtValueEmail;
    input = document.getElementById("searchBox");
    filter = input.value.toUpperCase();
    table = document.getElementById("membersTable");
    tr = table.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
        tdName = tr[i].getElementsByTagName("td")[0]; 
        tdEmail = tr[i].getElementsByTagName("td")[1]; 
        if (tdName || tdEmail) {
            txtValueName = tdName ? tdName.textContent || tdName.innerText : "";
            txtValueEmail = tdEmail ? tdEmail.textContent || tdEmail.innerText : "";
            if (txtValueName.toUpperCase().indexOf(filter) > -1 || txtValueEmail.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
}

function sortMembers(sortBy) {
    const tableBody = document.getElementById('membersTable').getElementsByTagName('tbody')[0];
    let rows = Array.from(tableBody.getElementsByTagName('tr'));

    rows.sort(function(a, b) {
        var valA, valB;
        switch(sortBy) {
            case "name":
                valA = a.getElementsByTagName("td")[0].textContent.toUpperCase();
                valB = b.getElementsByTagName("td")[0].textContent.toUpperCase();
                break;
            case "attendance":
                valA = parseInt(a.getElementsByTagName("td")[2].textContent);
                valB = parseInt(b.getElementsByTagName("td")[2].textContent);
                break;
            case "paid":
                valA = parseInt(a.getElementsByTagName("td")[3].textContent);
                valB = parseInt(b.getElementsByTagName("td")[3].textContent);
                break;
            case "notPaid":
                valA = parseInt(a.getElementsByTagName("td")[4].textContent);
                valB = parseInt(b.getElementsByTagName("td")[4].textContent);
                break;
        }
        return valA < valB ? -1 : (valA > valB ? 1 : 0);
    });

    tableBody.innerHTML = '';
    rows.forEach(function(row) {
        tableBody.appendChild(row);
    });
}

function removeMember(memberId) {
    if (!confirm("Are you sure you want to remove this member?")) {
        return; 
    }

    fetch(`/members/${memberId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert('Member removed successfully'); 
        fetchMembers();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error removing member');
    });
}

function applyFilters() {
    const month = document.getElementById('monthFilter').value;
    const revenueType = document.getElementById('revenueTypeFilter').value;
    const expenseType = document.getElementById('expenseTypeFilter').value;
    const queryParams = new URLSearchParams({
        month: month,
        revenue_type: revenueType,
        expense_type: expenseType
    }).toString();
    console.log(`Query Params: ${queryParams}`); 
    fetch(`/api/finances?${queryParams}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        buildMonthlyFinancialDataTable(data.financial_details);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function handleAddIncome(e) {
    e.preventDefault();
    const incomeType = document.getElementById('incomeType').value;
    const incomeMonth = document.getElementById('incomeMonth').value;
    const incomeAmount = parseFloat(document.getElementById('incomeAmount').value);

    fetch('/add_income', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: incomeType, month: incomeMonth, amount: incomeAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Income added successfully') {
            fetchFinancialData();
        } else {
            console.error('Failed to add income:', data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function handleAddExpense(e) {
    e.preventDefault();
    const expenseType = document.getElementById('expenseType').value;
    const expenseMonth = document.getElementById('expenseMonth').value;
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value);

    fetch('/add_expense', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: expenseType, month: expenseMonth, amount: expenseAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Expense added successfully') {
            fetchFinancialData(); 
        } else {
            console.error('Failed to add expense:', data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchFinancialData() {
    console.log('fetchFinancialData called');
    fetch('/api/finances')
    .then(response => response.json())
    .then(data => {
        console.log('Fetched data:', data);
        buildMonthlyFinancialDataTable(data.financial_details);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}    

if (document.getElementById('membersTable')) {
    function applyDiscount(memberId) {
        fetch(`/members/${memberId}/discount`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ discount: 10 })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Discount applied successfully');
            fetchMembers(); 
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error applying discount'); 
        });
    }
}

const orderedMonths = ['January', 'February', 'March', 'April'];

function buildMonthlyFinancialDataTable(financialDetails) {
    console.log('Building table with:', financialDetails);
    const tableBody = document.getElementById('financialDataTable').querySelector('tbody');
    tableBody.innerHTML = '';
    orderedMonths.forEach(month => {
        const details = financialDetails[month];
        if (details) {
            const revenueItems = details['revenue'].map(rev => `${rev.type}: $${rev.amount.toFixed(2)}`).join('<br>');
            const expenseItems = details['expenses'].map(exp => `${exp.type}: $${exp.amount.toFixed(2)}`).join('<br>');
            const profit = details['profit'].toFixed(2);
            const row = `<tr>
                            <td>${month}</td>
                            <td>${revenueItems}</td>
                            <td>${expenseItems}</td>
                            <td>$${profit}</td>
                         </tr>`;
            tableBody.innerHTML += row;
        }
    });
    console.log('Table built successfully');
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('addIncomeForm')) {
        document.getElementById('addIncomeForm').addEventListener('submit', handleAddIncome);
    }
    if (document.getElementById('addExpenseForm')) {
        document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    }
    if (document.getElementById('financialDataTable')) {
        fetchFinancialData();
    }
    function addRowToTable(tableId, type, month, amount) {
        const table = document.getElementById(tableId);
        const newRow = table.insertRow();
        newRow.innerHTML = `<td>${type}</td><td>${month}</td><td>${amount.toFixed(2)}</td>`;
    }
    
    function updateTotal(totalId, amount) {
        const totalDisplay = document.getElementById(totalId);
        let currentTotal = parseFloat(totalDisplay.textContent.replace(/[^0-9\.-]+/g, ""));
        currentTotal += amount;
        totalDisplay.textContent = `Total ${totalId.slice(5)}: $${currentTotal.toFixed(2)}`;
    }
    document.getElementById('monthFilter').addEventListener('change', applyFilters);
    document.getElementById('revenueTypeFilter').addEventListener('change', applyFilters);
    document.getElementById('expenseTypeFilter').addEventListener('change', applyFilters);  

    function handleAddIncome(e) {
        e.preventDefault();
        const incomeType = document.getElementById('incomeType').value;
        const incomeMonth = document.getElementById('incomeMonth').value;
        const incomeAmount = document.getElementById('incomeAmount').value;

        fetch('/add_income', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: incomeType, month: incomeMonth, amount: incomeAmount })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            addRowToTable('incomeTable', incomeType, incomeMonth, parseFloat(incomeAmount));
            updateTotal('totalIncome', parseFloat(incomeAmount));
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
    
    function handleAddExpense(e) {
        e.preventDefault();
        const expenseType = document.getElementById('expenseType').value;
        const expenseMonth = document.getElementById('expenseMonth').value;
        const expenseAmount = document.getElementById('expenseAmount').value;

        fetch('/add_expense', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type: expenseType, month: expenseMonth, amount: expenseAmount })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            addRowToTable('expenseTable', expenseType, expenseMonth, parseFloat(expenseAmount));
            updateTotal('totalExpenses', parseFloat(expenseAmount));
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});
