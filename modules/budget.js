/* ========================================
   BUDGET MODULE
   Budget vs Actual comparison per category per month
   Excel import, inline editing, year filter, charts
   ======================================== */

// ==================== STATE ====================
let budgetData = loadData('budget', {});
// Structure: { "2026": { "groceries": { "1": 500000, "2": 500000, ... }, ... } }

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let budgetSelectedYear = new Date().getFullYear().toString();

// ==================== YEAR FILTER ====================
function populateBudgetYearFilter() {
    const yearSet = new Set();

    // Collect years from budget data
    Object.keys(budgetData).forEach(y => yearSet.add(y));

    // Collect years from transactions
    if (typeof transactions !== 'undefined') {
        transactions.forEach(t => {
            if (t.date) yearSet.add(t.date.substring(0, 4));
        });
    }

    // Always include current year
    const currentYear = new Date().getFullYear().toString();
    yearSet.add(currentYear);

    // Add surrounding years for convenience
    yearSet.add((parseInt(currentYear) - 1).toString());
    yearSet.add((parseInt(currentYear) + 1).toString());

    const years = [...yearSet].sort().reverse();

    const select = document.getElementById('budget-year-filter');
    const prevVal = select.value || budgetSelectedYear;

    select.innerHTML = years.map(y =>
        `<option value="${y}" ${y === prevVal ? 'selected' : ''}>${y}</option>`
    ).join('');

    budgetSelectedYear = select.value || currentYear;
}

document.getElementById('budget-year-filter').addEventListener('change', (e) => {
    budgetSelectedYear = e.target.value;
    renderBudget();
});


// ==================== GET ACTUALS FROM TRANSACTIONS ====================
function getActualsByCategory(year) {
    const actuals = {}; // { categoryKey: { "1": amount, "2": amount, ... } }

    if (typeof transactions === 'undefined') return actuals;

    transactions.forEach(t => {
        if (!t.date || t.type !== 'expense') return;
        const txnYear = t.date.substring(0, 4);
        if (txnYear !== year) return;

        const month = parseInt(t.date.substring(5, 7)).toString(); // "01" -> "1"
        const cat = t.category || 'uncategorized';

        if (!actuals[cat]) actuals[cat] = {};
        actuals[cat][month] = (actuals[cat][month] || 0) + t.amount;
    });

    return actuals;
}


// ==================== ENSURE YEAR BUDGET EXISTS ====================
function ensureYearBudget(year) {
    if (!budgetData[year]) {
        budgetData[year] = {};
    }
}


// ==================== EXCEL IMPORT ====================
document.getElementById('budget-excel-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonData.length < 2) {
                alert('❌ No data found in Excel file.');
                return;
            }

            // Parse header row to detect months
            const headerRow = jsonData[0];
            showBudgetImportPreview(jsonData, headerRow);
        } catch (err) {
            console.error('Budget Excel import error:', err);
            alert('❌ Failed to read Excel file. Please check the format.');
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
});


