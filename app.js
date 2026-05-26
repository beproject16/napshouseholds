/* ========================================
   BELLA'S HOUSEHOLD DASHBOARD — CORE APP
   Handles navigation, modals, utilities, backup
   ======================================== */

// ==================== FIREBASE CONFIGURATION ====================
// Silakan isi variabel di bawah ini dengan konfigurasi dari Firebase Console Anda!
const firebaseConfig = {
    apiKey: "AIzaSyBbbMz6X7cI5nFYYmSKgfZUFOGoCd7-azs
    authDomain: "beproject16-e9fa7.firebaseapp.com",
    databaseURL: "https://beproject16-e9fa7-default-rtdb.asia-southeast1.firebasedatabase.app"
    projectId: "beproject16-e9fa7",
    storageBucket: "beproject16-e9fa7.firebasestorage.app",
    messagingSenderId: "53552382226",
    appId: "1:53552382226:web:e3385ecae3d4b7e403b3cb",
    measurementId: "G-RKT4ZCTR14"
};

let database = null;
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
}

// ==================== NAVIGATION ====================
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');
const todayDate = document.getElementById('today-date');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

const PAGE_TITLES = {
    financial: 'Financial Dashboard',
    budget: 'Budget Dashboard',
    recipes: 'Recipes & Grocery',
    development: 'Kids Development',
    activities: 'Kids Activity Calendar',
    diary: 'My Diary'
};

function switchPage(pageName) {
    navItems.forEach(item => item.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    const activePage = document.getElementById(`page-${pageName}`);

    if (activeNav) activeNav.classList.add('active');
    if (activePage) activePage.classList.add('active');
    pageTitle.textContent = PAGE_TITLES[pageName] || pageName;

    // Close mobile sidebar
    sidebar.classList.remove('open');
}

navItems.forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
});

// Mobile menu
mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Set today's date
const now = new Date();
todayDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});


// ==================== MODAL SYSTEM ====================
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function openModal(title, contentHTML) {
    modalTitle.textContent = title;
    modalBody.innerHTML = contentHTML;
    modalOverlay.classList.add('open');
}

function closeModal() {
    modalOverlay.classList.remove('open');
    modalBody.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});


// ==================== UTILITIES ====================
function formatRupiah(num) {
    if (num == null || isNaN(num)) return 'Rp 0';
    const abs = Math.abs(num);
    const formatted = abs.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (num < 0 ? '-' : '') + 'Rp ' + formatted;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function saveData(key, data) {
    try {
        localStorage.setItem('bella_' + key, JSON.stringify(data));

        // Kirim ke Firebase jika terhubung
        if (database) {
            database.ref('bella_' + key).set(data)
                .catch(e => console.error('Firebase write error:', e));
        }
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

function loadData(key, fallback = null) {
    try {
        const raw = localStorage.getItem('bella_' + key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.error('Failed to load data:', e);
        return fallback;
    }
}

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Date helpers
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMonthName(monthIdx) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIdx];
}

// Calculate age in months from DOB
function getAgeInMonths(dob) {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months += today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    return Math.max(0, months);
}

function getAgeString(dob) {
    const totalMonths = getAgeInMonths(dob);
    if (totalMonths < 12) return `${totalMonths} months`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months > 0 ? `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''}`;
}


// ==================== CSV PARSER ====================
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((h, idx) => row[h] = values[idx]);
            rows.push(row);
        }
    }
    return rows;
}


// ==================== BACKUP / EXPORT ====================
const btnExport = document.getElementById('btn-export');
const btnImportBackup = document.getElementById('btn-import-backup');
const backupFileInput = document.getElementById('backup-file-input');

const BACKUP_KEYS = [
    'bella_transactions',
    'bella_investments',
    'bella_category_overrides',
    'bella_recipes',
    'bella_meal_plan',
    'bella_child_profile',
    'bella_growth_log',
    'bella_milestone_status',
    'bella_activities',
    'bella_scheduled_activities',
    'bella_diary',
    'bella_budget'
];

btnExport.addEventListener('click', () => {
    const backup = {};
    BACKUP_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) backup[key] = JSON.parse(val);
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bella_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

btnImportBackup.addEventListener('click', () => backupFileInput.click());

backupFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const backup = JSON.parse(ev.target.result);
            Object.keys(backup).forEach(key => {
                localStorage.setItem(key, JSON.stringify(backup[key]));
            });
            alert('✅ Backup restored successfully! The page will reload.');
            location.reload();
        } catch (err) {
            alert('❌ Invalid backup file.');
        }
    };
    reader.readAsText(file);
    backupFileInput.value = '';
});


// ==================== REALTIME DATABASE SYNC ====================
if (database) {
    // Dengarkan perubahan database di cloud secara real-time
    database.ref().on('value', (snapshot) => {
        const cloudData = snapshot.val();
        if (!cloudData) return;

        let hasChanges = false;

        BACKUP_KEYS.forEach(fullKey => {
            const cloudVal = cloudData[fullKey];
            if (cloudVal !== undefined && cloudVal !== null) {
                const localValStr = localStorage.getItem(fullKey);
                const cloudValStr = JSON.stringify(cloudVal);

                if (localValStr !== cloudValStr) {
                    localStorage.setItem(fullKey, cloudValStr);
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            showSyncNotification();
        }
    });
}

function showSyncNotification() {
    if (document.getElementById('sync-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'sync-toast';
    toast.className = 'sync-toast';
    toast.innerHTML = `
        <div class="sync-toast-content">
            <span class="sync-toast-icon">🔄</span>
            <span class="sync-toast-text">Data baru dari perangkat lain terdeteksi.</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="location.reload()" style="background: var(--accent); color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-left: 8px;">
            Sync Sekarang
        </button>
    `;
    document.body.appendChild(toast);
}
