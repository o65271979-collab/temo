// Advanced Notifications System with Smart Alerts
class AdvancedNotificationManager {
    constructor() {
        this.notificationRules = [];
        this.alertThresholds = {
            highSales: 5000,      // تنبيه عند تجاوز المبيعات
            lowSales: 1000,       // تنبيه عند انخفاض المبيعات
            highExpense: 2000,    // تنبيه عند مصروف كبير
            criticalExpense: 5000 // تنبيه حرج عند مصروف كبير جداً
        };
        this.notificationHistory = [];
        this.userPreferences = {
            enableSalesAlerts: true,
            enableExpenseAlerts: true,
            enablePerformanceAlerts: true,
            soundEnabled: true,
            desktopNotifications: true,
            emailNotifications: false
        };
        
        this.init();
    }

    async init() {
        try {
            this.loadUserPreferences();
            this.createAdvancedNotificationUI();
            this.setupSmartListeners();
            console.log('✅ Advanced Notification System initialized');
        } catch (error) {
            console.error('❌ Error initializing advanced notifications:', error);
        }
    }

    // Create advanced notification UI with settings
    createAdvancedNotificationUI() {
        const settingsHTML = `
            <div id="advancedNotificationSettings" class="advanced-notification-settings" style="display: none;">
                <div class="settings-overlay" onclick="closeAdvancedNotificationSettings()"></div>
                <div class="settings-panel">
                    <div class="settings-header">
                        <h3><i class="fas fa-bell-slash"></i> إعدادات الإشعارات المتقدمة</h3>
                        <button onclick="closeAdvancedNotificationSettings()" class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="settings-content">
                        <!-- Sales Alerts Section -->
                        <div class="settings-section">
                            <h4><i class="fas fa-chart-line"></i> تنبيهات المبيعات</h4>
                            
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="enableSalesAlerts" checked>
                                    <span>تفعيل تنبيهات المبيعات</span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>مبيعات عالية (ج.م):</label>
                                <input type="number" id="highSalesThreshold" value="5000" min="0">
                            </div>

                            <div class="setting-item">
                                <label>مبيعات منخفضة (ج.م):</label>
                                <input type="number" id="lowSalesThreshold" value="1000" min="0">
                            </div>
                        </div>

                        <!-- Expense Alerts Section -->
                        <div class="settings-section">
                            <h4><i class="fas fa-money-bill-wave"></i> تنبيهات المصاريف</h4>
                            
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="enableExpenseAlerts" checked>
                                    <span>تفعيل تنبيهات المصاريف</span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>مصروف كبير (ج.م):</label>
                                <input type="number" id="highExpenseThreshold" value="2000" min="0">
                            </div>

                            <div class="setting-item">
                                <label>مصروف حرج (ج.م):</label>
                                <input type="number" id="criticalExpenseThreshold" value="5000" min="0">
                            </div>
                        </div>

                        <!-- Performance Alerts Section -->
                        <div class="settings-section">
                            <h4><i class="fas fa-tachometer-alt"></i> تنبيهات الأداء</h4>
                            
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="enablePerformanceAlerts" checked>
                                    <span>تفعيل تنبيهات الأداء</span>
                                </label>
                            </div>
                        </div>

                        <!-- Notification Methods -->
                        <div class="settings-section">
                            <h4><i class="fas fa-volume-up"></i> طرق الإشعارات</h4>
                            
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="soundEnabled" checked>
                                    <span>تفعيل الأصوات</span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="desktopNotifications" checked>
                                    <span>إشعارات سطح المكتب</span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="emailNotifications">
                                    <span>إشعارات البريد الإلكتروني</span>
                                </label>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="settings-actions">
                            <button onclick="saveAdvancedNotificationSettings()" class="btn btn-primary">
                                <i class="fas fa-save"></i> حفظ الإعدادات
                            </button>
                            <button onclick="resetAdvancedNotificationSettings()" class="btn btn-outline">
                                <i class="fas fa-undo"></i> إعادة تعيين
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add settings button to notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'notification-settings-btn';
            settingsBtn.innerHTML = '<i class="fas fa-sliders-h"></i>';
            settingsBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleAdvancedSettings();
            };
            notificationBell.parentElement.insertAdjacentElement('afterend', settingsBtn);
        }

        // Add settings panel to body
        document.body.insertAdjacentHTML('beforeend', settingsHTML);
    }

    // Setup smart Firebase listeners
    setupSmartListeners() {
        if (!window.db) {
            console.warn('Firebase not initialized for advanced notifications');
            return;
        }

        // Monitor sales in real-time
        this.monitorSales();
        
        // Monitor expenses in real-time
        this.monitorExpenses();
        
        // Monitor performance metrics
        this.monitorPerformance();
    }

    // Monitor sales with smart alerts
    monitorSales() {
        db.collection('sales_reports').orderBy('date', 'desc').limit(100).onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const sale = { id: change.doc.id, ...change.doc.data() };
                    this.analyzeSalesAlert(sale);
                }
            });
        });
    }

    // Analyze and create sales alerts
    analyzeSalesAlert(sale) {
        if (!this.userPreferences.enableSalesAlerts) return;

        const totalSales = parseFloat(sale.totalSales) || parseFloat(sale.revenue) || 0;
        const ordersCount = parseInt(sale.ordersCount) || 0;

        // High sales alert
        if (totalSales >= this.alertThresholds.highSales) {
            this.createSmartNotification({
                type: 'sales_high',
                title: '🎉 مبيعات عالية!',
                message: `تم تحقيق مبيعات بقيمة ${totalSales.toLocaleString()} ج.م مع ${ordersCount} طلب`,
                severity: 'success',
                data: sale,
                actionable: true,
                actions: [
                    { label: 'عرض التفاصيل', action: () => window.location.href = 'reports.html' }
                ]
            });
        }
        // Low sales alert
        else if (totalSales > 0 && totalSales < this.alertThresholds.lowSales) {
            this.createSmartNotification({
                type: 'sales_low',
                title: '⚠️ مبيعات منخفضة',
                message: `المبيعات الحالية ${totalSales.toLocaleString()} ج.م فقط`,
                severity: 'warning',
                data: sale,
                actionable: true,
                actions: [
                    { label: 'عرض التقارير', action: () => window.location.href = 'reports.html' }
                ]
            });
        }
    }

    // Monitor expenses with smart alerts
    monitorExpenses() {
        db.collection('expenses').orderBy('date', 'desc').limit(100).onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const expense = { id: change.doc.id, ...change.doc.data() };
                    this.analyzeExpenseAlert(expense);
                }
            });
        });
    }

    // Analyze and create expense alerts
    analyzeExpenseAlert(expense) {
        if (!this.userPreferences.enableExpenseAlerts) return;

        const amount = parseFloat(expense.amount) || 0;
        const category = expense.category || 'عام';
        const description = expense.description || '';

        // Critical expense alert
        if (amount >= this.alertThresholds.criticalExpense) {
            this.createSmartNotification({
                type: 'expense_critical',
                title: '🚨 مصروف حرج!',
                message: `مصروف كبير جداً: ${amount.toLocaleString()} ج.م (${category}) - ${description}`,
                severity: 'error',
                data: expense,
                actionable: true,
                actions: [
                    { label: 'عرض المصاريف', action: () => window.location.href = 'expenses.html' },
                    { label: 'تحرير', action: () => this.editExpense(expense.id) }
                ]
            });
        }
        // High expense alert
        else if (amount >= this.alertThresholds.highExpense) {
            this.createSmartNotification({
                type: 'expense_high',
                title: '⚠️ مصروف كبير',
                message: `مصروف: ${amount.toLocaleString()} ج.م (${category})`,
                severity: 'warning',
                data: expense,
                actionable: true,
                actions: [
                    { label: 'عرض المصاريف', action: () => window.location.href = 'expenses.html' }
                ]
            });
        }
    }

    // Monitor performance metrics
    monitorPerformance() {
        if (!this.userPreferences.enablePerformanceAlerts) return;

        // Check performance every hour
        setInterval(() => {
            this.analyzePerformance();
        }, 3600000); // 1 hour

        // Initial check
        this.analyzePerformance();
    }

    // Analyze performance and create alerts
    async analyzePerformance() {
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Get today's sales
            const salesSnapshot = await db.collection('sales_reports')
                .where('date', '>=', todayStr)
                .get();

            let totalSales = 0;
            let totalOrders = 0;

            salesSnapshot.forEach(doc => {
                const data = doc.data();
                totalSales += parseFloat(data.totalSales) || 0;
                totalOrders += parseInt(data.ordersCount) || 0;
            });

            // Get today's expenses
            const expensesSnapshot = await db.collection('expenses')
                .where('date', '>=', todayStr)
                .get();

            let totalExpenses = 0;
            expensesSnapshot.forEach(doc => {
                totalExpenses += parseFloat(doc.data().amount) || 0;
            });

            // Calculate profit
            const profit = totalSales - totalExpenses;
            const profitMargin = totalSales > 0 ? (profit / totalSales * 100).toFixed(2) : 0;

            // Create performance notification
            if (totalSales > 0) {
                this.createSmartNotification({
                    type: 'performance_daily',
                    title: '📊 ملخص الأداء اليومي',
                    message: `المبيعات: ${totalSales.toLocaleString()} ج.م | المصاريف: ${totalExpenses.toLocaleString()} ج.م | الربح: ${profit.toLocaleString()} ج.م (${profitMargin}%)`,
                    severity: profit > 0 ? 'success' : 'warning',
                    data: { totalSales, totalExpenses, profit, profitMargin, orders: totalOrders },
                    actionable: true,
                    actions: [
                        { label: 'عرض الإحصائيات', action: () => window.location.href = 'statistics.html' }
                    ]
                });
            }
        } catch (error) {
            console.error('Error analyzing performance:', error);
        }
    }

    // Create smart notification with actions
    createSmartNotification(notification) {
        // Check for duplicate notifications
        const isDuplicate = this.notificationHistory.some(n => 
            n.type === notification.type && 
            (Date.now() - n.timestamp) < 60000 // Within 1 minute
        );

        if (isDuplicate) return;

        // Add to history
        this.notificationHistory.push({
            type: notification.type,
            timestamp: Date.now()
        });

        // Limit history
        if (this.notificationHistory.length > 100) {
            this.notificationHistory = this.notificationHistory.slice(-100);
        }

        // Play sound if enabled
        if (this.userPreferences.soundEnabled && window.notificationManager) {
            window.notificationManager.playNotificationSound();
        }

        // Show browser notification if enabled
        if (this.userPreferences.desktopNotifications && window.notificationManager) {
            window.notificationManager.showBrowserNotification(notification);
        }

        // Add to notification manager
        if (window.notificationManager) {
            window.notificationManager.addNotification(notification);
        }

        // Create toast notification
        this.showToastNotification(notification);
    }

    // Show toast notification
    showToastNotification(notification) {
        const toastHTML = `
            <div class="toast-notification ${notification.severity || 'info'}" id="toast-${Date.now()}">
                <div class="toast-icon">
                    <i class="fas ${this.getSeverityIcon(notification.severity)}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${notification.title}</div>
                    <div class="toast-message">${notification.message}</div>
                    ${notification.actionable ? `
                        <div class="toast-actions">
                            ${notification.actions.map((action, idx) => `
                                <button class="toast-action-btn" onclick="window.advancedNotificationManager?.executeAction(${idx}, '${notification.type}')">
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Create toast container if not exists
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Auto remove after 5 seconds
        const toastId = `toast-${Date.now()}`;
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    // Get severity icon
    getSeverityIcon(severity) {
        const icons = {
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-circle',
            'error': 'fa-times-circle',
            'info': 'fa-info-circle'
        };
        return icons[severity] || 'fa-bell';
    }

    // Toggle advanced settings
    toggleAdvancedSettings() {
        const settings = document.getElementById('advancedNotificationSettings');
        if (settings) {
            settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Load user preferences
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('advancedNotificationPreferences');
            if (saved) {
                this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
            }
            
            const thresholds = localStorage.getItem('notificationThresholds');
            if (thresholds) {
                this.alertThresholds = { ...this.alertThresholds, ...JSON.parse(thresholds) };
            }
        } catch (error) {
            console.warn('Could not load preferences:', error);
        }
    }

    // Save user preferences
    saveUserPreferences() {
        try {
            localStorage.setItem('advancedNotificationPreferences', JSON.stringify(this.userPreferences));
            localStorage.setItem('notificationThresholds', JSON.stringify(this.alertThresholds));
            console.log('✅ Preferences saved');
        } catch (error) {
            console.error('Could not save preferences:', error);
        }
    }

    // Execute action from notification
    executeAction(actionIndex, notificationType) {
        console.log(`Executing action ${actionIndex} for ${notificationType}`);
        // Actions are handled inline in the toast
    }

    // Edit expense
    editExpense(expenseId) {
        console.log('Editing expense:', expenseId);
        // This would open an edit modal for the expense
    }
}

// Global functions
function toggleAdvancedNotificationSettings() {
    if (window.advancedNotificationManager) {
        window.advancedNotificationManager.toggleAdvancedSettings();
    }
}

function closeAdvancedNotificationSettings() {
    const settings = document.getElementById('advancedNotificationSettings');
    if (settings) {
        settings.style.display = 'none';
    }
}

function saveAdvancedNotificationSettings() {
    if (!window.advancedNotificationManager) return;

    const manager = window.advancedNotificationManager;

    // Update preferences
    manager.userPreferences = {
        enableSalesAlerts: document.getElementById('enableSalesAlerts')?.checked || false,
        enableExpenseAlerts: document.getElementById('enableExpenseAlerts')?.checked || false,
        enablePerformanceAlerts: document.getElementById('enablePerformanceAlerts')?.checked || false,
        soundEnabled: document.getElementById('soundEnabled')?.checked || false,
        desktopNotifications: document.getElementById('desktopNotifications')?.checked || false,
        emailNotifications: document.getElementById('emailNotifications')?.checked || false
    };

    // Update thresholds
    manager.alertThresholds = {
        highSales: parseFloat(document.getElementById('highSalesThreshold')?.value) || 5000,
        lowSales: parseFloat(document.getElementById('lowSalesThreshold')?.value) || 1000,
        highExpense: parseFloat(document.getElementById('highExpenseThreshold')?.value) || 2000,
        criticalExpense: parseFloat(document.getElementById('criticalExpenseThreshold')?.value) || 5000
    };

    // Save to localStorage
    manager.saveUserPreferences();

    // Show success message
    if (window.notificationManager) {
        window.notificationManager.showSuccess('تم حفظ الإعدادات بنجاح', 'نجح العملية');
    }

    closeAdvancedNotificationSettings();
}

function resetAdvancedNotificationSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
        if (window.advancedNotificationManager) {
            window.advancedNotificationManager.userPreferences = {
                enableSalesAlerts: true,
                enableExpenseAlerts: true,
                enablePerformanceAlerts: true,
                soundEnabled: true,
                desktopNotifications: true,
                emailNotifications: false
            };

            window.advancedNotificationManager.alertThresholds = {
                highSales: 5000,
                lowSales: 1000,
                highExpense: 2000,
                criticalExpense: 5000
            };

            window.advancedNotificationManager.saveUserPreferences();

            // Update UI
            document.getElementById('enableSalesAlerts').checked = true;
            document.getElementById('enableExpenseAlerts').checked = true;
            document.getElementById('enablePerformanceAlerts').checked = true;
            document.getElementById('soundEnabled').checked = true;
            document.getElementById('desktopNotifications').checked = true;
            document.getElementById('emailNotifications').checked = false;
            document.getElementById('highSalesThreshold').value = 5000;
            document.getElementById('lowSalesThreshold').value = 1000;
            document.getElementById('highExpenseThreshold').value = 2000;
            document.getElementById('criticalExpenseThreshold').value = 5000;

            if (window.notificationManager) {
                window.notificationManager.showSuccess('تم إعادة تعيين الإعدادات', 'نجح العملية');
            }
        }
    }
}

// Initialize advanced notification manager
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.advancedNotificationManager = new AdvancedNotificationManager();
    }, 2000);
});
