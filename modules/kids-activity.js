/* ========================================
   KIDS ACTIVITY CALENDAR MODULE
   Activity library, calendar, age-matched recommendations
   ======================================== */

// ==================== STATE ====================
let activities = loadData('activities', getDefaultActivities());
let scheduledActivities = loadData('scheduled_activities', {});
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
// Get local date string YYYY-MM-DD
const localToday = new Date();
let selectedDay = localToday.getFullYear() + '-' + String(localToday.getMonth() + 1).padStart(2, '0') + '-' + String(localToday.getDate()).padStart(2, '0');


// ==================== DEFAULT ACTIVITIES (Pre-loaded) ====================
function getDefaultActivities() {
    return [
        {
            id: 'act01', name: 'Finger Painting', category: 'art',
            ageMin: 12, ageMax: 48,
            tools: ['Washable finger paints', 'Large paper or cardboard', 'Apron/old clothes', 'Wet wipes'],
            howToPlay: [
                'Cover the table with paper or use a large sheet on the floor',
                'Let your child dip fingers into the paint',
                'Encourage them to make lines, dots, and shapes',
                'Name the colors as they use them',
                'Let them explore freely — messy is okay!'
            ],
            description: 'Creative art activity to develop fine motor skills and color recognition'
        },
        {
            id: 'act02', name: 'Playdough Shapes', category: 'art',
            ageMin: 18, ageMax: 60,
            tools: ['Playdough (store-bought or homemade)', 'Cookie cutters', 'Plastic rolling pin', 'Plastic knife'],
            howToPlay: [
                'Give your child a ball of playdough',
                'Show how to roll, squish, and flatten it',
                'Use cookie cutters to make shapes',
                'Practice making balls, snakes, and pancakes',
                'Name the shapes and colors together'
            ],
            description: 'Hands-on sculpting to build hand strength and creativity'
        },
        {
            id: 'act03', name: 'Color Sorting', category: 'learning',
            ageMin: 18, ageMax: 36,
            tools: ['Colored blocks, buttons, or pom-poms', 'Small bowls or cups in matching colors', 'Tray'],
            howToPlay: [
                'Place several bowls in different colors on a tray',
                'Mix up the colored items',
                'Ask your child to put each item in the matching bowl',
                'Start with 2-3 colors, add more as they get better',
                'Say the color name each time they sort one'
            ],
            description: 'Sorting activity to learn colors and develop categorization skills'
        },
        {
            id: 'act04', name: 'Obstacle Course', category: 'physical',
            ageMin: 24, ageMax: 60,
            tools: ['Pillows/cushions', 'Chairs', 'Blankets', 'Hula hoop or rope', 'Boxes'],
            howToPlay: [
                'Set up stations: crawl under a chair, jump over a pillow, walk along a rope line',
                'Demonstrate each station first',
                'Guide your child through the course',
                'Cheer them on at each station!',
                'Change the course each time to keep it fun'
            ],
            description: 'Indoor/outdoor course to develop gross motor skills, balance, and coordination'
        },
        {
            id: 'act05', name: 'Water Play & Pouring', category: 'sensory',
            ageMin: 12, ageMax: 36,
            tools: ['Large container or basin', 'Small cups and bowls', 'Funnel', 'Sponge', 'Towel', 'Waterproof mat'],
            howToPlay: [
                'Fill a large container with shallow water',
                'Give cups, bowls, and a funnel',
                'Show how to pour from one cup to another',
                'Let them squeeze sponges',
                'Add food coloring for extra fun (optional)'
            ],
            description: 'Sensory play to develop fine motor skills and understand volume concepts'
        },
        {
            id: 'act06', name: 'Story Time with Puppets', category: 'learning',
            ageMin: 18, ageMax: 48,
            tools: ['Sock puppets or stuffed animals', 'Simple picture book', 'Your imagination!'],
            howToPlay: [
                'Choose a simple story or make one up',
                'Use puppets or stuffed animals as characters',
                'Make different voices for each character',
                'Ask your child to participate — "what does the dog say?"',
                'Let your child try using the puppets too'
            ],
            description: 'Interactive storytelling to develop language, imagination, and listening skills'
        },
        {
            id: 'act07', name: 'Ball Kicking & Throwing', category: 'physical',
            ageMin: 18, ageMax: 60,
            tools: ['Soft ball (medium size)', 'Open space (indoor or outdoor)', 'Target (bucket or box)'],
            howToPlay: [
                'Start with rolling the ball back and forth',
                'Practice kicking the ball while standing',
                'Try gentle underhand throwing toward a target',
                'Let them chase and retrieve the ball',
                'Increase distance gradually'
            ],
            description: 'Ball play to develop gross motor skills, coordination, and spatial awareness'
        },
        {
            id: 'act08', name: 'Sticker Art', category: 'art',
            ageMin: 18, ageMax: 40,
            tools: ['Sticker sheets (large stickers for younger kids)', 'White paper', 'Crayons (optional)'],
            howToPlay: [
                'Draw simple outlines on paper (circle, face, tree)',
                'Let your child peel and place stickers inside the shapes',
                'Younger kids: help peel the stickers',
                'Older kids: let them create freely',
                'Great for developing pincer grasp!'
            ],
            description: 'Fine motor art activity to practice peeling and precision placement'
        },
        {
            id: 'act09', name: 'Dancing & Freeze', category: 'music',
            ageMin: 12, ageMax: 60,
            tools: ['Music player/phone', 'Fun music playlist', 'Open space'],
            howToPlay: [
                'Play upbeat music and dance together',
                'When you pause the music, everyone freezes!',
                'If someone moves during freeze — silly consequence!',
                'Try different dance moves: jumping, spinning, clapping',
                'Let your child pick favorite songs'
            ],
            description: 'Music and movement game to develop rhythm, balance, and body awareness'
        },
        {
            id: 'act10', name: 'Rice/Pasta Sensory Bin', category: 'sensory',
            ageMin: 12, ageMax: 36,
            tools: ['Large container', 'Uncooked rice or pasta', 'Small toys/figures', 'Scoops and cups', 'Towel for underneath'],
            howToPlay: [
                'Fill a container with rice or dried pasta',
                'Hide small toys inside for treasure hunting',
                'Let them scoop, pour, and dig',
                'Practice finding and naming hidden items',
                'Supervise closely — not for children who still mouth objects!'
            ],
            description: 'Tactile sensory exploration to develop fine motor skills and discovery'
        },
        {
            id: 'act11', name: 'Simple Puzzles', category: 'learning',
            ageMin: 18, ageMax: 48,
            tools: ['Age-appropriate puzzles (knob puzzles for younger, jigsaw for older)', 'Flat surface'],
            howToPlay: [
                'Start with puzzles with large, easy-grip pieces',
                'Show where one piece goes, then let them try',
                'Use encouraging words: "You got it! Try turning it..."',
                'Name the pictures as pieces are placed',
                'Gradually increase difficulty as they improve'
            ],
            description: 'Problem-solving activity to develop cognitive skills and spatial reasoning'
        },
        {
            id: 'act12', name: 'Building Block Towers', category: 'learning',
            ageMin: 12, ageMax: 48,
            tools: ['Wooden or plastic blocks', 'Flat surface'],
            howToPlay: [
                'Start by stacking a few blocks as a tower',
                'Let your child try to build their own tower',
                'Count the blocks together as you stack them',
                'Let them knock it down (this is half the fun!)',
                'Try building bridges, walls, or houses'
            ],
            description: 'Construction play to develop fine motor skills, spatial reasoning, and counting'
        },
        {
            id: 'act13', name: 'Rice/Pasta Sensory Bin', category: 'sensory',
            ageMin: 12, ageMax: 36,
            tools: ['Large container', 'Uncooked rice or pasta', 'Small toys/figures', 'Scoops and cups', 'Towel for underneath'],
            howToPlay: [
                'Fill a container with rice or dried pasta',
                'Hide small toys inside for treasure hunting',
                'Let them scoop, pour, and dig',
                'Practice finding and naming hidden items',
                'Supervise closely — not for children who still mouth objects!'
            ],
            description: 'Tactile sensory exploration to develop fine motor skills and discovery'
        }
    ];
}


