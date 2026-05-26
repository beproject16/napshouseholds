/* ========================================
   KIDS DEVELOPMENT MODULE
   Child profile, growth tracker, milestone checklist
   ======================================== */

// ==================== STATE ====================
let childProfile = loadData('child_profile', { name: '', dob: '' });
let growthLog = loadData('growth_log', []);
let milestoneStatus = loadData('milestone_status', {});

// ==================== MILESTONE DATABASE ====================
// Organized by age range (in months), category, and expected milestones
const MILESTONES = [
    // 0-6 months
    { id: 'm001', ageMin: 0, ageMax: 6, category: 'motor', name: 'Holds head up when on tummy', desc: 'Can lift and hold head steady when placed on stomach' },
    { id: 'm002', ageMin: 0, ageMax: 6, category: 'motor', name: 'Rolls over (front to back)', desc: 'Can flip from tummy to back' },
    { id: 'm003', ageMin: 0, ageMax: 6, category: 'motor', name: 'Reaches for and grabs objects', desc: 'Intentionally reaches and grabs toys' },
    { id: 'm004', ageMin: 0, ageMax: 6, category: 'cognitive', name: 'Follows moving objects with eyes', desc: 'Tracks objects visually' },
    { id: 'm005', ageMin: 0, ageMax: 6, category: 'social', name: 'Smiles at people', desc: 'Social smile in response to faces' },
    { id: 'm006', ageMin: 0, ageMax: 6, category: 'language', name: 'Coos and babbles', desc: 'Makes vowel sounds like "ooh" and "aah"' },

    // 6-12 months
    { id: 'm007', ageMin: 6, ageMax: 12, category: 'motor', name: 'Sits without support', desc: 'Can sit steadily on their own' },
    { id: 'm008', ageMin: 6, ageMax: 12, category: 'motor', name: 'Crawls', desc: 'Moves on hands and knees' },
    { id: 'm009', ageMin: 6, ageMax: 12, category: 'motor', name: 'Pulls to stand', desc: 'Can pull up to standing using furniture' },
    { id: 'm010', ageMin: 6, ageMax: 12, category: 'motor', name: 'Picks up small objects (pincer grasp)', desc: 'Uses thumb and forefinger to pick things up' },
    { id: 'm011', ageMin: 6, ageMax: 12, category: 'cognitive', name: 'Looks for hidden objects', desc: 'Searches for a toy hidden under a cloth' },
    { id: 'm012', ageMin: 6, ageMax: 12, category: 'cognitive', name: 'Bangs two objects together', desc: 'Explores by banging toys' },
    { id: 'm013', ageMin: 6, ageMax: 12, category: 'social', name: 'Shows stranger anxiety', desc: 'May cry or cling with unfamiliar people' },
    { id: 'm014', ageMin: 6, ageMax: 12, category: 'social', name: 'Plays peek-a-boo', desc: 'Enjoys peek-a-boo games' },
    { id: 'm015', ageMin: 6, ageMax: 12, category: 'language', name: 'Says "mama" or "dada"', desc: 'Uses first recognizable words' },
    { id: 'm016', ageMin: 6, ageMax: 12, category: 'language', name: 'Responds to own name', desc: 'Turns head when you say their name' },

    // 12-18 months
    { id: 'm017', ageMin: 12, ageMax: 18, category: 'motor', name: 'Walks independently', desc: 'Takes steps without holding on' },
    { id: 'm018', ageMin: 12, ageMax: 18, category: 'motor', name: 'Stacks 2-3 blocks', desc: 'Can stack blocks on top of each other' },
    { id: 'm019', ageMin: 12, ageMax: 18, category: 'motor', name: 'Scribbles with crayon', desc: 'Makes marks on paper with a crayon' },
    { id: 'm020', ageMin: 12, ageMax: 18, category: 'cognitive', name: 'Points to things they want', desc: 'Uses pointing to communicate' },
    { id: 'm021', ageMin: 12, ageMax: 18, category: 'cognitive', name: 'Follows simple instructions', desc: 'Understands "give me" or "come here"' },
    { id: 'm022', ageMin: 12, ageMax: 18, category: 'social', name: 'Imitates actions (clapping, waving)', desc: 'Copies what adults do' },
    { id: 'm023', ageMin: 12, ageMax: 18, category: 'social', name: 'Shows affection to familiar people', desc: 'Hugs, kisses familiar caregivers' },
    { id: 'm024', ageMin: 12, ageMax: 18, category: 'language', name: 'Says 3-5 words besides "mama/dada"', desc: 'Vocabulary of a few meaningful words' },

    // 18-24 months
    { id: 'm025', ageMin: 18, ageMax: 24, category: 'motor', name: 'Runs (may be unsteady)', desc: 'Attempts to run, faster than walking' },
    { id: 'm026', ageMin: 18, ageMax: 24, category: 'motor', name: 'Kicks a ball', desc: 'Can kick a ball forward' },
    { id: 'm027', ageMin: 18, ageMax: 24, category: 'motor', name: 'Walks up stairs with help', desc: 'Climbs stairs holding a hand or rail' },
    { id: 'm028', ageMin: 18, ageMax: 24, category: 'motor', name: 'Uses a spoon (messy)', desc: 'Attempts to feed self with spoon' },
    { id: 'm029', ageMin: 18, ageMax: 24, category: 'cognitive', name: 'Points to body parts when asked', desc: 'Can identify nose, eyes, etc. when asked' },
    { id: 'm030', ageMin: 18, ageMax: 24, category: 'cognitive', name: 'Sorts shapes or colors', desc: 'Beginning to match similar items' },
    { id: 'm031', ageMin: 18, ageMax: 24, category: 'social', name: 'Plays alongside other children', desc: 'Parallel play — plays near but not with others' },
    { id: 'm032', ageMin: 18, ageMax: 24, category: 'social', name: 'Shows defiance ("no!")', desc: 'Expresses independence by refusing' },
    { id: 'm033', ageMin: 18, ageMax: 24, category: 'language', name: 'Says 50+ words', desc: 'Vocabulary explosion happening' },
    { id: 'm034', ageMin: 18, ageMax: 24, category: 'language', name: 'Combines 2 words ("more milk")', desc: 'Starting to form short phrases' },

    // 24-36 months (CURRENT AGE RANGE for 27 months)
    { id: 'm035', ageMin: 24, ageMax: 36, category: 'motor', name: 'Jumps with both feet off the ground', desc: 'Can do a small jump up' },
    { id: 'm036', ageMin: 24, ageMax: 36, category: 'motor', name: 'Walks up stairs alternating feet', desc: 'Goes up stairs one foot per step' },
    { id: 'm037', ageMin: 24, ageMax: 36, category: 'motor', name: 'Throws ball overhand', desc: 'Can throw a ball in an overhand motion' },
    { id: 'm038', ageMin: 24, ageMax: 36, category: 'motor', name: 'Turns book pages one at a time', desc: 'Has fine motor control for thin pages' },
    { id: 'm039', ageMin: 24, ageMax: 36, category: 'motor', name: 'Draws circles and lines', desc: 'Can make intentional shapes with crayon' },
    { id: 'm040', ageMin: 24, ageMax: 36, category: 'motor', name: 'Stacks 6+ blocks', desc: 'Can stack a tower of blocks' },
    { id: 'm041', ageMin: 24, ageMax: 36, category: 'cognitive', name: 'Completes simple puzzles (3-4 pieces)', desc: 'Can fit puzzle pieces together' },
    { id: 'm042', ageMin: 24, ageMax: 36, category: 'cognitive', name: 'Understands "big" vs "small"', desc: 'Recognizes size differences' },
    { id: 'm043', ageMin: 24, ageMax: 36, category: 'cognitive', name: 'Knows some colors', desc: 'Can name or point to basic colors' },
    { id: 'm044', ageMin: 24, ageMax: 36, category: 'cognitive', name: 'Counts to 3 or more', desc: 'Beginning to count objects' },
    { id: 'm045', ageMin: 24, ageMax: 36, category: 'cognitive', name: 'Engages in pretend play', desc: 'Plays "cooking", "doctor", uses imagination' },
    { id: 'm046', ageMin: 24, ageMax: 36, category: 'social', name: 'Takes turns (with help)', desc: 'Beginning to understand sharing' },
    { id: 'm047', ageMin: 24, ageMax: 36, category: 'social', name: 'Shows concern when someone is crying', desc: 'Developing empathy' },
    { id: 'm048', ageMin: 24, ageMax: 36, category: 'social', name: 'Shows wide range of emotions', desc: 'Happy, sad, angry, frustrated expressions' },
    { id: 'm049', ageMin: 24, ageMax: 36, category: 'language', name: 'Says 2-3 word sentences', desc: '"I want juice", "Mommy go"' },
    { id: 'm050', ageMin: 24, ageMax: 36, category: 'language', name: 'Names familiar objects', desc: 'Can name common things around them' },
    { id: 'm051', ageMin: 24, ageMax: 36, category: 'language', name: 'Uses "I", "me", "you"', desc: 'Starting to use pronouns' },
    { id: 'm052', ageMin: 24, ageMax: 36, category: 'language', name: 'Strangers can understand most words', desc: 'Speech is becoming clearer' },

    // 36-48 months
    { id: 'm053', ageMin: 36, ageMax: 48, category: 'motor', name: 'Pedals a tricycle', desc: 'Can ride a tricycle with pedaling' },
    { id: 'm054', ageMin: 36, ageMax: 48, category: 'motor', name: 'Catches a bounced ball', desc: 'Can catch a ball that bounces' },
    { id: 'm055', ageMin: 36, ageMax: 48, category: 'motor', name: 'Uses scissors to cut', desc: 'Starting to use safety scissors' },
    { id: 'm056', ageMin: 36, ageMax: 48, category: 'motor', name: 'Draws a person (head + 1-2 body parts)', desc: 'Simple person drawing' },
    { id: 'm057', ageMin: 36, ageMax: 48, category: 'cognitive', name: 'Understands "same" and "different"', desc: 'Can compare objects' },
    { id: 'm058', ageMin: 36, ageMax: 48, category: 'cognitive', name: 'Counts to 10', desc: 'Can count up to 10' },
    { id: 'm059', ageMin: 36, ageMax: 48, category: 'cognitive', name: 'Remembers parts of a story', desc: 'Can retell parts of stories read to them' },
    { id: 'm060', ageMin: 36, ageMax: 48, category: 'social', name: 'Plays cooperatively with others', desc: 'True interactive play with peers' },
    { id: 'm061', ageMin: 36, ageMax: 48, category: 'social', name: 'Can dress and undress self', desc: 'Puts on simple clothes independently' },
    { id: 'm062', ageMin: 36, ageMax: 48, category: 'language', name: 'Speaks in 4-5 word sentences', desc: 'Forming longer, more complex sentences' },
    { id: 'm063', ageMin: 36, ageMax: 48, category: 'language', name: 'Tells stories', desc: 'Can narrate events or make up stories' },
    { id: 'm064', ageMin: 36, ageMax: 48, category: 'language', name: 'Knows first and last name', desc: 'Can tell you their full name' },

    // 48-60 months
    { id: 'm065', ageMin: 48, ageMax: 60, category: 'motor', name: 'Hops on one foot', desc: 'Can balance and hop on one foot' },
    { id: 'm066', ageMin: 48, ageMax: 60, category: 'motor', name: 'Writes some letters', desc: 'Can write a few letters of their name' },
    { id: 'm067', ageMin: 48, ageMax: 60, category: 'cognitive', name: 'Counts to 20', desc: 'Counts confidently to 20' },
    { id: 'm068', ageMin: 48, ageMax: 60, category: 'cognitive', name: 'Understands time concepts (yesterday/tomorrow)', desc: 'Beginning to understand time' },
    { id: 'm069', ageMin: 48, ageMax: 60, category: 'social', name: 'Has a best friend', desc: 'Shows preference for specific playmates' },
    { id: 'm070', ageMin: 48, ageMax: 60, category: 'language', name: 'Uses future tense', desc: '"I will go" or "We\'re going to"' },

    // 60-72 months
    { id: 'm071', ageMin: 60, ageMax: 72, category: 'motor', name: 'Rides bicycle with training wheels', desc: 'Can ride a bike with support wheels' },
    { id: 'm072', ageMin: 60, ageMax: 72, category: 'motor', name: 'Ties shoelaces (beginner)', desc: 'Starting to learn to tie shoes' },
    { id: 'm073', ageMin: 60, ageMax: 72, category: 'cognitive', name: 'Reads simple words', desc: 'Beginning sight reading' },
    { id: 'm074', ageMin: 60, ageMax: 72, category: 'cognitive', name: 'Simple addition/subtraction', desc: 'Can do basic math with small numbers' },
    { id: 'm075', ageMin: 60, ageMax: 72, category: 'social', name: 'Follows rules of a game', desc: 'Understands and follows game rules' },
    { id: 'm076', ageMin: 60, ageMax: 72, category: 'language', name: 'Speaks in complex sentences', desc: 'Uses "because", "if", "when"' }
];

