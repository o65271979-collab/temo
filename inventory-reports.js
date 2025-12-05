// Firebase Configuration (Same as other files)
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
const totalInventoryValueEl = document.getElementById('totalInventoryValue');
const totalItemsCountEl = document.getElementById('totalItemsCount');
const totalWastageValueEl = document.getElementById('totalWastageValue');
const wastageCountEl = document.getElementById('wastageCount');
const lowStockCountEl = document.getElementById('lowStockCount');
const lowStockTableBody = document.getElementById('lowStockTableBody');
const wastageTableBody = document.getElementById('wastageTableBody');

let charts = {};

// Load Data
async function loadInventoryData() {
    try {
        console.log('🔄 Loading inventory data...');

        // 1. Load Products (Inventory)
        const productsSnapshot = await db.collection('inventory_products').get();
        const products = [];
        productsSnapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        // 2. Load Wastage Records
        const wastageSnapshot = await db.collection('wastage_records')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        const wastageRecords = [];
        wastageSnapshot.forEach(doc => wastageRecords.push({ id: doc.id, ...doc.data() }));

        console.log(`✅ Loaded ${products.length} products and ${wastageRecords.length} wastage records`);

        updateSummaryCards(products, wastageRecords);
        updateLowStockTable(products);
        updateWastageTable(wastageRecords);
        createCharts(products, wastageRecords);

    } catch (error) {
        console.error('❌ Error loading inventory data:', error);
        // Show error in UI
    }
}

function updateSummaryCards(products, wastageRecords) {
    // Inventory Value
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.balance) || 0), 0);
    totalInventoryValueEl.textContent = `${totalValue.toLocaleString()} ج.م`;
    totalItemsCountEl.textContent = `${products.length} صنف`;

    // Wastage (This Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyWastage = wastageRecords.filter(r => {
        const date = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        return date >= startOfMonth;
    });

    const totalWastage = monthlyWastage.reduce((sum, r) => sum + (parseFloat(r.totalLoss) || 0), 0);
    totalWastageValueEl.textContent = `${totalWastage.toLocaleString()} ج.م`;
    wastageCountEl.textContent = `${monthlyWastage.length} عملية`;

    // Low Stock
    const lowStock = products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 5));
    lowStockCountEl.textContent = lowStock.length;
}

function updateLowStockTable(products) {
    lowStockTableBody.innerHTML = '';
    const lowStock = products
        .filter(p => (p.stock || 0) <= (p.lowStockThreshold || 5))
        .sort((a, b) => (a.stock || 0) - (b.stock || 0));

    if (lowStock.length === 0) {
        lowStockTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">لا توجد نواقص</td></tr>';
        return;
    }

    lowStock.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.name}</td>
            <td style="color: #ef4444; font-weight: bold;">${p.stock || 0}</td>
            <td>${p.lowStockThreshold || 5}</td>
            <td><span class="payment-badge" style="background: #fee2e2; color: #991b1b;">منخفض</span></td>
        `;
        lowStockTableBody.appendChild(row);
    });
}

function updateWastageTable(records) {
    wastageTableBody.innerHTML = '';

    if (records.length === 0) {
        wastageTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">لا توجد سجلات هدر</td></tr>';
        return;
    }

    records.slice(0, 10).forEach(r => {
        const date = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date.toLocaleDateString('ar-EG')}</td>
            <td>${r.productName}</td>
            <td>${r.quantity}</td>
            <td>${getReasonLabel(r.reason)}</td>
            <td style="color: #ef4444;">${(r.totalLoss || 0).toFixed(2)} ج.م</td>
            <td>${r.recordedBy || '-'}</td>
        `;
        wastageTableBody.appendChild(row);
    });
}

function getReasonLabel(reason) {
    const labels = {
        'expired': 'منتهي الصلاحية',
        'damaged': 'تالف',
        'mistake': 'خطأ تحضير',
        'other': 'أخرى'
    };
    return labels[reason] || reason;
}

function createCharts(products, wastageRecords) {
    // Wastage Reasons Chart
    const reasonsCtx = document.getElementById('wastageReasonsChart');
    if (reasonsCtx) {
        const reasons = {};
        wastageRecords.forEach(r => {
            const label = getReasonLabel(r.reason);
            reasons[label] = (reasons[label] || 0) + (r.totalLoss || 0);
        });

        if (charts.reasons) charts.reasons.destroy();

        charts.reasons = new Chart(reasonsCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(reasons),
                datasets: [{
                    label: 'قيمة الهدر (ج.م)',
                    data: Object.values(reasons),
                    backgroundColor: '#ef4444',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Inventory Distribution Chart (Top 5 Categories or Products by Value)
    const distCtx = document.getElementById('inventoryDistributionChart');
    if (distCtx) {
        // Group by category if available, else top products
        const topProducts = [...products]
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 5);

        if (charts.dist) charts.dist.destroy();

        charts.dist = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: topProducts.map(p => p.name),
                datasets: [{
                    data: topProducts.map(p => p.balance || 0),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

window.refreshInventoryData = loadInventoryData;

// Initial Load
document.addEventListener('DOMContentLoaded', loadInventoryData);
