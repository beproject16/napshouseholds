/* ========================================
   RECIPES & GROCERY MODULE
   Recipe CRUD, weekly meal planner, grocery list generator
   ======================================== */

// ==================== STATE ====================
let recipes = loadData('recipes', []);
let mealPlan = loadData('meal_plan', { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
let selectedRecipeId = null;

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

const INGREDIENT_CATEGORIES = {
    protein: ['ayam', 'chicken', 'daging', 'beef', 'ikan', 'fish', 'udang', 'shrimp', 'telur', 'egg', 'tahu', 'tofu', 'tempe', 'tempeh', 'sosis', 'bakso'],
    vegetables: ['bayam', 'spinach', 'kangkung', 'wortel', 'carrot', 'brokoli', 'broccoli', 'buncis', 'terong', 'kentang', 'potato', 'tomat', 'tomato', 'bawang', 'onion', 'cabai', 'chili', 'paprika', 'jagung', 'corn', 'labu', 'timun', 'cucumber', 'selada', 'lettuce', 'kol', 'cabbage', 'sawi'],
    spices: ['garam', 'salt', 'merica', 'pepper', 'kunyit', 'turmeric', 'jahe', 'ginger', 'lengkuas', 'galangal', 'serai', 'lemongrass', 'daun salam', 'kayu manis', 'cinnamon', 'pala', 'nutmeg', 'ketumbar', 'coriander', 'jintan', 'cumin', 'kemiri', 'candlenut'],
    staples: ['beras', 'rice', 'mie', 'noodle', 'pasta', 'roti', 'bread', 'tepung', 'flour', 'gula', 'sugar', 'minyak', 'oil', 'mentega', 'butter', 'santan', 'coconut milk', 'susu', 'milk', 'kecap', 'soy sauce', 'saus', 'sauce'],
    others: []
};


// ==================== RENDER RECIPES ====================
function renderRecipes() {
    renderRecipeList();
    renderWeekPlanner();
}

function renderRecipeList() {
    const list = document.getElementById('recipe-list');
    const empty = document.getElementById('recipe-empty');
    const searchTerm = (document.getElementById('recipe-search').value || '').toLowerCase();

    let filtered = recipes;
    if (searchTerm) filtered = recipes.filter(r => r.name.toLowerCase().includes(searchTerm));

    if (filtered.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = filtered.map(r => `
        <li class="recipe-item ${r.id === selectedRecipeId ? 'active' : ''}" onclick="selectRecipe('${r.id}')">
            <div class="recipe-item-name">${r.name}</div>
            <div class="recipe-item-meta">${r.ingredients.length} ingredients · ${r.servings} servings</div>
        </li>
    `).join('');
}

document.getElementById('recipe-search').addEventListener('input', debounce(renderRecipeList, 300));


// ==================== SELECT RECIPE ====================
function selectRecipe(id) {
    selectedRecipeId = id;
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    const detail = document.getElementById('recipe-detail');
    detail.style.display = 'block';

    document.getElementById('recipe-detail-name').textContent = recipe.name;
    document.getElementById('recipe-detail-servings').textContent = `Serves: ${recipe.servings || '—'}`;

    document.getElementById('recipe-detail-ingredients').innerHTML = recipe.ingredients
        .map(i => `<li>${i.qty} ${i.unit} ${i.name}</li>`)
        .join('');

    document.getElementById('recipe-detail-instructions').textContent = recipe.instructions || 'No instructions added.';

    renderRecipeList();
}


// ==================== ADD / EDIT RECIPE ====================
document.getElementById('btn-add-recipe').addEventListener('click', () => showRecipeForm());
document.getElementById('btn-edit-recipe').addEventListener('click', () => {
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (recipe) showRecipeForm(recipe);
});

function showRecipeForm(existing = null) {
    const isEdit = !!existing;
    const title = isEdit ? 'Edit Recipe' : 'New Recipe';

    const ingredientsHTML = (existing?.ingredients || [{ name: '', qty: '', unit: '' }])
        .map((ing, i) => ingredientRowHTML(i, ing))
        .join('');

    openModal(title, `
        <form id="form-recipe">
            <div class="form-group">
                <label>Recipe Name</label>
                <input type="text" class="input-text" id="recipe-name" value="${existing?.name || ''}" placeholder="e.g., Nasi Goreng" required>
            </div>
            <div class="form-group">
                <label>Servings</label>
                <input type="number" class="input-text" id="recipe-servings" value="${existing?.servings || 4}" min="1">
            </div>
            <div class="form-group">
                <label>Ingredients</label>
                <div id="ingredients-container">${ingredientsHTML}</div>
                <button type="button" class="btn btn-outline btn-sm" id="btn-add-ingredient" style="margin-top:8px;">+ Add Ingredient</button>
            </div>
            <div class="form-group">
                <label>Instructions (optional)</label>
                <textarea class="input-textarea" id="recipe-instructions" placeholder="Step by step cooking instructions...">${existing?.instructions || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">${isEdit ? 'Update' : 'Add'} Recipe</button>
        </form>
    `);

    let ingredientCount = existing?.ingredients?.length || 1;

    document.getElementById('btn-add-ingredient').addEventListener('click', () => {
        const container = document.getElementById('ingredients-container');
        container.insertAdjacentHTML('beforeend', ingredientRowHTML(ingredientCount++));
    });

    document.getElementById('form-recipe').addEventListener('submit', (e) => {
        e.preventDefault();

        const ingredients = [];
        const rows = document.querySelectorAll('.ingredient-row');
        rows.forEach(row => {
            const name = row.querySelector('.ing-name').value.trim();
            const qty = row.querySelector('.ing-qty').value.trim();
            const unit = row.querySelector('.ing-unit').value.trim();
            if (name) ingredients.push({ name, qty, unit });
        });

        const data = {
            name: document.getElementById('recipe-name').value.trim(),
            servings: parseInt(document.getElementById('recipe-servings').value) || 4,
            ingredients,
            instructions: document.getElementById('recipe-instructions').value.trim()
        };

        if (isEdit) {
            const idx = recipes.findIndex(r => r.id === existing.id);
            if (idx >= 0) recipes[idx] = { ...recipes[idx], ...data };
        } else {
            recipes.push({ id: generateId(), ...data });
        }

        saveData('recipes', recipes);
        renderRecipes();
        if (isEdit) selectRecipe(existing.id);
        closeModal();
    });
}

function ingredientRowHTML(idx, ing = {}) {
    return `
        <div class="form-row ingredient-row" style="margin-bottom:6px;">
            <input type="text" class="input-text ing-qty" placeholder="Qty" value="${ing.qty || ''}" style="max-width:70px;">
            <input type="text" class="input-text ing-unit" placeholder="Unit" value="${ing.unit || ''}" style="max-width:80px;">
            <input type="text" class="input-text ing-name" placeholder="Ingredient name" value="${ing.name || ''}">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.ingredient-row').remove()" style="flex:0;padding:7px 10px;">×</button>
        </div>
    `;
}


// ==================== DELETE RECIPE ====================
document.getElementById('btn-delete-recipe').addEventListener('click', () => {
    if (!selectedRecipeId) return;
    if (!confirm('Delete this recipe?')) return;
    recipes = recipes.filter(r => r.id !== selectedRecipeId);
    selectedRecipeId = null;
    document.getElementById('recipe-detail').style.display = 'none';
    saveData('recipes', recipes);
    renderRecipes();
});


// ==================== WEEKLY MEAL PLANNER ====================
function renderWeekPlanner() {
    const container = document.getElementById('week-planner');
    container.innerHTML = DAYS.map(day => {
        const meals = (mealPlan[day] || []);
        const mealsHTML = meals.map((recipeId, idx) => {
            const recipe = recipes.find(r => r.id === recipeId);
            if (!recipe) return '';
            return `<div class="day-slot-recipe">
                <span>${recipe.name}</span>
                <button class="remove-meal" onclick="removeMeal('${day}', ${idx})">×</button>
            </div>`;
        }).join('');

        return `
            <div class="day-slot" data-day="${day}">
                <div class="day-slot-header">${DAY_LABELS[day].substring(0, 3)}</div>
                ${mealsHTML}
                <button class="add-meal-btn" onclick="addMealToDay('${day}')">+ Add</button>
            </div>
        `;
    }).join('');
}

function addMealToDay(day) {
    if (recipes.length === 0) {
        alert('Add some recipes first!');
        return;
    }

    const options = recipes.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    openModal(`Add meal to ${DAY_LABELS[day]}`, `
        <div class="form-group">
            <label>Select Recipe</label>
            <select class="input-select" id="meal-recipe-select">${options}</select>
        </div>
        <button class="btn btn-primary" id="meal-add-confirm" style="width:100%;margin-top:8px;">Add to ${DAY_LABELS[day]}</button>
    `);

    document.getElementById('meal-add-confirm').addEventListener('click', () => {
        const recipeId = document.getElementById('meal-recipe-select').value;
        if (!mealPlan[day]) mealPlan[day] = [];
        mealPlan[day].push(recipeId);
        saveData('meal_plan', mealPlan);
        renderWeekPlanner();
        closeModal();
    });
}

function removeMeal(day, idx) {
    mealPlan[day].splice(idx, 1);
    saveData('meal_plan', mealPlan);
    renderWeekPlanner();
}


// ==================== GROCERY LIST ====================
document.getElementById('btn-generate-grocery').addEventListener('click', generateGroceryList);

function generateGroceryList() {
    const allRecipeIds = [];
    DAYS.forEach(day => {
        (mealPlan[day] || []).forEach(id => allRecipeIds.push(id));
    });

    if (allRecipeIds.length === 0) {
        alert('Add recipes to your weekly plan first!');
        return;
    }

    // Merge ingredients
    const merged = {};
    allRecipeIds.forEach(id => {
        const recipe = recipes.find(r => r.id === id);
        if (!recipe) return;
        recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            if (!merged[key]) {
                merged[key] = { name: ing.name, qty: 0, unit: ing.unit, category: categorizeIngredient(ing.name) };
            }
            const qty = parseFloat(ing.qty) || 0;
            merged[key].qty += qty;
        });
    });

    // Sort by category
    const items = Object.values(merged).sort((a, b) => a.category.localeCompare(b.category));

    const card = document.getElementById('grocery-list-card');
    const list = document.getElementById('grocery-list');
    const count = document.getElementById('grocery-count');

    card.style.display = 'block';
    count.textContent = `${items.length} items`;

    list.innerHTML = items.map((item, i) => `
        <li class="grocery-item" id="grocery-${i}">
            <input type="checkbox" onchange="toggleGroceryItem(${i})">
            <span>${item.qty > 0 ? item.qty : ''} ${item.unit} <strong>${item.name}</strong></span>
        </li>
    `).join('');
}

function toggleGroceryItem(idx) {
    const item = document.getElementById(`grocery-${idx}`);
    item.classList.toggle('checked');
}

function categorizeIngredient(name) {
    const lower = name.toLowerCase();
    for (const [cat, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
        for (const kw of keywords) {
            if (lower.includes(kw)) return cat;
        }
    }
    return 'others';
}


// ==================== INIT ====================
renderRecipes();