const CATEGORY_ICONS = {
    motor: '🏃',
    cognitive: '🧠',
    social: '🤝',
    language: '💬'
};


// ==================== RENDER CHILD PROFILE ====================
function renderChildProfile() {
    const nameEl = document.getElementById('child-name');
    const dobEl = document.getElementById('child-dob');
    const ageEl = document.getElementById('child-age');

    if (childProfile.name) {
        nameEl.textContent = childProfile.name;
        dobEl.textContent = formatDate(childProfile.dob);
        ageEl.textContent = getAgeString(childProfile.dob);
    } else {
        nameEl.textContent = 'Not set';
        dobEl.textContent = 'Not set';
        ageEl.textContent = '—';
    }
}


// ==================== EDIT CHILD PROFILE ====================
document.getElementById('btn-edit-child').addEventListener('click', () => {
    openModal('Edit Child Profile', `
        <form id="form-child">
            <div class="form-group">
                <label>Child's Name</label>
                <input type="text" class="input-text" id="child-name-input" value="${childProfile.name || ''}" placeholder="e.g., Arya" required>
            </div>
            <div class="form-group">
                <label>Date of Birth</label>
                <input type="date" class="input-text" id="child-dob-input" value="${childProfile.dob || ''}" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Save Profile</button>
        </form>
    `);

    document.getElementById('form-child').addEventListener('submit', (e) => {
        e.preventDefault();
        childProfile.name = document.getElementById('child-name-input').value.trim();
        childProfile.dob = document.getElementById('child-dob-input').value;
        saveData('child_profile', childProfile);
        renderDevelopment();
        closeModal();
    });
});