function showBudgetImportPreview(jsonData, headerRow) {
    // Parse the data rows (skip header)
    const parsed = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0] || row[0].toString().trim() === '') continue;

        const categoryName = row[0].toString().trim();
        const budgets = {};

        // Columns B onwards are budget values for Jan, Feb, ...
        for (let m = 1; m <= 12 && m < row.length; m++) {
            const val = parseFloat(row[m]) || 0;
            budgets[m.toString()] = val;
        }

        // Try to match category to existing ones
        const matchedKey = matchCategory(categoryName);

        parsed.push({
            originalName: categoryName,
            matchedKey: matchedKey,
            isNew: !matchedKey,
            budgets: budgets
        });
    }

    if (parsed.length === 0) {
        alert('❌ No valid budget rows found.');
        return;
    }

    // Build preview table
    let previewRows = parsed.map((p, idx) => {
        const statusIcon = p.isNew ? '🆕' : '✅';
        const matchedLabel = p.isNew
            ? `<span style="color: var(--orange);">New: "${p.originalName}"</span>`
            : `<span style="color: var(--teal);">${(CATEGORIES[p.matchedKey] || {}).label || p.matchedKey}</span>`;

        const totalBudget = Object.values(p.budgets).reduce((s, v) => s + v, 0);

        return `<tr>
            <td>${statusIcon}</td>
            <td>${p.originalName}</td>
            <td>${matchedLabel}</td>
            <td style="text-align:right;">${formatRupiah(totalBudget)}</td>
        </tr>`;
    }).join('');

    const yearToImport = budgetSelectedYear;

    openModal('Import Budget Preview', `
        <p class="text-muted" style="margin-bottom:12px;">Review the budget data before importing for <strong>${yearToImport}</strong>:</p>
        <div class="data-table-container" style="max-height:350px; overflow-y:auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:40px;"></th>
                        <th>Excel Category</th>
                        <th>Matched To</th>
                        <th style="text-align:right;">Total Budget</th>
                    </tr>
                </thead>
                <tbody>${previewRows}</tbody>
            </table>
        </div>
        <p class="text-muted" style="margin-top:12px; font-size:0.82rem;">
            🆕 = New category will be auto-created &nbsp; ✅ = Matched to existing category
        </p>
        <div style="display:flex; gap:10px; margin-top:16px;">
            <button class="btn btn-outline" id="btn-import-cancel" style="flex:1;">Cancel</button>
            <button class="btn btn-primary" id="btn-import-confirm" style="flex:2;">Import Budget</button>
        </div>
    `);

    document.getElementById('btn-import-cancel').addEventListener('click', closeModal);
    document.getElementById('btn-import-confirm').addEventListener('click', () => {
        importBudgetData(parsed, yearToImport);
        closeModal();
    });
}


function matchCategory(name) {
    if (!name) return null;
    const lower = name.toLowerCase().trim();

    // Direct key match
    if (CATEGORIES[lower]) return lower;

    // Match by label (case insensitive, ignoring emoji)
    for (const [key, cat] of Object.entries(CATEGORIES)) {
        const cleanLabel = cat.label.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().toLowerCase();
        if (cleanLabel === lower) return key;
        if (lower.includes(cleanLabel) || cleanLabel.includes(lower)) return key;
    }

    // Match by key similarity
    const normalizedName = lower.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    if (CATEGORIES[normalizedName]) return normalizedName;

    return null;
}


function importBudgetData(parsed, year) {
    ensureYearBudget(year);

    let newCategoriesCreated = 0;

    parsed.forEach(p => {
        let catKey = p.matchedKey;

        // Auto-create new category if not matched
        if (!catKey) {
            catKey = p.originalName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
            if (!CATEGORIES[catKey]) {
                CATEGORIES[catKey] = {
                    label: p.originalName,
                    class: 'cat-custom',
                    type: 'expense'
                };
                newCategoriesCreated++;
            }
        }

        // Set budget values
        budgetData[year][catKey] = { ...p.budgets };
    });

    // Save everything
    if (newCategoriesCreated > 0) {
        saveData('financial_categories', CATEGORIES);
    }
    saveData('budget', budgetData);
    renderBudget();

    // Also refresh financial module if available
    if (typeof renderFinancial === 'function') {
        renderFinancial();
    }

    alert(`✅ Budget imported for ${year}! ${parsed.length} categories loaded${newCategoriesCreated > 0 ? `, ${newCategoriesCreated} new categories created` : ''}.`);
}


// ==================== INLINE BUDGET EDITING ====================
function updateBudgetCell(catKey, month, value) {
    ensureYearBudget(budgetSelectedYear);

    if (!budgetData[budgetSelectedYear][catKey]) {
        budgetData[budgetSelectedYear][catKey] = {};
    }

    budgetData[budgetSelectedYear][catKey][month] = parseFloat(value) || 0;
    saveData('budget', budgetData);

    // Debounced re-render of summary + charts (don't re-render table to keep focus)
    clearTimeout(window._budgetRenderTimer);
    window._budgetRenderTimer = setTimeout(() => {
        renderBudgetSummary();
        renderBudgetCharts();
    }, 500);
}


