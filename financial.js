/* ========================================
   FINANCIAL MODULE
   PDF/CSV import, auto-categorization, charts, investments
   ======================================== */

// ==================== STATE ====================
let transactions = loadData('transactions', []);
let investments = loadData('investments', []);
let categoryOverrides = loadData('category_overrides', {});

const DEFAULT_CATEGORIES = {
    groceries: { label: '🛒 Groceries', class: 'cat-groceries', type: 'expense' },
    transport: { label: '🚗 Transport', class: 'cat-transport', type: 'expense' },
    utilities: { label: '⚡ Utilities', class: 'cat-utilities', type: 'expense' },
    food: { label: '🍔 Food & Dining', class: 'cat-food', type: 'expense' },
    shopping: { label: '🛍️ Shopping', class: 'cat-shopping', type: 'expense' },
    health: { label: '💊 Health', class: 'cat-health', type: 'expense' },
    education: { label: '📚 Education', class: 'cat-education', type: 'expense' },
    entertainment: { label: '🎬 Entertainment', class: 'cat-entertainment', type: 'expense' },
    income: { label: '💰 Income', class: 'cat-income', type: 'income' },
    transfer: { label: '↔️ Transfer', class: 'cat-transfer', type: 'expense' },
    uncategorized: { label: '❓ Uncategorized', class: 'cat-uncategorized', type: 'expense' }
};

let CATEGORIES = loadData('financial_categories', DEFAULT_CATEGORIES);


// Auto-categorization rules (keyword → category)
const CATEGORY_RULES = [
    { keywords: ['indomaret', 'alfamart', 'superindo', 'hypermart', 'giant', 'hero', 'lottemart', 'supermarket', 'minimarket', 'carrefour', 'farmers', 'idm indoma', 'alfm', 'alf mart', 'indogrosir', 'ranch market'], category: 'groceries' },
    { keywords: ['grab', 'gojek', 'uber', 'parkir', 'tol', 'bensin', 'pertamina', 'shell', 'spbu', 'bbm', 'transjakarta', 'mrt', 'kereta', 'tiket', 'bus', 'taxi', 'ojek', 'jasa marga', 'blue bird'], category: 'transport' },
    { keywords: ['pln', 'pdam', 'telkom', 'indihome', 'listrik', 'air', 'gas', 'internet', 'wifi', 'token', 'pulsa', 'paket data', 'xl', 'telkomsel', 'indosat', 'biznet', 'first media'], category: 'utilities' },
    { keywords: ['mcd', 'mcdonald', 'kfc', 'pizza', 'starbucks', 'chatime', 'restoran', 'restaurant', 'cafe', 'kopi', 'coffee', 'makan', 'warteg', 'padang', 'bakso', 'nasi', 'ayam', 'geprek', 'sate', 'martabak', 'janji jiwa', 'fore', 'hangry', 'grabfood', 'gofood', 'shopeefood', 'cimol', 'makan siang', 'makan malam', 'sarapan', 'masbf-lata'], category: 'food' },
    { keywords: ['tokopedia', 'shopee', 'lazada', 'blibli', 'bukalapak', 'zalora', 'h&m', 'uniqlo', 'zara', 'ikea', 'ace hardware', 'mall', 'toko', 'beli'], category: 'shopping' },
    { keywords: ['apotek', 'apotik', 'farmasi', 'rumah sakit', 'klinik', 'dokter', 'rs ', 'lab', 'bpjs', 'kimia farma', 'guardian', 'watson', 'gym', 'fitness'], category: 'health' },
    { keywords: ['sekolah', 'spp', 'kursus', 'les', 'bimbel', 'buku', 'course', 'training', 'seminar', 'workshop', 'uang sekolah'], category: 'education' },
    { keywords: ['bioskop', 'cgv', 'xxi', 'cinema', 'netflix', 'spotify', 'youtube', 'disney', 'game', 'langganan', 'subscribe', 'tiket wisata', 'rekreasi'], category: 'entertainment' },
    { keywords: ['gaji', 'salary', 'bonus', 'thr', 'transfer masuk', 'terima', 'dividen', 'bunga', 'cashback', 'refund', 'pengembalian'], category: 'income' },
    { keywords: ['transfer', 'tf ', 'kirim', 'setor', 'tarik tunai', 'atm', 'trsf', 'dana', 'ovo', 'gopay', 'linkaja', 'shopeepay', 'e-banking'], category: 'transfer' }
];