// ==================== GROWTH TRACKER ====================
let chartGrowth = null;

document.getElementById('btn-add-growth').addEventListener('click', () => {
    openModal('Log Growth Measurement', `
        <form id="form-growth">
            <div class="form-group">
                <label>Date</label>
                <input type="date" class="input-text" id="growth-date" value="${new Date().toISOString().slice(0, 10)}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" class="input-text" id="growth-weight" step="0.1" min="0" placeholder="12.5" required>
                </div>
                <div class="form-group">
                    <label>Height (cm)</label>
                    <input type="number" class="input-text" id="growth-height" step="0.1" min="0" placeholder="87" required>
                </div>
            </div>
            <div class="form-group">
                <label>Head Circumference (cm) — optional</label>
                <input type="number" class="input-text" id="growth-head" step="0.1" min="0" placeholder="48">
            </div>
            <div class="form-group">
                <label>Notes (optional)</label>
                <input type="text" class="input-text" id="growth-notes" placeholder="e.g., After vaccination checkup">
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Save Measurement</button>
        </form>
    `);

    document.getElementById('form-growth').addEventListener('submit', (e) => {
        e.preventDefault();
        growthLog.push({
            id: generateId(),
            date: document.getElementById('growth-date').value,
            weight: parseFloat(document.getElementById('growth-weight').value),
            height: parseFloat(document.getElementById('growth-height').value),
            head: parseFloat(document.getElementById('growth-head').value) || null,
            notes: document.getElementById('growth-notes').value.trim()
        });
        growthLog.sort((a, b) => a.date.localeCompare(b.date));
        saveData('growth_log', growthLog);
        renderGrowthChart();
        renderGrowthLog();
        closeModal();
    });
});

