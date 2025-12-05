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
const cashInEl = document.getElementById('cashIn');
const cashOutEl = document.getElementById('cashOut');
const netCashFlowEl = document.getElementById('netCashFlow');

let charts = {};

// Load Data
async function loadCashFlowData() {
    try {
        console.log('🔄 Loading Cash Flow data...');

        // Load Sales (Cash In)
        const salesSnapshot = await db.collection('sales_reports').orderBy('date', 'desc').limit(30).get();
        const sales = [];
        salesSnapshot.forEach(doc => sales.push({ id: doc.id, ...doc.data() }));

        // Load Expenses (Cash Out)
        const expensesSnapshot = await db.collection('expenses').orderBy('date', 'desc').limit(30).get();
        const expenses = [];
        expensesSnapshot.forEach(doc => expenses.push({ id: doc.id, ...doc.data() }));

        calculateCashFlow(sales, expenses);

    } catch (error) {
        console.error('❌ Error loading Cash Flow data:', error);
    }
}

function calculateCashFlow(sales, expenses) {
    const cashIn = sales.reduce((sum, s) => sum + (parseFloat(s.totalSales) || parseFloat(s.total) || 0), 0);
    const cashOut = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netFlow = cashIn - cashOut;

    cashInEl.textContent = `${cashIn.toLocaleString()} ج.م`;
    cashOutEl.textContent = `${cashOut.toLocaleString()} ج.م`;
    netCashFlowEl.textContent = `${netFlow.toLocaleString()} ج.م`;
    netCashFlowEl.style.color = netFlow >= 0 ? '#10b981' : '#ef4444';

    createCashFlowChart(sales, expenses);
}

function createCashFlowChart(sales, expenses) {
    const ctx = document.getElementById('cashFlowChart');
    if (ctx) {
        // Group by date
        const dates = new Set();
        const cashInMap = {};
        const cashOutMap = {};

        sales.forEach(s => {
            const date = s.date ? (s.date.toDate ? s.date.toDate() : new Date(s.date)) : new Date();
            const dateStr = date.toLocaleDateString('ar-EG');
            dates.add(dateStr);
            cashInMap[dateStr] = (cashInMap[dateStr] || 0) + (parseFloat(s.totalSales) || parseFloat(s.total) || 0);
        });

        expenses.forEach(e => {
            const date = e.date ? (e.date.toDate ? e.date.toDate() : new Date(e.date)) : new Date();
            const dateStr = date.toLocaleDateString('ar-EG');
            dates.add(dateStr);
            cashOutMap[dateStr] = (cashOutMap[dateStr] || 0) + (parseFloat(e.amount) || 0);
        });

        const sortedDates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b)).slice(-7); // Last 7 days

        if (charts.flow) charts.flow.destroy();

        charts.flow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [
                    {
                        label: 'داخل',
                        data: sortedDates.map(d => cashInMap[d] || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'خارج',
                        data: sortedDates.map(d => cashOutMap[d] || 0),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
}

window.loadCashFlowData = loadCashFlowData;

// Initial Load
document.addEventListener('DOMContentLoaded', loadCashFlowData);