// ==================== ADD CATEGORY TO BUDGET ====================
document.getElementById('btn-budget-add-category').addEventListener('click', () => {
    const existingBudgetCats = budgetData[budgetSelectedYear] ? Object.keys(budgetData[budgetSelectedYear]) : [];

    // Show categories not yet in budget
    const availableCats = Object.entries(CATEGORIES)
        .filter(([key]) => !existingBudgetCats.includes(key) && key !== 'income' && key !== 'uncategorized')
        .map(([key, cat]) => `<option value="${key}">${cat.label}</option>`)
        .join('');

    openModal('Add Category to Budget', `
        <div class="form-group">
            <label>Select Category</label>
            <select class="input-select" id="budget-add-cat-select">
                ${availableCats || '<option value="" disabled>All categories already added</option>'}
                <option value="ADD_NEW">+ Create New Category...</option>
            </select>
        </div>
        <div class="form-group">
            <label>Default Monthly Budget (Rp)</label>
            <input type="number" class="input-text" id="budget-add-default" placeholder="e.g., 500000" min="0" value="0">
        </div>
        <button class="btn btn-primary" id="btn-budget-add-confirm" style="width:100%; margin-top:8px;">Add to Budget</button>
    `);

    const catSelect = document.getElementById('budget-add-cat-select');
    catSelect.addEventListener('change', (e) => {
        if (e.target.value === 'ADD_NEW') {
            promptAddCategory((newKey) => {
                // Re-open the add budget category modal with new category selected
                document.getElementById('btn-budget-add-category').click();
            });
        }
    });

    document.getElementById('btn-budget-add-confirm').addEventListener('click', () => {
        const catKey = catSelect.value;
        if (!catKey || catKey === 'ADD_NEW') return;

        const defaultBudget = parseFloat(document.getElementById('budget-add-default').value) || 0;

        ensureYearBudget(budgetSelectedYear);
        budgetData[budgetSelectedYear][catKey] = {};
        for (let m = 1; m <= 12; m++) {
            budgetData[budgetSelectedYear][catKey][m.toString()] = defaultBudget;
        }

        saveData('budget', budgetData);
        renderBudget();
        closeModal();
    });
});


// ==================== DELETE CATEGORY FROM BUDGET ====================
function deleteBudgetCategory(catKey) {
    if (!confirm(`Remove "${(CATEGORIES[catKey] || {}).label || catKey}" from budget for ${budgetSelectedYear}?`)) return;

    if (budgetData[budgetSelectedYear] && budgetData[budgetSelectedYear][catKey]) {
        delete budgetData[budgetSelectedYear][catKey];
        saveData('budget', budgetData);
        renderBudget();
    }
}