function renderGrowthChart() {
    const canvas = document.getElementById('chart-growth');
    if (!canvas) return;

    if (growthLog.length === 0) {
        if (chartGrowth) chartGrowth.destroy();
        return;
    }

    const labels = growthLog.map(g => formatDate(g.date));
    const weightData = growthLog.map(g => g.weight);
    const heightData = growthLog.map(g => g.height);

    if (chartGrowth) chartGrowth.destroy();

    chartGrowth = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: weightData,
                    borderColor: '#bb86fc',
                    backgroundColor: 'rgba(187, 134, 252, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1',
                    pointRadius: 5,
                    pointBackgroundColor: '#bb86fc'
                },
                {
                    label: 'Height (cm)',
                    data: heightData,
                    borderColor: '#03dac6',
                    backgroundColor: 'rgba(3, 218, 198, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y2',
                    pointRadius: 5,
                    pointBackgroundColor: '#03dac6'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y1: {
                    position: 'left',
                    title: { display: true, text: 'Weight (kg)', color: '#7c4dff', font: { size: 11 } },
                    ticks: { color: '#5a5a75', font: { size: 10 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y2: {
                    position: 'right',
                    title: { display: true, text: 'Height (cm)', color: '#00bfa5', font: { size: 11 } },
                    ticks: { color: '#5a5a75', font: { size: 10 } },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { color: '#5a5a75', font: { size: 10 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#5a5a75', font: { family: "'Inter', sans-serif" } } }
            }

        }
    });
}

function renderGrowthLog() {
    const container = document.getElementById('growth-log-list');
    if (growthLog.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding:12px 0;">No growth entries yet. Click "+ Log Growth" to add.</p>';
        return;
    }

    container.innerHTML = [...growthLog].reverse().map(g => `
        <div class="growth-log-item">
            <span>${formatDate(g.date)}</span>
            <span>⚖️ ${g.weight} kg</span>
            <span>📏 ${g.height} cm</span>
            ${g.head ? `<span>🧠 ${g.head} cm</span>` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteGrowthEntry('${g.id}')" style="padding:3px 8px;">×</button>
        </div>
    `).join('');
}

function deleteGrowthEntry(id) {
    growthLog = growthLog.filter(g => g.id !== id);
    saveData('growth_log', growthLog);
    renderGrowthChart();
    renderGrowthLog();
}


// ==================== MILESTONES ====================
function renderMilestones(filter = 'all') {
    const ageInMonths = childProfile.dob ? getAgeInMonths(childProfile.dob) : 27;

    // Get milestones up to and including current age range
    let relevant = MILESTONES.filter(m => m.ageMax <= (ageInMonths + 12));
    if (filter !== 'all') relevant = relevant.filter(m => m.category === filter);

    const list = document.getElementById('milestone-list');

    list.innerHTML = relevant.map(m => {
        const status = milestoneStatus[m.id] || 'not_yet';
        let statusIcon = '⬜';
        if (status === 'achieved') statusIcon = '✅';
        else if (status === 'in_progress') statusIcon = '⚠️';
        else if (status === 'not_yet') statusIcon = '⬜';

        const isPastDue = ageInMonths > m.ageMax && status !== 'achieved';
        const isCurrent = ageInMonths >= m.ageMin && ageInMonths <= m.ageMax;

        let areaStyle = '';
        if (isPastDue && status !== 'achieved') areaStyle = 'border-left: 3px solid var(--red); padding-left: 10px;';
        else if (isCurrent) areaStyle = 'border-left: 3px solid var(--accent); padding-left: 10px;';

        return `
            <li class="milestone-item" style="${areaStyle}" data-category="${m.category}">
                <span class="milestone-status" onclick="cycleMilestoneStatus('${m.id}')" title="Click to change status">${statusIcon}</span>
                <div class="milestone-info">
                    <div class="milestone-name">${CATEGORY_ICONS[m.category]} ${m.name}</div>
                    <div class="milestone-meta">${m.desc}</div>
                    <span class="milestone-age-tag">${m.ageMin}–${m.ageMax} months</span>
                    ${isPastDue && status !== 'achieved' ? '<span class="milestone-age-tag" style="background:rgba(239,83,80,0.15);color:var(--red);margin-left:4px;">Needs attention</span>' : ''}
                    ${isCurrent ? '<span class="milestone-age-tag" style="background:rgba(187,134,252,0.15);color:var(--accent);margin-left:4px;">Current stage</span>' : ''}
                </div>
            </li>
        `;
    }).join('');

    // Update progress
    const allForAge = MILESTONES.filter(m => m.ageMax <= ageInMonths + 6);
    const achieved = allForAge.filter(m => milestoneStatus[m.id] === 'achieved').length;
    const total = allForAge.length;
    const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;

    document.getElementById('milestone-progress-fill').style.width = `${pct}%`;
    document.getElementById('milestone-progress-text').textContent = `${achieved} / ${total} achieved`;
}

function cycleMilestoneStatus(id) {
    const current = milestoneStatus[id] || 'not_yet';
    const next = current === 'not_yet' ? 'in_progress' : current === 'in_progress' ? 'achieved' : 'not_yet';
    milestoneStatus[id] = next;
    saveData('milestone_status', milestoneStatus);
    renderMilestones(currentMilestoneFilter);
}

let currentMilestoneFilter = 'all';

// Milestone filter chips
document.querySelectorAll('.milestone-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.milestone-filters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentMilestoneFilter = chip.dataset.filter;
        renderMilestones(currentMilestoneFilter);
    });
});


// ==================== RENDER ALL ====================
function renderDevelopment() {
    renderChildProfile();
    renderGrowthChart();
    renderGrowthLog();
    renderMilestones();
}

renderDevelopment();
