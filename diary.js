/* ========================================
   BELLA'S HOUSEHOLD DASHBOARD — DIARY MODULE
   CRUD + Excel Download (All / Selected)
   ======================================== */

(function () {
    'use strict';

    // ==================== DATA ====================
    let diaryEntries = loadData('diary', []);
    let selectedIds = new Set();

    // ==================== DOM ====================
    const diaryBody = document.getElementById('diary-body');
    const diaryEmpty = document.getElementById('diary-empty');
    const btnAdd = document.getElementById('btn-add-diary');
    const btnDownloadAll = document.getElementById('btn-diary-download-all');
    const btnDownloadSelected = document.getElementById('btn-diary-download-selected');
    const selectAllChk = document.getElementById('diary-select-all');
    const selectedCountBadge = document.getElementById('diary-selected-count');
    const filterStart = document.getElementById('diary-filter-start');
    const filterEnd = document.getElementById('diary-filter-end');
    const searchInput = document.getElementById('diary-search');
    const btnResetFilters = document.getElementById('btn-diary-reset-filters');

    // Stat elements
    const elTotalCount = document.getElementById('diary-total-count');
    const elThisMonth = document.getElementById('diary-this-month');
    const elStreak = document.getElementById('diary-streak');

    // ==================== HELPERS ====================
    function persist() {
        saveData('diary', diaryEntries);
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'diary-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2600);
    }

    function getNowISO() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getNowDatetimeLocal() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    }

    // ==================== STATS ====================
    function updateStats() {
        // Total
        elTotalCount.textContent = diaryEntries.length;

        // This month
        const now = new Date();
        const thisMonth = diaryEntries.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        elThisMonth.textContent = thisMonth;

        // Streak: consecutive days with at least one entry going backwards from today
        const uniqueDays = [...new Set(diaryEntries.map(e => e.date.slice(0, 10)))].sort().reverse();
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 366; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const ds = checkDate.toISOString().slice(0, 10);
            if (uniqueDays.includes(ds)) {
                streak++;
            } else {
                // allow skipping today if no entry yet (but still count previous consecutive)
                if (i === 0) continue;
                break;
            }
        }
        elStreak.textContent = streak;
    }

    // ==================== FILTERED LIST ====================
    function getFilteredEntries() {
        let list = [...diaryEntries];
        const startVal = filterStart.value;
        const endVal = filterEnd.value;
        const searchVal = searchInput.value.trim().toLowerCase();

        if (startVal) {
            list = list.filter(e => e.date.slice(0, 10) >= startVal);
        }
        if (endVal) {
            list = list.filter(e => e.date.slice(0, 10) <= endVal);
        }
        if (searchVal) {
            list = list.filter(e =>
                e.title.toLowerCase().includes(searchVal) ||
                e.desc.toLowerCase().includes(searchVal)
            );
        }

        // Sort newest first
        list.sort((a, b) => b.date.localeCompare(a.date));
        return list;
    }

    // ==================== RENDER ====================
    function render() {
        const filtered = getFilteredEntries();
        diaryBody.innerHTML = '';

        if (filtered.length === 0) {
            diaryEmpty.style.display = 'block';
        } else {
            diaryEmpty.style.display = 'none';
        }

        filtered.forEach(entry => {
            const tr = document.createElement('tr');
            if (selectedIds.has(entry.id)) tr.classList.add('selected');

            tr.innerHTML = `
                <td><input type="checkbox" class="diary-row-chk" data-id="${entry.id}" ${selectedIds.has(entry.id) ? 'checked' : ''}></td>
                <td>${formatDate(entry.date)}</td>
                <td style="font-weight:600;">${escapeHTML(entry.title)}</td>
                <td class="diary-desc-cell" title="${escapeHTML(entry.desc)}">${escapeHTML(entry.desc)}</td>
                <td>
                    <div class="diary-row-actions">
                        <button title="Edit" class="diary-edit-btn" data-id="${entry.id}">✏️</button>
                        <button title="Delete" class="diary-del-btn" data-id="${entry.id}">🗑️</button>
                    </div>
                </td>
            `;
            diaryBody.appendChild(tr);
        });

        // Wire checkboxes
        document.querySelectorAll('.diary-row-chk').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateSelectionUI();
                // highlight row
                e.target.closest('tr').classList.toggle('selected', e.target.checked);
            });
        });

        // Wire edit/delete
        document.querySelectorAll('.diary-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        document.querySelectorAll('.diary-del-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteDiary(btn.dataset.id));
        });

        updateStats();
        updateSelectionUI();
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // ==================== SELECTION UI ====================
    function updateSelectionUI() {
        const count = selectedIds.size;
        btnDownloadSelected.disabled = count === 0;

        if (count > 0) {
            selectedCountBadge.style.display = 'inline-flex';
            selectedCountBadge.textContent = `${count} selected`;
        } else {
            selectedCountBadge.style.display = 'none';
        }

        // Select all checkbox state
        const filtered = getFilteredEntries();
        if (filtered.length > 0 && filtered.every(e => selectedIds.has(e.id))) {
            selectAllChk.checked = true;
            selectAllChk.indeterminate = false;
        } else if (filtered.some(e => selectedIds.has(e.id))) {
            selectAllChk.checked = false;
            selectAllChk.indeterminate = true;
        } else {
            selectAllChk.checked = false;
            selectAllChk.indeterminate = false;
        }
    }

    selectAllChk.addEventListener('change', () => {
        const filtered = getFilteredEntries();
        if (selectAllChk.checked) {
            filtered.forEach(e => selectedIds.add(e.id));
        } else {
            filtered.forEach(e => selectedIds.delete(e.id));
        }
        render();
    });

    // ==================== ADD / EDIT MODAL ====================
    function buildFormHTML(entry = null) {
        const isEdit = !!entry;
        const dateVal = isEdit ? entry.date : getNowDatetimeLocal();
        const titleVal = isEdit ? entry.title : '';
        const descVal = isEdit ? entry.desc : '';

        return `
            <div class="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" id="diary-modal-date" class="input-text" value="${dateVal}">
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="diary-modal-title" class="input-text" value="${escapeHTML(titleVal)}" placeholder="What's on your mind?">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="diary-modal-desc" class="input-textarea" rows="5" placeholder="Write your thoughts...">${escapeHTML(descVal)}</textarea>
            </div>
            <button class="btn btn-primary" id="diary-modal-save" style="width:100%; margin-top:8px;">
                ${isEdit ? '💾 Save Changes' : '✨ Add Entry'}
            </button>
        `;
    }

    function openAddModal() {
        openModal('📓 New Diary Entry', buildFormHTML());
        document.getElementById('diary-modal-save').addEventListener('click', () => {
            const date = document.getElementById('diary-modal-date').value;
            const title = document.getElementById('diary-modal-title').value.trim();
            const desc = document.getElementById('diary-modal-desc').value.trim();

            if (!title) {
                alert('Please enter a title.');
                return;
            }

            const entry = {
                id: generateId(),
                date: date || getNowDatetimeLocal(),
                title,
                desc
            };

            diaryEntries.push(entry);
            persist();
            closeModal();
            render();
            showToast('✨ Diary entry added!');
        });
    }

    function openEditModal(id) {
        const entry = diaryEntries.find(e => e.id === id);
        if (!entry) return;

        openModal('✏️ Edit Diary Entry', buildFormHTML(entry));
        document.getElementById('diary-modal-save').addEventListener('click', () => {
            const date = document.getElementById('diary-modal-date').value;
            const title = document.getElementById('diary-modal-title').value.trim();
            const desc = document.getElementById('diary-modal-desc').value.trim();

            if (!title) {
                alert('Please enter a title.');
                return;
            }

            entry.date = date || entry.date;
            entry.title = title;
            entry.desc = desc;

            persist();
            closeModal();
            render();
            showToast('💾 Entry updated!');
        });
    }

    // ==================== DELETE ====================
    function deleteDiary(id) {
        if (!confirm('Delete this diary entry?')) return;
        diaryEntries = diaryEntries.filter(e => e.id !== id);
        selectedIds.delete(id);
        persist();
        render();
        showToast('🗑️ Entry deleted');
    }

    // ==================== EXCEL DOWNLOAD ====================
    function downloadExcel(entries, filename) {
        if (!entries.length) {
            alert('No entries to download.');
            return;
        }

        const rows = entries
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e, idx) => ({
                'No': idx + 1,
                'Date': formatDateExcel(e.date),
                'Title': e.title,
                'Description': e.desc
            }));

        const ws = XLSX.utils.json_to_sheet(rows);

        // Column widths
        ws['!cols'] = [
            { wch: 5 },   // No
            { wch: 20 },  // Date
            { wch: 30 },  // Title
            { wch: 60 }   // Description
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Diary');
        XLSX.writeFile(wb, filename);
        showToast('📥 Excel downloaded!');
    }

    function formatDateExcel(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const yr = d.getFullYear();
        const hr = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${mon}/${yr} ${hr}:${min}`;
    }

    btnDownloadAll.addEventListener('click', () => {
        const filtered = getFilteredEntries();
        const label = (filterStart.value || filterEnd.value || searchInput.value.trim())
            ? 'filtered' : 'all';
        downloadExcel(filtered, `bella_diary_${label}_${getNowISO()}.xlsx`);
    });

    btnDownloadSelected.addEventListener('click', () => {
        const selected = diaryEntries.filter(e => selectedIds.has(e.id));
        downloadExcel(selected, `bella_diary_selected_${getNowISO()}.xlsx`);
    });

    // ==================== FILTER EVENTS ====================
    filterStart.addEventListener('change', render);
    filterEnd.addEventListener('change', render);
    searchInput.addEventListener('input', debounce(() => render(), 250));

    btnResetFilters.addEventListener('click', () => {
        filterStart.value = '';
        filterEnd.value = '';
        searchInput.value = '';
        selectedIds.clear();
        render();
    });

    // ==================== WIRE UP ====================
    btnAdd.addEventListener('click', openAddModal);

    // ==================== INIT ====================
    render();

})();