// ==================== RENDER CALENDAR ====================
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('cal-month-label');

    label.textContent = `${getMonthName(calMonth)} ${calYear}`;

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayHeaders.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // First day of month
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="cal-day other-month"><span class="cal-day-number">${day}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isSelected = selectedDay === dateStr;
        const dayScheduled = scheduledActivities[dateStr] || [];

        let classes = 'cal-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (dayScheduled.length > 0) classes += ' has-activities';

        const labels = dayScheduled.map(actId => {
            const act = activities.find(a => a.id === actId);
            return act ? `<div class="cal-act-label" title="${act.name}">${act.name}</div>` : '';
        }).join('');

        html += `
            <div class="${classes}" onclick="selectCalDay('${dateStr}')">
                <span class="cal-day-number">${d}</span>
                <div class="cal-day-activities">${labels}</div>
            </div>
        `;
    }

    // Next month days (fill remaining cells)
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="cal-day other-month"><span class="cal-day-number">${i}</span></div>`;
    }

    grid.innerHTML = html;
}


// ==================== CALENDAR NAVIGATION ====================
document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
});


// ==================== SELECT DAY ====================
function selectCalDay(dateStr) {
    selectedDay = dateStr;
    renderCalendar();
    renderDayRecommendations(dateStr);
}

function renderDayRecommendations(dateStr) {
    const container = document.getElementById('activity-recommendations');
    const label = document.getElementById('activity-day-label');

    // Parse date for label
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    label.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Get child's age
    const ageInMonths = childProfile.dob ? getAgeInMonths(childProfile.dob) : 27;

    // Get scheduled activities for this day
    const scheduled = scheduledActivities[dateStr] || [];

    let html = '';

    // Show scheduled activities
    if (scheduled.length > 0) {
        html += '<h4 style="margin-bottom:10px; color:var(--teal);">📌 Scheduled for this day</h4>';
        scheduled.forEach(actId => {
            const act = activities.find(a => a.id === actId);
            if (act) html += activityCardHTML(act, true, dateStr);
        });
    } else {
        html += `
            <div class="empty-state" style="padding:20px 0;">
                <p>No activities scheduled yet.</p>
                <p style="font-size:0.8rem; margin-top:6px;">Select from the library below to plan your day!</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