// ==================== AUTO-CATEGORIZE ====================
function autoCategorize(description) {
    if (!description) return 'uncategorized';
    const lower = description.toLowerCase();

    // Check user overrides first
    if (categoryOverrides[lower]) return categoryOverrides[lower];

    for (const rule of CATEGORY_RULES) {
        for (const kw of rule.keywords) {
            if (lower.includes(kw)) return rule.category;
        }
    }
    return 'uncategorized';
}


// ==================== PDF IMPORT ====================
const bankPdfInput = document.getElementById('bank-pdf-input');

bankPdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
        const text = await file.text();
        importCSV(text);
    } else if (file.name.endsWith('.pdf')) {
        await importPDF(file);
    } else {
        alert('Please upload a PDF or CSV file.');
    }
    bankPdfInput.value = '';
});

function importCSV(text) {
    const rows = parseCSV(text);
    if (rows.length === 0) {
        alert('No data found in CSV.');
        return;
    }

    let imported = 0;
    rows.forEach(row => {
        const txn = parseCSVRow(row);
        if (txn) {
            transactions.push(txn);
            imported++;
        }
    });

    saveData('transactions', transactions);
    renderFinancial();
    alert(`✅ Imported ${imported} transactions!`);
}

function parseCSVRow(row) {
    // Try common CSV column names
    const date = row['Date'] || row['Tanggal'] || row['Transaction Date'] || row['date'] || '';
    const desc = row['Description'] || row['Keterangan'] || row['Deskripsi'] || row['desc'] || row['Narration'] || '';
    const debit = parseFloat((row['Debit'] || row['debit'] || row['Withdrawal'] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const credit = parseFloat((row['Credit'] || row['credit'] || row['Deposit'] || row['Kredit'] || '0').replace(/[^0-9.-]/g, '')) || 0;

    if (!date && !desc) return null;

    const amount = Math.abs(credit > 0 ? credit : debit);

    const type = credit > 0 ? 'income' : 'expense';
    const category = autoCategorize(desc);
    const finalType = (CATEGORIES[category] && CATEGORIES[category].type) ? CATEGORIES[category].type : type;

    return {
        id: generateId(),
        date: normalizeDate(date),
        description: desc,
        amount: amount,
        type: finalType,
        category: category
    };

}

async function importPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Set PDF.js worker
        if (window.pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // Extract text with positional data for better table parsing
        let allItems = [];
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            content.items.forEach(item => {
                allItems.push({
                    str: item.str,
                    x: Math.round(item.transform[4]),
                    y: Math.round(item.transform[5]),
                    page: i
                });
            });
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n';
        }

        // Try BCA-specific parser first
        let extracted = extractBCATransactions(allItems, fullText);

        // Fallback to generic parser
        if (extracted.length === 0) {
            extracted = extractTransactionsGeneric(fullText);
        }

        if (extracted.length === 0) {
            openModal('PDF Import', `
                <p class="text-muted" style="margin-bottom:12px;">Could not auto-detect transactions. The PDF text is shown below. You can add transactions manually instead.</p>
                <textarea class="input-textarea" style="height:300px; font-size:0.8rem;" readonly>${fullText.substring(0, 3000)}</textarea>
            `);
            return;
        }

        extracted.forEach(txn => transactions.push(txn));
        saveData('transactions', transactions);
        renderFinancial();
        alert(`✅ Imported ${extracted.length} transactions from PDF!`);
    } catch (err) {
        console.error('PDF import error:', err);
        alert('❌ Failed to read PDF. Try exporting as CSV from your bank instead.');
    }
}

