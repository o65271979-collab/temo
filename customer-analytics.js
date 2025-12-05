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
const totalCustomersEl = document.getElementById('totalCustomers');
const avgOrdersPerCustomerEl = document.getElementById('avgOrdersPerCustomer');
const avgSpendPerCustomerEl = document.getElementById('avgSpendPerCustomer');
const topCustomersTableBody = document.getElementById('topCustomersTableBody');

let charts = {};

// Load Data
async function loadCustomerData() {
    try {
        console.log('🔄 Loading customer data...');

        // Fetch sales reports to derive customer data
        // Ideally, we should have a 'customers' collection, but we can derive from sales for now
        const salesSnapshot = await db.collection('sales_reports').orderBy('date', 'desc').limit(500).get();
        const sales = [];
        salesSnapshot.forEach(doc => sales.push({ id: doc.id, ...doc.data() }));

        // Process data to extract customer info
        // Assuming sales have customerName or customerId
        const customers = processCustomerData(sales);

        updateSummaryCards(customers, sales);
        updateTopCustomersTable(customers);
        createCharts(customers);

    } catch (error) {
        console.error('❌ Error loading customer data:', error);
    }
}

function processCustomerData(sales) {
    const customerMap = {};

    sales.forEach(sale => {
        // Skip anonymous sales if possible, or group them
        const customerName = sale.customerName || sale.clientName || 'عميل غير مسجل';
        const customerPhone = sale.customerPhone || sale.clientPhone || '-';

        if (customerName === 'عميل غير مسجل') return;

        if (!customerMap[customerName]) {
            customerMap[customerName] = {
                name: customerName,
                phone: customerPhone,
                ordersCount: 0,
                totalSpend: 0,
                lastVisit: null
            };
        }

        customerMap[customerName].ordersCount++;
        customerMap[customerName].totalSpend += (parseFloat(sale.total) || 0);

        const saleDate = sale.date ? (sale.date.toDate ? sale.date.toDate() : new Date(sale.date)) : new Date();
        if (!customerMap[customerName].lastVisit || saleDate > customerMap[customerName].lastVisit) {
            customerMap[customerName].lastVisit = saleDate;
        }
    });

    return Object.values(customerMap);
}

function updateSummaryCards(customers, sales) {
    totalCustomersEl.textContent = customers.length;

    if (customers.length > 0) {
        const totalOrders = customers.reduce((sum, c) => sum + c.ordersCount, 0);
        const totalSpend = customers.reduce((sum, c) => sum + c.totalSpend, 0);

        avgOrdersPerCustomerEl.textContent = (totalOrders / customers.length).toFixed(1);
        avgSpendPerCustomerEl.textContent = `${(totalSpend / totalOrders).toFixed(2)} ج.م`;
    } else {
        avgOrdersPerCustomerEl.textContent = '0';
        avgSpendPerCustomerEl.textContent = '0 ج.م';
    }
}

function updateTopCustomersTable(customers) {
    topCustomersTableBody.innerHTML = '';

    const topCustomers = [...customers]
        .sort((a, b) => b.totalSpend - a.totalSpend)
        .slice(0, 10);

    if (topCustomers.length === 0) {
        topCustomersTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">لا توجد بيانات عملاء</td></tr>';
        return;
    }

    topCustomers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.ordersCount}</td>
            <td style="color: #10b981; font-weight: bold;">${c.totalSpend.toFixed(2)} ج.م</td>
            <td>${c.lastVisit ? c.lastVisit.toLocaleDateString('ar-EG') : '-'}</td>
        `;
        topCustomersTableBody.appendChild(row);
    });
}

function createCharts(customers) {
    // Top Customers Chart
    const topCtx = document.getElementById('topCustomersChart');
    if (topCtx) {
        const top5 = [...customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

        if (charts.top) charts.top.destroy();

        charts.top = new Chart(topCtx, {
            type: 'bar',
            data: {
                labels: top5.map(c => c.name),
                datasets: [{
                    label: 'إجمالي الإنفاق',
                    data: top5.map(c => c.totalSpend),
                    backgroundColor: '#3b82f6',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Retention Chart (One-time vs Returning)
    const retentionCtx = document.getElementById('customerRetentionChart');
    if (retentionCtx) {
        const oneTime = customers.filter(c => c.ordersCount === 1).length;
        const returning = customers.filter(c => c.ordersCount > 1).length;

        if (charts.retention) charts.retention.destroy();

        charts.retention = new Chart(retentionCtx, {
            type: 'doughnut',
            data: {
                labels: ['عملاء جدد (طلب واحد)', 'عملاء دائمين (أكثر من طلب)'],
                datasets: [{
                    data: [oneTime, returning],
                    backgroundColor: ['#9ca3af', '#10b981']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

window.refreshCustomerData = loadCustomerData;

// Initial Load
document.addEventListener('DOMContentLoaded', loadCustomerData);
