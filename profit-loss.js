// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAtCV2XfOJwLy050kHg5y_Oqy-9NfKyOlc",
    authDomain: "temo-a8e65.firebaseapp.com",
    projectId: "temo-a8e65",
    storageBucket: "temo-a8e65.firebasestorage.app",
    messagingSenderId: "897974034557",
    appId: "1:897974034557:web:fcb74ee2c9e9b73def1114",
    measurementId: "G-EVZ5JG42TS"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// DOM Elements
const totalRevenueEl = document.getElementById('totalRevenue');
const totalExpensesEl = document.getElementById('totalExpenses');
const netProfitEl = document.getElementById('netProfit');
const profitMarginEl = document.getElementById('profitMargin');
const expensesTableBody = document.getElementById('expensesTableBody');
const periodFilter = document.getElementById('periodFilter');

let charts = {};

// Load Data
async function loadPnLData() {
    try {
        console.log('🔄 Loading P&L data...');
        const period = periodFilter.value;

        // Load Sales
        const salesSnapshot = await db.collection('sales_reports').get();
        const sales = [];
        salesSnapshot.forEach(doc => sales.push({ id: doc.id, ...doc.data() }));

        // Load Expenses
        const expensesSnapshot = await db.collection('expenses').get();
        const expenses = [];
        expensesSnapshot.forEach(doc => expenses.push({ id: doc.id, ...doc.data() }));

        // Filter Data
        const filteredSales = filterByPeriod(sales, period);
        const filteredExpenses = filterByPeriod(expenses, period);

        calculatePnL(filteredSales, filteredExpenses);

    } catch (error) {
        console.error('❌ Error loading P&L data:', error);
    }
}

function filterByPeriod(data, period) {
    if (period === 'all') return data;

    const now = new Date();
    let startDate;

    if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    return data.filter(item => {
        const date = item.date ? (item.date.toDate ? item.date.toDate() : new Date(item.date)) :
            item.timestamp ? (item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp)) : new Date();
        return date >= startDate;
    });
}

function calculatePnL(sales, expenses) {
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.totalSales) || parseFloat(s.total) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Update UI
    totalRevenueEl.textContent = `${totalRevenue.toLocaleString()} ج.م`;
    totalExpensesEl.textContent = `${totalExpenses.toLocaleString()} ج.م`;
    netProfitEl.textContent = `${netProfit.toLocaleString()} ج.م`;
    netProfitEl.style.color = netProfit >= 0 ? '#10b981' : '#ef4444';
    profitMarginEl.textContent = `هامش الربح: ${margin.toFixed(1)}%`;

    updateExpensesTable(expenses, totalExpenses);
    createPnLChart(totalRevenue, totalExpenses, netProfit);
}

function updateExpensesTable(expenses, totalExpenses) {
    expensesTableBody.innerHTML = '';

    // Group by category
    const categories = {};
    expenses.forEach(e => {
        const cat = e.category || 'أخرى';
        categories[cat] = (categories[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .forEach(([cat, amount]) => {
            const row = document.createElement('tr');
            const percent = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            row.innerHTML = `
                <td>${cat}</td>
                <td>${amount.toLocaleString()} ج.م</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: #ef4444;"></div>
                        </div>
                        <span>${percent.toFixed(1)}%</span>
                    </div>
                </td>
            `;
            expensesTableBody.appendChild(row);
        });
}

function createPnLChart(revenue, expenses, profit) {
    const ctx = document.getElementById('pnlChart');
    if (ctx) {
        if (charts.pnl) charts.pnl.destroy();

        charts.pnl = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['الإيرادات', 'المصروفات', 'صافي الربح'],
                datasets: [{
                    label: 'القيمة (ج.م)',
                    data: [revenue, expenses, profit],
                    backgroundColor: ['#10b981', '#ef4444', profit >= 0 ? '#3b82f6' : '#f59e0b'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }
}

window.loadPnLData = loadPnLData;

// Initial Load
document.addEventListener('DOMContentLoaded', loadPnLData);