// ==================== EXPORT BUDGET ====================
document.getElementById('btn-budget-export').addEventListener('click', () => {
    const year = budgetSelectedYear;
    const yearBudget = budgetData[year] || {};
    const actuals = getActualsByCategory(year);
    const allCats = new Set([...Object.keys(yearBudget), ...Object.keys(actuals)]);

    if (allCats.size === 0) {
        alert('No budget data to export for ' + year);
        return;
    }

    // Build export data
    const headers = ['Category'];
    for (let m = 1; m <= 12; m++) {
        headers.push(`Budget ${MONTH_NAMES_SHORT[m - 1]} ${year.slice(2)}`);
        headers.push(`Actual ${MONTH_NAMES_SHORT[m - 1]} ${year.slice(2)}`);
        headers.push(`% ${MONTH_NAMES_SHORT[m - 1]} ${year.slice(2)}`);
    }

    const rows = [headers];

    allCats.forEach(catKey => {
        const cat = CATEGORIES[catKey] || { label: catKey };
        const catLabel = cat.label.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
        const row = [catLabel];

        for (let m = 1; m <= 12; m++) {
            const budget = (yearBudget[catKey] || {})[m.toString()] || 0;
            const actual = (actuals[catKey] || {})[m.toString()] || 0;
            const pct = budget > 0 ? ((actual / budget) * 100).toFixed(1) : (actual > 0 ? '∞' : '0.0');
            row.push(budget, actual, pct + '%');
        }

        rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Budget ${year}`);
    XLSX.writeFile(wb, `bella_budget_${year}.xlsx`);
});


// ==================== RENDER BUDGET ====================
let chartBudgetCategory = null;
let chartBudgetVariance = null;

function renderBudget() {
    populateBudgetYearFilter();
    renderBudgetTable();
    renderBudgetSummary();
    renderBudgetCharts();
}


function renderBudgetSummary() {
    const year = budgetSelectedYear;
    const yearBudget = budgetData[year] || {};
    const actuals = getActualsByCategory(year);

    let totalBudget = 0;
    let totalActual = 0;

    const allCats = new Set([...Object.keys(yearBudget), ...Object.keys(actuals)]);

    allCats.forEach(catKey => {
        for (let m = 1; m <= 12; m++) {
            totalBudget += (yearBudget[catKey] || {})[m.toString()] || 0;
            totalActual += (actuals[catKey] || {})[m.toString()] || 0;
        }
    });

    const variance = totalBudget - totalActual;
    const utilization = totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0;

    document.getElementById('budget-total-budget').textContent = formatRupiah(totalBudget);
    document.getElementById('budget-total-actual').textContent = formatRupiah(totalActual);

    const varianceEl = document.getElementById('budget-total-variance');
    varianceEl.textContent = formatRupiah(Math.abs(variance));
    varianceEl.className = 'budget-stat-value ' + (variance >= 0 ? 'budget-positive' : 'budget-negative');

    document.getElementById('budget-variance-icon').textContent = variance >= 0 ? '✅' : '⚠️';
    document.getElementById('budget-utilization').textContent = utilization + '%';
}


function renderBudgetTable() {
    const year = budgetSelectedYear;
    const yearBudget = budgetData[year] || {};
    const actuals = getActualsByCategory(year);

    // Get all categories that have either budget or actual data
    const allCats = new Set([...Object.keys(yearBudget), ...Object.keys(actuals)]);

    const thead = document.getElementById('budget-thead');
    const tbody = document.getElementById('budget-tbody');
    const tfoot = document.getElementById('budget-tfoot');
    const emptyState = document.getElementById('budget-empty');
    const tableEl = document.getElementById('budget-table');

    if (allCats.size === 0) {
        tableEl.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableEl.style.display = '';
    emptyState.style.display = 'none';

    // Build header
    let headerHTML = '<tr><th class="budget-sticky-col">Category</th>';
    for (let m = 1; m <= 12; m++) {
        headerHTML += `<th colspan="3" class="budget-month-header">${MONTH_NAMES_SHORT[m - 1]} ${year.slice(2)}</th>`;
    }
    headerHTML += '<th colspan="3" class="budget-month-header budget-ytd-header">YTD Total</th>';
    headerHTML += '<th class="budget-action-col"></th></tr>';

    // Sub-header row
    headerHTML += '<tr class="budget-sub-header"><td class="budget-sticky-col"></td>';
    for (let m = 1; m <= 13; m++) { // 12 months + YTD
        headerHTML += '<th class="budget-sub-th">Budget</th><th class="budget-sub-th">Actual</th><th class="budget-sub-th">%</th>';
    }
    headerHTML += '<td></td></tr>';
    thead.innerHTML = headerHTML;

    // Build body rows
    let bodyHTML = '';
    const sortedCats = [...allCats].sort((a, b) => {
        const la = (CATEGORIES[a] || {}).label || a;
        const lb = (CATEGORIES[b] || {}).label || b;
        return la.localeCompare(lb);
    });

    // Track totals per month for footer
    const monthTotals = {};
    for (let m = 1; m <= 12; m++) {
        monthTotals[m] = { budget: 0, actual: 0 };
    }

    sortedCats.forEach(catKey => {
        const cat = CATEGORIES[catKey] || { label: catKey, class: 'cat-custom' };
        const catBudgets = yearBudget[catKey] || {};
        const catActuals = actuals[catKey] || {};

        let ytdBudget = 0;
        let ytdActual = 0;

        bodyHTML += `<tr data-budget-cat="${catKey}">`;
        bodyHTML += `<td class="budget-sticky-col"><span class="category-badge ${cat.class}">${cat.label}</span></td>`;

        for (let m = 1; m <= 12; m++) {
            const bVal = catBudgets[m.toString()] || 0;
            const aVal = catActuals[m.toString()] || 0;
            const pct = bVal > 0 ? ((aVal / bVal) * 100) : (aVal > 0 ? 999 : 0);
            const pctClass = pct > 100 ? 'budget-pct-over' : (pct > 80 ? 'budget-pct-warn' : 'budget-pct-under');

            ytdBudget += bVal;
            ytdActual += aVal;
            monthTotals[m].budget += bVal;
            monthTotals[m].actual += aVal;

            bodyHTML += `<td class="budget-cell">
                <input type="number" class="budget-cell-input" 
                    value="${bVal}" min="0"
                    data-cat="${catKey}" data-month="${m}"
                    onchange="updateBudgetCell('${catKey}', '${m}', this.value)"
                    onfocus="this.select()">
            </td>`;
            bodyHTML += `<td class="budget-cell budget-actual-cell">${formatRupiah(aVal)}</td>`;
            bodyHTML += `<td class="budget-cell ${pctClass}">${pct > 900 ? '∞' : pct.toFixed(0)}%</td>`;
        }

        // YTD totals
        const ytdPct = ytdBudget > 0 ? ((ytdActual / ytdBudget) * 100) : (ytdActual > 0 ? 999 : 0);
        const ytdPctClass = ytdPct > 100 ? 'budget-pct-over' : (ytdPct > 80 ? 'budget-pct-warn' : 'budget-pct-under');

        bodyHTML += `<td class="budget-cell budget-ytd-cell"><strong>${formatRupiah(ytdBudget)}</strong></td>`;
        bodyHTML += `<td class="budget-cell budget-ytd-cell"><strong>${formatRupiah(ytdActual)}</strong></td>`;
        bodyHTML += `<td class="budget-cell budget-ytd-cell ${ytdPctClass}"><strong>${ytdPct > 900 ? '∞' : ytdPct.toFixed(0)}%</strong></td>`;

        bodyHTML += `<td class="budget-action-col">
            <button class="btn btn-danger btn-sm" onclick="deleteBudgetCategory('${catKey}')" title="Remove">🗑️</button>
        </td>`;
        bodyHTML += '</tr>';
    });

    tbody.innerHTML = bodyHTML;

    // Footer totals
    let footerHTML = '<tr class="budget-footer-row"><td class="budget-sticky-col"><strong>TOTAL</strong></td>';
    let grandBudget = 0;
    let grandActual = 0;

    for (let m = 1; m <= 12; m++) {
        const b = monthTotals[m].budget;
        const a = monthTotals[m].actual;
        const pct = b > 0 ? ((a / b) * 100) : (a > 0 ? 999 : 0);
        const pctClass = pct > 100 ? 'budget-pct-over' : (pct > 80 ? 'budget-pct-warn' : 'budget-pct-under');

        grandBudget += b;
        grandActual += a;

        footerHTML += `<td class="budget-cell"><strong>${formatRupiah(b)}</strong></td>`;
        footerHTML += `<td class="budget-cell"><strong>${formatRupiah(a)}</strong></td>`;
        footerHTML += `<td class="budget-cell ${pctClass}"><strong>${pct > 900 ? '∞' : pct.toFixed(0)}%</strong></td>`;
    }

    // YTD grand total
    const grandPct = grandBudget > 0 ? ((grandActual / grandBudget) * 100) : (grandActual > 0 ? 999 : 0);
    const grandPctClass = grandPct > 100 ? 'budget-pct-over' : (grandPct > 80 ? 'budget-pct-warn' : 'budget-pct-under');

    footerHTML += `<td class="budget-cell budget-ytd-cell"><strong>${formatRupiah(grandBudget)}</strong></td>`;
    footerHTML += `<td class="budget-cell budget-ytd-cell"><strong>${formatRupiah(grandActual)}</strong></td>`;
    footerHTML += `<td class="budget-cell budget-ytd-cell ${grandPctClass}"><strong>${grandPct > 900 ? '∞' : grandPct.toFixed(0)}%</strong></td>`;
    footerHTML += '<td></td></tr>';

    tfoot.innerHTML = footerHTML;
}


// ==================== CHARTS ====================
function renderBudgetCharts() {
    renderBudgetCategoryChart();
    renderBudgetVarianceChart();
}

function renderBudgetCategoryChart() {
    const canvas = document.getElementById('chart-budget-category');
    if (!canvas) return;

    const year = budgetSelectedYear;
    const yearBudget = budgetData[year] || {};
    const actuals = getActualsByCategory(year);
    const allCats = [...new Set([...Object.keys(yearBudget), ...Object.keys(actuals)])];

    if (allCats.length === 0) {
        if (chartBudgetCategory) chartBudgetCategory.destroy();
        chartBudgetCategory = null;
        return;
    }

    const labels = [];
    const budgetAmounts = [];
    const actualAmounts = [];

    allCats.sort((a, b) => {
        const la = (CATEGORIES[a] || {}).label || a;
        const lb = (CATEGORIES[b] || {}).label || b;
        return la.localeCompare(lb);
    }).forEach(catKey => {
        const cat = CATEGORIES[catKey] || { label: catKey };
        const cleanLabel = cat.label.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
        labels.push(cleanLabel);

        let bTotal = 0, aTotal = 0;
        for (let m = 1; m <= 12; m++) {
            bTotal += (yearBudget[catKey] || {})[m.toString()] || 0;
            aTotal += (actuals[catKey] || {})[m.toString()] || 0;
        }
        budgetAmounts.push(bTotal);
        actualAmounts.push(aTotal);
    });

    if (chartBudgetCategory) chartBudgetCategory.destroy();

    chartBudgetCategory = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Budget',
                    data: budgetAmounts,
                    backgroundColor: 'rgba(124, 77, 255, 0.6)',
                    borderColor: '#7c4dff',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Actual',
                    data: actualAmounts,
                    backgroundColor: 'rgba(3, 218, 198, 0.6)',
                    borderColor: '#03dac6',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#5a5a75', font: { size: 10 }, maxRotation: 45 },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
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
                legend: {
                    labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif" } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}`
                    }
                }
            }
        }
    });
}