// ==================== BCA-SPECIFIC PDF PARSER ====================
function extractBCATransactions(items, fullText) {
    const results = [];

    // Detect if this is a BCA statement
    const isBCA = fullText.match(/BCA|REKENING TAHAPAN|Bank Central Asia/i);
    if (!isBCA) return [];

    // Extract period (year and month) from header, e.g. "PERIODE : DESEMBER 2025"
    const MONTH_MAP = {
        'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
        'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08',
        'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12',
        'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'MAY': '05',
        'JUNE': '06', 'JULY': '07', 'AUGUST': '08', 'OCTOBER': '10',
        'DECEMBER': '12'
    };

    let stmtYear = new Date().getFullYear().toString();
    let stmtMonth = null;
    const periodeMatch = fullText.match(/PERIODE\s*:?\s*(\w+)\s+(\d{4})/i);
    if (periodeMatch) {
        const monthName = periodeMatch[1].toUpperCase();
        stmtYear = periodeMatch[2];
        stmtMonth = MONTH_MAP[monthName] || null;
    }

    // Group text items into rows by Y position (within 3px tolerance)
    const rows = [];
    const sortedItems = [...items].sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        if (Math.abs(a.y - b.y) > 3) return b.y - a.y; // Higher Y = higher on page
        return a.x - b.x; // Left to right
    });

    let currentRow = [];
    let currentY = null;
    let currentPage = null;

    sortedItems.forEach(item => {
        if (item.str.trim() === '') return;
        if (currentY === null || Math.abs(item.y - currentY) > 3 || item.page !== currentPage) {
            if (currentRow.length > 0) rows.push({ items: currentRow, y: currentY, page: currentPage });
            currentRow = [item];
            currentY = item.y;
            currentPage = item.page;
        } else {
            currentRow.push(item);
        }
    });
    if (currentRow.length > 0) rows.push({ items: currentRow, y: currentY, page: currentPage });

    // Find transaction rows: they start with a date pattern DD/MM in the leftmost column
    const dateRegex = /^(\d{2})\/(\d{2})$/;
    let i = 0;

    while (i < rows.length) {
        const row = rows[i];
        // Get the leftmost text item
        const leftmostItems = row.items.sort((a, b) => a.x - b.x);
        const firstText = leftmostItems[0]?.str?.trim();

        const dateMatch = firstText?.match(dateRegex);
        if (!dateMatch) { i++; continue; }

        const day = dateMatch[1];
        const month = dateMatch[2];
        const dateStr = `${stmtYear}-${month}-${day}`;

        // Collect all text from this row
        const rowTexts = leftmostItems.map(item => item.str.trim()).filter(s => s);

        // Skip SALDO AWAL (opening balance)
        const joinedRow = rowTexts.join(' ');
        if (joinedRow.match(/SALDO AWAL/i)) { i++; continue; }

        // Find description: second text item onward (after the date)
        let description = '';
        let amount = 0;
        let type = 'expense';

        // Look for DB or CR marker in this row and subsequent continuation rows
        let allRowTexts = [...rowTexts];

        // Collect continuation lines (rows without a date, belonging to same transaction)
        let j = i + 1;
        while (j < rows.length) {
            const nextRow = rows[j];
            const nextFirst = nextRow.items.sort((a, b) => a.x - b.x)[0]?.str?.trim();
            if (nextFirst && nextFirst.match(dateRegex)) break; // Next transaction
            if (nextFirst && nextFirst.match(/^SALDO AWAL/i)) break;
            // Skip header/footer rows
            if (nextFirst && nextFirst.match(/^(TANGGAL|KETERANGAN|CBG|MUTASI|SALDO|CATATAN|Apabila|Rekening|HALAMAN|PERIODE|NO\. REKENING|BCA|KCP)/i)) break;
            allRowTexts.push(...nextRow.items.sort((a, b) => a.x - b.x).map(item => item.str.trim()).filter(s => s));
            j++;
        }

        // Extract amount and DB/CR from all collected text
        const fullLine = allRowTexts.join(' ');

        // Find the MUTASI amount with DB/CR marker
        // Pattern: number like 35,625.00 followed by DB or CR
        const mutasiMatch = fullLine.match(/([\d,]+\.\d{2})\s*(DB|CR)/i);
        if (mutasiMatch) {
            amount = parseFloat(mutasiMatch[1].replace(/,/g, ''));
            type = mutasiMatch[2].toUpperCase() === 'CR' ? 'income' : 'expense';
        } else {
            // Try alternative: just find a large number
            const amtMatches = fullLine.match(/([\d,]+\.\d{2})/g);
            if (amtMatches) {
                // First significant amount is likely the MUTASI
                for (const m of amtMatches) {
                    const val = parseFloat(m.replace(/,/g, ''));
                    if (val > 0) { amount = val; break; }
                }
            }
        }

        if (amount === 0) { i = j; continue; }

        // Build description from the KETERANGAN column
        // The description is typically: "TRSF E-BANKING DB", "TRANSAKSI DEBIT", etc.
        // Plus any detail lines like "makan siang", "DESI FRISKA NATALI"
        const descParts = [];
        for (const txt of allRowTexts) {
            // Skip the date itself
            if (txt.match(dateRegex)) continue;
            // Skip amounts and DB/CR markers
            if (txt.match(/^[\d,]+\.\d{2}$/)) continue;
            if (txt.match(/^(DB|CR)$/i)) continue;
            // Skip reference codes (long alphanumeric strings with slashes)
            if (txt.match(/^\d{4}\/FT/)) continue;
            // Skip pure numbers (reference numbers, account numbers, saldo)
            if (txt.match(/^\d{6,}$/)) continue;
            // Skip "TGL:" prefix entries
            if (txt.match(/^TGL:/i)) continue;
            if (txt.match(/^QR\s?\d/i)) continue;
            if (txt.match(/^QRC\d/i)) continue;
            // Skip amounts that look like saldo (8+ digit numbers with comma formatting)
            if (txt.match(/^[\d,]+\.\d{2}$/) && parseFloat(txt.replace(/,/g, '')) > 100000) continue;
            // Include meaningful description text
            if (txt.length >= 2 && !txt.match(/^[\d.,]+$/)) {
                descParts.push(txt);
            }
        }

        // Clean up description
        description = descParts.join(' — ').replace(/\s+/g, ' ').trim();
        if (!description) description = 'Transaction';

        // Try to extract recipient name or detail  
        // BCA format often has: "TRSF E-BANKING DB" then details like "makan siang" / "DESI FRISKA NATALI"
        // or "TRANSAKSI DEBIT" then "IDM INDOMA" (Indomaret)

        const category = autoCategorize(description);
        const finalType = (CATEGORIES[category] && CATEGORIES[category].type) ? CATEGORIES[category].type : type;

        results.push({
            id: generateId(),
            date: dateStr,
            description: description,
            amount: Math.abs(amount),

            type: finalType,
            category: category
        });


        i = j; // Skip to next transaction
    }

    return results;
}