function activityCardHTML(act, isScheduled, dateStr) {
    const catClass = {
        art: 'act-cat-art',
        music: 'act-cat-music',
        physical: 'act-cat-physical',
        learning: 'act-cat-learning',
        sensory: 'act-cat-sensory'
    }[act.category] || 'act-cat-learning';

    const catLabel = act.category.charAt(0).toUpperCase() + act.category.slice(1);

    return `
        <div class="activity-card" onclick="toggleActivityDetail('${act.id}')" style="cursor:pointer;">
            <div class="activity-card-header">
                <span class="activity-card-title">${act.name}</span>
                <span class="activity-card-age">${act.ageMin}–${act.ageMax} mo</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="activity-card-category ${catClass}">${catLabel}</span>
                ${isScheduled ? `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); unscheduleActivity('${act.id}', '${dateStr}')" style="padding:4px 8px; font-size:0.75rem;">Remove</button>` : ''}
            </div>
            <div class="activity-detail-section" id="detail-${act.id}" style="display:none; margin-top:12px;">
                <div class="activity-detail-expanded">
                    <p class="text-muted" style="margin-bottom:12px;">${act.description}</p>
                    <h4>🔧 Tools</h4>
                    <div class="activity-tools-list" style="margin-bottom:12px;">
                        ${act.tools.map(t => `<span class="tool-tag">${t}</span>`).join('')}
                    </div>
                    <h4>🎮 How to Play</h4>
                    <ol class="activity-how-to">
                        ${act.howToPlay.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
        </div>
    `;
}

function toggleActivityDetail(actId) {
    const detail = document.getElementById(`detail-${actId}`);
    if (detail) {
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
    }
}


// ==================== SCHEDULE / UNSCHEDULE ====================
function scheduleActivity(actId, dateStr) {
    if (!dateStr) return;
    if (!scheduledActivities[dateStr]) scheduledActivities[dateStr] = [];
    if (!scheduledActivities[dateStr].includes(actId)) {
        scheduledActivities[dateStr].push(actId);
        saveData('scheduled_activities', scheduledActivities);
        renderCalendar();
        renderDayRecommendations(dateStr);
    }
}

function unscheduleActivity(actId, dateStr) {
    if (!dateStr || !scheduledActivities[dateStr]) return;
    scheduledActivities[dateStr] = scheduledActivities[dateStr].filter(id => id !== actId);
    saveData('scheduled_activities', scheduledActivities);
    renderCalendar();
    renderDayRecommendations(dateStr);
}


// ==================== ADD CUSTOM ACTIVITY ====================
document.getElementById('btn-add-activity').addEventListener('click', () => {
    openModal('Add New Activity', `
        <form id="form-activity">
            <div class="form-group">
                <label>Activity Name</label>
                <input type="text" class="input-text" id="act-name" placeholder="e.g., Painting with Sponges" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select class="input-select" id="act-category">
                    <option value="art">🎨 Art</option>
                    <option value="music">🎵 Music</option>
                    <option value="physical">🏃 Physical</option>
                    <option value="learning">📚 Learning</option>
                    <option value="sensory">✋ Sensory</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Min Age (months)</label>
                    <input type="number" class="input-text" id="act-age-min" value="12" min="0">
                </div>
                <div class="form-group">
                    <label>Max Age (months)</label>
                    <input type="number" class="input-text" id="act-age-max" value="48" min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="input-textarea" id="act-description" placeholder="Brief description of the activity..."></textarea>
            </div>
            <div class="form-group">
                <label>Tools & Materials (one per line)</label>
                <textarea class="input-textarea" id="act-tools" placeholder="Watercolor paint\\nBrushes\\nPaper"></textarea>
            </div>
            <div class="form-group">
                <label>How to Play — Steps (one per line)</label>
                <textarea class="input-textarea" id="act-howto" placeholder="Step 1...\\nStep 2...\\nStep 3..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Add Activity</button>
        </form>
    `);

    document.getElementById('form-activity').addEventListener('submit', (e) => {
        e.preventDefault();
        const newAct = {
            id: generateId(),
            name: document.getElementById('act-name').value.trim(),
            category: document.getElementById('act-category').value,
            ageMin: parseInt(document.getElementById('act-age-min').value) || 0,
            ageMax: parseInt(document.getElementById('act-age-max').value) || 72,
            description: document.getElementById('act-description').value.trim(),
            tools: document.getElementById('act-tools').value.trim().split('\n').filter(l => l.trim()),
            howToPlay: document.getElementById('act-howto').value.trim().split('\n').filter(l => l.trim())
        };

        activities.push(newAct);
        saveData('activities', activities);
        renderActivityLibrary();
        closeModal();
    });
});


// ==================== ACTIVITY LIBRARY ====================
function renderActivityLibrary() {
    const container = document.getElementById('activity-library-list');
    const countEl = document.getElementById('activity-lib-count');
    const searchTerm = (document.getElementById('activity-search').value || '').toLowerCase();

    const ageInMonths = childProfile.dob ? getAgeInMonths(childProfile.dob) : 27;

    let filtered = activities;
    if (searchTerm) filtered = activities.filter(a => a.name.toLowerCase().includes(searchTerm));

    countEl.textContent = `${filtered.length} activities`;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="empty-icon">📚</span><p>No activities found.</p></div>';
        return;
    }

    container.innerHTML = filtered.map(act => {
        const isAgeMatch = ageInMonths >= act.ageMin && ageInMonths <= act.ageMax;
        const catClass = {
            art: 'act-cat-art',
            music: 'act-cat-music',
            physical: 'act-cat-physical',
            learning: 'act-cat-learning',
            sensory: 'act-cat-sensory'
        }[act.category] || 'act-cat-learning';

        const isScheduled = selectedDay && scheduledActivities[selectedDay] && scheduledActivities[selectedDay].includes(act.id);

        return `
            <div class="activity-card" style="${isAgeMatch ? '' : 'opacity:0.6;'}">
                <div class="activity-card-header" onclick="showActivityDetail('${act.id}')" style="cursor:pointer;">
                    <span class="activity-card-title">${act.name}</span>
                    <span class="activity-card-age">${act.ageMin}–${act.ageMax} mo</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="activity-card-category ${catClass}" onclick="showActivityDetail('${act.id}')" style="cursor:pointer;">${act.category}</span>
                    <div style="display:flex; gap:6px;">
                        ${isScheduled ?
                `<button class="btn btn-sm" disabled style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Already Planned</button>` :
                `<button class="btn btn-accent btn-sm" onclick="scheduleActivity('${act.id}', '${selectedDay}')" style="padding:4px 10px; font-size:0.75rem;">📅 Schedule</button>`
            }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('activity-search').addEventListener('input', debounce(renderActivityLibrary, 300));

function showActivityDetail(actId) {
    const act = activities.find(a => a.id === actId);
    if (!act) return;

    const catLabel = act.category.charAt(0).toUpperCase() + act.category.slice(1);
    const isScheduled = selectedDay && scheduledActivities[selectedDay] && scheduledActivities[selectedDay].includes(actId);

    let scheduleBtn = '';
    if (isScheduled) {
        scheduleBtn = `<button class="btn btn-danger btn-sm" onclick="unscheduleActivity('${act.id}', '${selectedDay}'); closeModal();">Remove from ${formatDate(selectedDay)}</button>`;
    } else {
        scheduleBtn = `<button class="btn btn-accent btn-sm" onclick="scheduleActivity('${act.id}', '${selectedDay}'); closeModal();">📅 Schedule for ${formatDate(selectedDay)}</button>`;
    }

    openModal(act.name, `
        <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span class="badge">${catLabel}</span>
                <span class="text-muted" style="margin-left:8px;">${act.ageMin}–${act.ageMax} months</span>
            </div>
        </div>
        <p class="text-muted" style="margin-bottom:16px;">${act.description}</p>
        <h4 style="margin-bottom:8px; color:var(--accent);">🔧 Tools & Materials</h4>
        <div class="activity-tools-list" style="margin-bottom:16px;">
            ${act.tools.map(t => `<span class="tool-tag">${t}</span>`).join('')}
        </div>
        <h4 style="margin-bottom:8px; color:var(--accent);">🎮 How to Play</h4>
        <ol class="activity-how-to">
            ${act.howToPlay.map(step => `<li>${step}</li>`).join('')}
        </ol>
        <div style="margin-top:20px; padding-top:16px; border-top:var(--glass-border); display:flex; flex-direction:column; gap:10px;">
            ${scheduleBtn}
            <button class="btn btn-outline btn-sm" onclick="deleteActivity('${act.id}')" style="color:var(--red); border-color:rgba(239,83,80,0.2);">🗑️ Delete Activity Permanently</button>
        </div>
    `);
}

function deleteActivity(actId) {
    if (!confirm('Delete this activity permanently from your library?')) return;
    activities = activities.filter(a => a.id !== actId);
    saveData('activities', activities);
    renderActivityLibrary();
    closeModal();
}


// ==================== INIT ====================
renderCalendar();
renderActivityLibrary();
renderDayRecommendations(selectedDay);