function renderBudgetVarianceChart() {
    const canvas = document.getElementById('chart-budget-variance');
    if (!canvas) return;

    const year = budgetSelectedYear;
    const yearBudget = budgetData[year] || {};
    const actuals = getActualsByCategory(year);
    const allCats = [...new Set([...Object.keys(yearBudget), ...Object.keys(actuals)])];

    if (allCats.length === 0) {
        if (chartBudgetVariance) chartBudgetVariance.destroy();
        chartBudgetVariance = null;
        return;
    }

    const labels = MONTH_NAMES_SHORT.map((m, i) => `${m} ${year.slice(2)}`);
    const budgetByMonth = [];
    const actualByMonth = [];
    const varianceByMonth = [];

    for (let m = 1; m <= 12; m++) {
        let bTotal = 0, aTotal = 0;
        allCats.forEach(catKey => {
            bTotal += (yearBudget[catKey] || {})[m.toString()] || 0;
            aTotal += (actuals[catKey] || {})[m.toString()] || 0;
        });
        budgetByMonth.push(bTotal);
        actualByMonth.push(aTotal);
        varianceByMonth.push(bTotal - aTotal);
    }

    if (chartBudgetVariance) chartBudgetVariance.destroy();

    chartBudgetVariance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Budget',
                    data: budgetByMonth,
                    borderColor: '#7c4dff',
                    backgroundColor: 'rgba(124, 77, 255, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#7c4dff'
                },
                {
                    label: 'Actual',
                    data: actualByMonth,
                    borderColor: '#03dac6',
                    backgroundColor: 'rgba(3, 218, 198, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#03dac6'
                },
                {
                    label: 'Variance',
                    data: varianceByMonth,
                    borderColor: '#ef5350',
                    backgroundColor: 'rgba(239, 83, 80, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef5350',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#5a5a75', font: { size: 10 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
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
                legend: {
                    labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif" } }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}`
                    }
                }
            }
        }
    });
}


// ==================== INIT ====================
renderBudget();