// ==================== GENERIC PDF PARSER (FALLBACK) ====================
function extractTransactionsGeneric(text) {
    const results = [];
    const lines = text.split('\n');

    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

    lines.forEach(line => {
        const dateMatch = line.match(datePattern);
        if (!dateMatch) return;

        const date = dateMatch[1];
        const afterDate = line.substring(line.indexOf(date) + date.length).trim();

        const amounts = [];
        const amtRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g;
        let amtMatch;
        while ((amtMatch = amtRegex.exec(afterDate)) !== null) {
            const numStr = amtMatch[1].replace(/\./g, '').replace(',', '.');
            const num = parseFloat(numStr);
            if (num > 100) amounts.push(num);
        }

        if (amounts.length === 0) return;

        const firstAmtIdx = afterDate.search(/\d{1,3}(?:[.,]\d{3})+/);
        const description = firstAmtIdx > 0 ? afterDate.substring(0, firstAmtIdx).trim() : afterDate.substring(0, 40).trim();

        if (!description || description.length < 3) return;

        const amount = amounts[amounts.length - 1];
        const type = description.toLowerCase().match(/masuk|cr|credit|terima|gaji|salary|bunga/) ? 'income' : 'expense';
        const category = autoCategorize(description);
        const finalType = (CATEGORIES[category] && CATEGORIES[category].type) ? CATEGORIES[category].type : type;

        results.push({
            id: generateId(),
            date: normalizeDate(date),
            description: description,
            amount: Math.abs(amount),

            type: finalType,
            category: category
        });

    });

    return results;
}

function normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().slice(0, 10);

    // Try DD/MM/YYYY or DD-MM-YYYY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
        let [a, b, c] = parts;
        if (parseInt(a) > 12) {
            const year = c.length === 2 ? '20' + c : c;
            return `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
        }
        if (parseInt(c) > 31) {
            return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
        }
    }

    // Handle DD/MM only (no year) — use current year
    if (parts.length === 2) {
        const [day, month] = parts;
        const year = new Date().getFullYear();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
}


// ==================== MANUAL ADD TRANSACTION ====================
document.getElementById('btn-add-transaction').addEventListener('click', () => {
    const renderAddForm = () => {
        const categoryOptions = Object.entries(CATEGORIES)
            .map(([key, val]) => `<option value="${key}">${val.label}</option>`)
            .join('') + '<option value="ADD_NEW">+ Add New Category...</option>';

        openModal('Add Transaction', `
            <form id="form-add-txn">
                <div class="form-row">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" class="input-text" id="txn-date" value="${new Date().toISOString().slice(0, 10)}" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="input-select" id="txn-type">
                            <option value="expense">Expense (-)</option>
                            <option value="income">Income (+)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="input-text" id="txn-desc" placeholder="e.g., Belanja Indomaret" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Amount (Rp)</label>
                        <input type="number" class="input-text" id="txn-amount" placeholder="50000" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select class="input-select" id="txn-category">${categoryOptions}</select>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Add Transaction</button>
            </form>
        `);

        // Handle category selection
        const catSelect = document.getElementById('txn-category');
        const typeSelect = document.getElementById('txn-type');
        catSelect.addEventListener('change', (e) => {
            if (e.target.value === 'ADD_NEW') {
                promptAddCategory((newKey) => {
                    renderAddForm();
                    document.getElementById('txn-category').value = newKey;
                    document.getElementById('txn-type').value = CATEGORIES[newKey].type;
                });
            } else {
                const selectedCat = CATEGORIES[e.target.value];
                if (selectedCat) typeSelect.value = selectedCat.type;
            }
        });

        // Auto-suggest category
        const descInput = document.getElementById('txn-desc');
        descInput.addEventListener('input', debounce(() => {
            const suggested = autoCategorize(descInput.value);
            catSelect.value = suggested;
            if (CATEGORIES[suggested]) typeSelect.value = CATEGORIES[suggested].type;
        }, 500));

        document.getElementById('form-add-txn').addEventListener('submit', (e) => {
            e.preventDefault();
            transactions.push({
                id: generateId(),
                date: document.getElementById('txn-date').value,
                description: document.getElementById('txn-desc').value,
                amount: Math.abs(parseFloat(document.getElementById('txn-amount').value)),

                type: document.getElementById('txn-type').value,
                category: document.getElementById('txn-category').value
            });
            saveData('transactions', transactions);
            renderFinancial();
            closeModal();
        });
    };

    renderAddForm();
});



// ==================== CHANGE CATEGORY ====================
function changeCategory(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    const renderChangeForm = () => {
        const categoryOptions = Object.entries(CATEGORIES)
            .map(([key, val]) => `<option value="${key}" ${key === txn.category ? 'selected' : ''}>${val.label}</option>`)
            .join('') + '<option value="ADD_NEW">+ Add New Category...</option>';

        openModal('Change Category', `
            <p style="margin-bottom:12px;">"${txn.description}"</p>
            <div class="form-group">
                <label>Category</label>
                <select class="input-select" id="change-cat-select">${categoryOptions}</select>
            </div>
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:16px; cursor:pointer;">
                <input type="checkbox" id="change-cat-remember" style="width:auto;">
                <span class="text-muted">Remember this category for similar descriptions</span>
            </label>
            <button class="btn btn-primary" id="change-cat-save" style="width:100%;">Save</button>
        `);

        const catSelect = document.getElementById('change-cat-select');
        catSelect.addEventListener('change', (e) => {
            if (e.target.value === 'ADD_NEW') {
                promptAddCategory((newKey) => {
                    renderChangeForm();
                    document.getElementById('change-cat-select').value = newKey;
                });
            }
        });

        document.getElementById('change-cat-save').addEventListener('click', () => {
            const newCatKey = document.getElementById('change-cat-select').value;
            if (newCatKey === 'ADD_NEW') return;

            const remember = document.getElementById('change-cat-remember').checked;

            // Auto-switch type if the category implies a different type
            const newCat = CATEGORIES[newCatKey];
            if (newCat && newCat.type) {
                txn.type = newCat.type;
            }

            txn.category = newCatKey;

            if (remember) {
                categoryOverrides[txn.description.toLowerCase()] = newCatKey;
                saveData('category_overrides', categoryOverrides);
            }

            saveData('transactions', transactions);
            renderFinancial();
            closeModal();
        });
    };

    renderChangeForm();
}

function promptAddCategory(callback) {
    const prevTitle = document.getElementById('modal-title').textContent;
    const prevContent = document.getElementById('modal-body').innerHTML;

    openModal('Add New Category', `
        <div class="form-group">
            <label>Category Name</label>
            <input type="text" class="input-text" id="new-cat-label" placeholder="e.g., 🧩 Hobby" required>
        </div>
        <div class="form-group">
            <label>Default Type</label>
            <select class="input-select" id="new-cat-type">
                <option value="expense">Expense (-)</option>
                <option value="income">Income (+)</option>
            </select>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn btn-outline" id="btn-cancel-cat" style="flex:1;">Cancel</button>
            <button class="btn btn-primary" id="btn-save-new-cat" style="flex:2;">Create Category</button>
        </div>
    `);

    document.getElementById('btn-cancel-cat').addEventListener('click', () => {
        openModal(prevTitle, prevContent);
    });

    document.getElementById('btn-save-new-cat').addEventListener('click', () => {
        const label = document.getElementById('new-cat-label').value.trim();
        const type = document.getElementById('new-cat-type').value;
        if (!label) { alert('Please enter a name.'); return; }

        const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (CATEGORIES[key]) { alert('Category already exists!'); return; }

        CATEGORIES[key] = { label, class: 'cat-custom', type };
        saveData('financial_categories', CATEGORIES);

        if (callback) callback(key);
        else closeModal();
    });
}

function manageCategories() {
    const rows = Object.entries(CATEGORIES).map(([key, cat]) => `
        <tr>
            <td><span class="category-badge ${cat.class}">${cat.label}</span></td>
            <td><span class="badge" style="font-size:0.75rem;">${cat.type}</span></td>
            <td style="text-align:right;">
                <button class="btn btn-outline btn-sm" onclick="editCategory('${key}')">✏️ Edit</button>
            </td>
        </tr>
    `).join('');

    openModal('Manage Categories', `
        <div class="data-table-container" style="max-height:400px; overflow-y:auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Type</th>
                        <th style="text-align:right;">Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <button class="btn btn-primary" id="btn-add-cat-manager" style="width:100%; margin-top:16px;">+ Add New Category</button>
    `);

    document.getElementById('btn-add-cat-manager').addEventListener('click', () => {
        promptAddCategory(() => manageCategories());
    });
}

function editCategory(key) {
    const cat = CATEGORIES[key];
    if (!cat) return;

    openModal(`Edit Category: ${cat.label}`, `
        <div class="form-group">
            <label>Category Name (Emoji + Label)</label>
            <input type="text" class="input-text" id="edit-cat-label" value="${cat.label}" required>
        </div>
        <div class="form-group">
            <label>Transaction Type</label>
            <select class="input-select" id="edit-cat-type">
                <option value="expense" ${cat.type === 'expense' ? 'selected' : ''}>Expense (-)</option>
                <option value="income" ${cat.type === 'income' ? 'selected' : ''}>Income (+)</option>
            </select>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn btn-outline" id="btn-cancel-edit-cat" style="flex:1;">Back</button>
            <button class="btn btn-primary" id="btn-save-edit-cat" style="flex:2;">Save Changes</button>
        </div>
    `);

    document.getElementById('btn-cancel-edit-cat').addEventListener('click', manageCategories);

    document.getElementById('btn-save-edit-cat').addEventListener('click', () => {
        const newLabel = document.getElementById('edit-cat-label').value.trim();
        const newType = document.getElementById('edit-cat-type').value;

        if (!newLabel) { alert('Name cannot be empty.'); return; }

        CATEGORIES[key].label = newLabel;
        CATEGORIES[key].type = newType;

        saveData('financial_categories', CATEGORIES);
        renderFinancial();
        manageCategories();
    });
}




// ==================== DELETE TRANSACTION ====================
function deleteTransaction(txnId) {
    if (!confirm('Delete this transaction?')) return;
    transactions = transactions.filter(t => t.id !== txnId);
    saveData('transactions', transactions);
    renderFinancial();
}

function editDescription(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    const newDesc = prompt('Edit Description:', txn.description);
    if (newDesc !== null && newDesc.trim() !== '') {
        txn.description = newDesc.trim();
        saveData('transactions', transactions);
        renderFinancial();
    }
}



// ==================== RENDER FINANCIAL ====================
let chartExpenseCategory = null;
let chartMonthlyTrend = null;
let chartInvestment = null;

function getFilteredTransactions() {
    const start = document.getElementById('fin-filter-start').value;
    const end = document.getElementById('fin-filter-end').value;
    const cat = document.getElementById('fin-filter-category').value;

    let filtered = [...transactions];

    if (start) filtered = filtered.filter(t => t.date >= start);
    if (end) filtered = filtered.filter(t => t.date <= end);
    if (cat) filtered = filtered.filter(t => t.category === cat);

    return filtered;
}

function renderFinancial() {
    const filtered = getFilteredTransactions();

    renderSummaryCards(filtered);
    renderTransactionsTable(filtered);
    renderExpenseCategoryChart(filtered);
    renderMonthlyTrendChart(filtered);

    renderInvestments();
    populateFilters();
}


function renderSummaryCards(filteredTxns) {
    const income = filteredTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filteredTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const investTotal = investments.reduce((s, i) => s + (i.value || 0), 0);

    document.getElementById('fin-balance').textContent = formatRupiah(balance);
    document.getElementById('fin-income').textContent = formatRupiah(income);
    document.getElementById('fin-expense').textContent = formatRupiah(expense);
    document.getElementById('fin-investment').textContent = formatRupiah(investTotal);
}


function renderTransactionsTable(filtered) {
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const tbody = document.getElementById('transactions-body');
    const empty = document.getElementById('fin-empty');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }


    empty.style.display = 'none';
    tbody.innerHTML = filtered.map(t => {
        const cat = CATEGORIES[t.category] || CATEGORIES.uncategorized;
        const catClass = cat.class;
        const amountClass = t.type === 'income' ? 'income-text' : 'expense-text';
        const sign = t.type === 'income' ? '+' : '-';

        return `<tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="editable-desc" onclick="editDescription('${t.id}')" title="Click to edit">${t.description || '—'}</span></td>
            <td><span class="category-badge ${catClass}" onclick="changeCategory('${t.id}')">${cat.label}</span></td>
            <td class="${amountClass}">${sign}${formatRupiah(t.amount)}</td>
            <td><span class="badge" style="font-size:0.72rem;">${t.type}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteTransaction('${t.id}')">🗑️</button></td>
        </tr>`;

    }).join('');
}

function populateFilters() {
    const catSet = new Set();
    transactions.forEach(t => {
        if (t.category) catSet.add(t.category);
    });

    const catFilter = document.getElementById('fin-filter-category');
    const currentCatVal = catFilter.value;

    catFilter.innerHTML = '<option value="">All Categories</option>' +
        [...catSet].sort().map(c => {
            const cat = CATEGORIES[c] || CATEGORIES.uncategorized;
            return `<option value="${c}" ${c === currentCatVal ? 'selected' : ''}>${cat.label}</option>`;
        }).join('');
}


// Filter change listeners
document.getElementById('fin-filter-start').addEventListener('change', renderFinancial);
document.getElementById('fin-filter-end').addEventListener('change', renderFinancial);
document.getElementById('fin-filter-category').addEventListener('change', renderFinancial);
document.getElementById('btn-manage-categories').addEventListener('click', manageCategories);

document.getElementById('btn-reset-filters').addEventListener('click', () => {

    document.getElementById('fin-filter-start').value = '';
    document.getElementById('fin-filter-end').value = '';
    document.getElementById('fin-filter-category').value = '';
    renderFinancial();
});



// ==================== CHARTS ====================
function renderExpenseCategoryChart(filtered) {
    const canvas = document.getElementById('chart-expense-category');
    if (!canvas) return;

    const expenses = filtered.filter(t => t.type === 'expense');
    const byCategory = {};
    expenses.forEach(t => {
        const cat = CATEGORIES[t.category] || CATEGORIES.uncategorized;
        byCategory[cat.label] = (byCategory[cat.label] || 0) + t.amount;
    });


    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);
    const colors = ['#bb86fc', '#03dac6', '#ef5350', '#ffab40', '#42a5f5', '#f48fb1', '#81c784', '#ce93d8', '#64b5f6', '#ffcc80', '#b0bec5'];

    if (chartExpenseCategory) chartExpenseCategory.destroy();

    chartExpenseCategory = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif", size: 11 }, padding: 14 }

                }
            }
        }
    });
}

function renderMonthlyTrendChart(filtered) {
    const canvas = document.getElementById('chart-monthly-trend');
    if (!canvas) return;

    const monthlyData = {};
    filtered.forEach(t => {
        if (!t.date) return;
        const month = t.date.substring(0, 7);
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (t.type === 'income') monthlyData[month].income += t.amount;
        else monthlyData[month].expense += t.amount;
    });

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);

    if (chartMonthlyTrend) chartMonthlyTrend.destroy();

    chartMonthlyTrend = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#03dac6',
                    backgroundColor: 'rgba(3, 218, 198, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#03dac6'
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    borderColor: '#ef5350',
                    backgroundColor: 'rgba(239, 83, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef5350'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#5a5a75', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: {
                    ticks: {
                        color: '#5a5a75',
                        font: { size: 10 },
                        callback: (val) => formatRupiah(val)
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif" } } }
            }
        }

    });
}


// ==================== INVESTMENTS ====================
document.getElementById('btn-add-investment').addEventListener('click', () => {
    openModal('Add Investment', `
        <form id="form-add-invest">
            <div class="form-group">
                <label>Asset Name</label>
                <input type="text" class="input-text" id="invest-name" placeholder="e.g., Reksadana Pasar Uang" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Type</label>
                    <select class="input-select" id="invest-type">
                        <option value="Reksa Dana">Reksa Dana</option>
                        <option value="Saham">Saham</option>
                        <option value="Obligasi">Obligasi</option>
                        <option value="Deposito">Deposito</option>
                        <option value="Emas">Emas</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Property">Property</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Current Value (Rp)</label>
                    <input type="number" class="input-text" id="invest-value" placeholder="10000000" min="0" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Add Asset</button>
        </form>
    `);

    document.getElementById('form-add-invest').addEventListener('submit', (e) => {
        e.preventDefault();
        investments.push({
            id: generateId(),
            name: document.getElementById('invest-name').value,
            type: document.getElementById('invest-type').value,
            value: parseFloat(document.getElementById('invest-value').value)
        });
        saveData('investments', investments);
        renderFinancial();
        closeModal();
    });
});

function deleteInvestment(id) {
    if (!confirm('Remove this investment?')) return;
    investments = investments.filter(i => i.id !== id);
    saveData('investments', investments);
    renderFinancial();
}

function renderInvestments() {
    const tbody = document.getElementById('investment-body');
    const empty = document.getElementById('invest-empty');
    const total = investments.reduce((s, i) => s + (i.value || 0), 0);

    if (investments.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        tbody.innerHTML = investments.map(i => {
            const pct = total > 0 ? ((i.value / total) * 100).toFixed(1) : 0;
            return `<tr>
                <td>${i.name}</td>
                <td><span class="badge">${i.type}</span></td>
                <td>${formatRupiah(i.value)}</td>
                <td>${pct}%</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteInvestment('${i.id}')">🗑️</button></td>
            </tr>`;
        }).join('');
    }

    // Investment chart
    renderInvestmentChart();
}

function renderInvestmentChart() {
    const canvas = document.getElementById('chart-investment');
    if (!canvas) return;

    if (investments.length === 0) {
        if (chartInvestment) chartInvestment.destroy();
        return;
    }

    const labels = investments.map(i => i.name);
    const data = investments.map(i => i.value);
    const colors = ['#bb86fc', '#03dac6', '#ffab40', '#42a5f5', '#f48fb1', '#81c784', '#ef5350', '#ce93d8'];

    if (chartInvestment) chartInvestment.destroy();

    chartInvestment = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif", size: 10 }, padding: 10 }
                }

            }
        }
    });
}


// ==================== INIT ====================
renderFinancial();
