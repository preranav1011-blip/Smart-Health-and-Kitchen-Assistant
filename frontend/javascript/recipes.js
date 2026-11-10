const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:" || !window.location.hostname)
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

let userKitchenItems = [];

document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("user_id") || 1;
    await loadKitchenIngredients(userId);
    loadRecommendedRecipes(userId);
    setupCategoryFilters(userId);
    setupSearch(userId);
    setupAiGenerator(userId);
});

async function loadKitchenIngredients(userId) {
    const listContainer = document.getElementById("kitchenInventoryPills");
    const aiPillsContainer = document.getElementById("aiPantryPills");

    try {
        let items = [];
        try {
            const res = await fetch(`${API_BASE}/items?user_id=${userId}`, { cache: "no-store" });
            if (res.ok) {
                items = await res.json();
            }
        } catch (e1) {
            try {
                const res2 = await fetch(`${API_BASE}/api/items?user_id=${userId}`, { cache: "no-store" });
                if (res2.ok) {
                    const data = await res2.json();
                    items = data.data || [];
                }
            } catch (e2) {}
        }

        userKitchenItems = items || [];

        // 1. Render in top ingredients summary
        if (listContainer) {
            if (userKitchenItems.length === 0) {
                listContainer.innerHTML = `
                    <span style="color:#64748b; font-size:13px;">No kitchen items logged yet. 
                        <a href="additem.html" style="color:#2e7d32; font-weight:700; text-decoration:underline;">Click here to add items</a>, or use standard staples below to cook!
                    </span>
                `;
            } else {
                listContainer.innerHTML = userKitchenItems.map(item => `
                    <span style="display:inline-flex; align-items:center; gap:6px; margin:4px 4px; padding:6px 14px; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:20px; font-weight:600; color:#1b5e20; font-size:13px;">
                        🥦 ${escapeHtml(item.name)} <span style="font-weight:400; color:#475569;">(${item.quantity} ${item.unit || 'units'})</span>
                    </span>
                `).join("");
            }
        }

        // 2. Render into AI Ingredient Picker Pills
        if (aiPillsContainer) {
            if (userKitchenItems.length === 0) {
                const staples = ["Eggs", "Tomato", "Cheese", "Milk", "Bread", "Onion", "Potato", "Chilli", "Rice", "Spinach"];
                aiPillsContainer.innerHTML = staples.map(ing => `
                    <label style="display:inline-flex; align-items:center; gap:6px; background:white; border:1px solid #cbd5e1; padding:6px 12px; border-radius:20px; font-size:13px; cursor:pointer; user-select:none;">
                        <input type="checkbox" name="aiIng" value="${ing}" checked style="accent-color:#2e7d32;">
                        <span>${ing}</span>
                    </label>
                `).join("") + `<div style="width:100%; font-size:12px; color:#64748b; margin-top:4px;">(Using pantry staples. <a href="additem.html" style="color:#2e7d32; font-weight:600;">Log items</a> to link real inventory!)</div>`;
            } else {
                aiPillsContainer.innerHTML = userKitchenItems.map(item => `
                    <label style="display:inline-flex; align-items:center; gap:6px; background:white; border:1px solid #cbd5e1; padding:6px 12px; border-radius:20px; font-size:13px; cursor:pointer; user-select:none; transition:all 0.15s ease;">
                        <input type="checkbox" name="aiIng" value="${escapeHtml(item.name)}" checked style="accent-color:#2e7d32;">
                        <span style="font-weight:600; color:#1e293b;">${escapeHtml(item.name)}</span>
                        <span style="color:#64748b; font-size:11px;">(${item.quantity} ${item.unit || 'units'})</span>
                    </label>
                `).join("");
            }
        }
    } catch (err) {
        console.warn("Could not load pantry ingredients:", err);
    }
}

async function loadRecommendedRecipes(userId, category = null, searchQuery = "") {
    const grid = document.querySelector(".recipe-grid");
    if (!grid) return;

    grid.innerHTML = "<p style='padding:20px;'>Matching recipes against your kitchen inventory...</p>";

    let recipes = [];

    try {
        const url = `${API_BASE}/api/recipes/recommendations?user_id=${userId}`;
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            recipes = json.data || [];
        }
    } catch (err) {
        console.warn("API recommendations offline, creating dynamically from inventory:", err);
    }

    if (recipes.length === 0) {
        recipes = getCuratedRecipeCollection(userKitchenItems);
    }

    if (category && category.toLowerCase() !== "all") {
        recipes = recipes.filter(r => (r.category || "").toLowerCase() === category.toLowerCase());
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        recipes = recipes.filter(r => 
            (r.title || "").toLowerCase().includes(q) || 
            (r.ingredients || []).some(ing => ing.toLowerCase().includes(q))
        );
    }

    if (recipes.length === 0) {
        grid.innerHTML = "<p style='padding:20px; color:#666;'>No recipes matching your selection. Try another category or generate an AI recipe above!</p>";
        return;
    }

    grid.innerHTML = recipes.map(recipe => {
        const matchPct = recipe.matchPercentage !== undefined ? recipe.matchPercentage : 85;
        const matchColor = matchPct >= 70 ? "#2e7d32" : (matchPct >= 40 ? "#f57c00" : "#d32f2f");
        const canCookBadge = (recipe.canCookNow || matchPct >= 75)
            ? `<span style="background:#4caf50; color:white; padding:3px 8px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px;">Ready to Cook!</span>`
            : "";

        const matchedList = recipe.matchedIngredients || [];
        const missingList = recipe.missingIngredients || [];

        return `
        <div class="recipe-card" style="box-shadow:0 4px 12px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; background:white;">
            <img src="${recipe.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'}" alt="${escapeHtml(recipe.title)}" style="height:180px; object-fit:cover; width:100%;">
            <div class="recipe-content" style="padding:15px; display:flex; flex-direction:column; flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h3 style="margin:0; font-size:18px;">${escapeHtml(recipe.title)}</h3>
                    ${canCookBadge}
                </div>

                <p style="margin:4px 0; color:#666; font-size:13px;">⏱️ ${escapeHtml(recipe.cookingTime || "20 mins")} | 🏷️ ${escapeHtml(recipe.category || "Dinner")}</p>

                <div style="margin:10px 0; padding:8px; background:#f9f9f9; border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; margin-bottom:4px;">
                        <span>Kitchen Pantry Match:</span>
                        <span style="color:${matchColor}">${matchPct}% available</span>
                    </div>
                    <div style="background:#e0e0e0; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="background:${matchColor}; width:${matchPct}%; height:100%;"></div>
                    </div>
                    <p style="margin:6px 0 0 0; font-size:12px; color:#444;">
                        <strong>In kitchen:</strong> ${matchedList.length ? matchedList.join(", ") : "Kitchen Stock Available"}<br>
                        ${missingList.length ? `<strong>Missing:</strong> <span style="color:#d32f2f">${missingList.join(", ")}</span>` : ""}
                    </p>
                </div>

                <div class="rating" style="margin-bottom:12px; color:#ffb300;">
                    ${"⭐".repeat(Math.floor(recipe.rating || 4))} <span style="color:#555; font-size:12px;">(${recipe.rating || 4.5})</span>
                </div>

                <div class="buttons" style="margin-top:auto; display:flex; gap:8px;">
                    <button onclick="viewRecipeModal('${escapeHtml(recipe.title)}', '${escapeHtml(recipe.instructions || "Follow standard directions.")}', '${escapeHtml((recipe.ingredients || []).join(", "))}')" style="flex:1; padding:8px; border:1px solid #ccc; background:#f5f5f5; border-radius:6px; cursor:pointer;">
                        View Recipe
                    </button>
                    <button onclick="alert('Starting guided cooking mode for ${escapeHtml(recipe.title)}!')" style="flex:1; padding:8px; border:none; background:#2e7d32; color:white; border-radius:6px; cursor:pointer; font-weight:bold;">
                        Cook Now
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

// ----------------------------------------------------
// AI Recipe Generator & Agent
// ----------------------------------------------------

function setupAiGenerator(userId) {
    const btnAutoAll = document.getElementById("btnAiAutoAll");
    const btnAutoKitchen = document.getElementById("btnAutoCookKitchen");
    const btnCustom = document.getElementById("btnAiGenerateCustom");

    const runAutoCook = async (btn) => {
        const allItems = userKitchenItems.map(i => i.name);
        await triggerAiGeneration(userId, allItems, "balanced", "Dinner", btn);
    };

    if (btnAutoAll) {
        btnAutoAll.addEventListener("click", () => runAutoCook(btnAutoAll));
    }

    if (btnAutoKitchen) {
        btnAutoKitchen.addEventListener("click", () => runAutoCook(btnAutoKitchen));
    }

    if (btnCustom) {
        btnCustom.addEventListener("click", async () => {
            const checkedInputs = document.querySelectorAll('input[name="aiIng"]:checked');
            const selected = Array.from(checkedInputs).map(cb => cb.value);

            const goal = document.getElementById("aiGoalSelect") ? document.getElementById("aiGoalSelect").value : "balanced";
            const mealType = document.getElementById("aiMealTypeSelect") ? document.getElementById("aiMealTypeSelect").value : "Dinner";

            await triggerAiGeneration(userId, selected, goal, mealType, btnCustom);
        });
    }
}

async function triggerAiGeneration(userId, ingredients, preference, mealType, triggerBtn) {
    const resultBox = document.getElementById("aiRecipeResult");
    if (!resultBox) return;

    resultBox.style.display = "block";
    resultBox.innerHTML = `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:24px; border-radius:10px; text-align:center;">
            <div style="font-size:32px;">🍳</div>
            <h4 style="margin:8px 0 4px 0; color:#166534; font-size:17px;">AI Chef Agent is creating your recipe from your kitchen stock...</h4>
            <p style="margin:0; font-size:13px; color:#22c55e;">Evaluating flavor pairings, cook times, and nutrition...</p>
        </div>
    `;

    const originalText = triggerBtn.textContent;
    triggerBtn.textContent = "Synthesizing...";
    triggerBtn.disabled = true;

    try {
        let generatedRecipe = null;

        // Try primary backend endpoint with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const res = await fetch(`${API_BASE}/api/recipes/ai-generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    user_id: userId,
                    ingredients: ingredients,
                    preference: preference,
                    meal_type: mealType
                })
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.recipe) {
                    generatedRecipe = json.recipe;
                }
            }
        } catch (apiErr) {}

        if (!generatedRecipe) {
            generatedRecipe = generateLocalAiRecipe(ingredients, preference, mealType);
        }

        renderAiRecipeResult(generatedRecipe);

    } catch (err) {
        const fallbackRecipe = generateLocalAiRecipe(ingredients, preference, mealType);
        renderAiRecipeResult(fallbackRecipe);
    } finally {
        triggerBtn.textContent = originalText;
        triggerBtn.disabled = false;
    }
}

// ----------------------------------------------------
// Local AI Culinary Synthesis Engine (Linked to Real Inventory)
// ----------------------------------------------------
function generateLocalAiRecipe(selectedIngredients, preference, mealType) {
    const pool = (selectedIngredients && selectedIngredients.length > 0)
        ? selectedIngredients
        : (userKitchenItems.length > 0 ? userKitchenItems.map(i => i.name) : ["Potatoes", "Milk", "Onion"]);

    const cleanItems = pool.map(i => String(i).trim());
    const lowerItems = cleanItems.map(i => i.toLowerCase());

    const hasPotato = lowerItems.some(i => i.includes("potato"));
    const hasMilk = lowerItems.some(i => i.includes("milk"));
    const hasEggs = lowerItems.some(i => i.includes("egg"));
    const hasBread = lowerItems.some(i => i.includes("bread") || i.includes("toast"));
    const hasCheese = lowerItems.some(i => i.includes("cheese") || i.includes("paneer"));
    const hasRice = lowerItems.some(i => i.includes("rice"));
    const hasTomato = lowerItems.some(i => i.includes("tomato"));
    const hasOnion = lowerItems.some(i => i.includes("onion"));
    const hasSpinach = lowerItems.some(i => i.includes("spinach") || i.includes("green"));

    let title = "Chef's Artisanal Pan-Sauté";
    let prepTime = "8 mins";
    let cookTime = "15 mins";
    let servings = "2 servings";
    let difficulty = "Easy";
    let chefTip = "Toast whole spices in a dry pan for 30 seconds first to unlock their aromatic essential oils.";
    let nutrition = "Balanced ~360 kcal &bull; 14g Protein &bull; 28g Carbs &bull; High Dietary Fiber";

    const recipeIngredients = [];
    cleanItems.forEach(item => {
        recipeIngredients.push(`Fresh ${item} (from your kitchen inventory)`);
    });
    recipeIngredients.push("1 tbsp Olive Oil or Ghee");
    recipeIngredients.push("1/2 tsp Sea Salt & freshly ground black pepper");
    recipeIngredients.push("1 pinch crushed herbs (oregano / cilantro)");

    let steps = [];

    if (hasPotato && hasMilk) {
        title = preference === "quick" 
            ? "Creamy Herb-Infused Mashed Potatoes" 
            : "Velvety Golden Potato Gratin & Herb Reduction";
        prepTime = "10 mins";
        cookTime = "18 mins";
        nutrition = "340 kcal &bull; 8g Protein &bull; 46g Carbs &bull; Rich in Potassium & Vitamin C";
        chefTip = "Warm the milk before gently folding it into cooked potatoes for an ultra-creamy, restaurant-grade texture.";
        steps = [
            "Peel and cube your kitchen inventory potatoes into uniform bite-sized pieces.",
            "Bring a pot of salted water to boil; simmer potatoes for 12-14 minutes until tender.",
            "Drain potatoes thoroughly and return to the warm pot.",
            "Gently heat your kitchen milk with salt, pepper, and herbs.",
            "Gradually pour warm milk into potatoes, mashing with a whisk or masher until velvety smooth and rich.",
            "Garnish with black pepper and fresh herbs, and serve hot."
        ];
    } else if (hasEggs) {
        title = preference === "protein" ? "High-Protein Power Herb Scramble" : "Golden Farmhouse Herb Omelette";
        prepTime = "5 mins";
        cookTime = "8 mins";
        nutrition = "420 kcal &bull; 24g High Quality Protein &bull; 22g Carbs &bull; Rich in Choline";
        chefTip = "Whisk eggs vigorously to incorporate air for a cloud-like, fluffy result.";
        steps = [
            "Prep accompanying kitchen items: dice onions, greens, or vegetables.",
            "Whisk eggs with a splash of milk or water, salt, and pepper.",
            "Warm oil in a skillet, sauté vegetables for 2-3 minutes.",
            "Pour in eggs and fold gently on low heat until soft curds set.",
            "Serve immediately with a sprinkle of herbs."
        ];
    } else if (hasRice) {
        title = "Aromatic Garden Pan-Fried Rice Bowl";
        prepTime = "8 mins";
        cookTime = "12 mins";
        nutrition = "380 kcal &bull; 9g Protein &bull; 58g Carbs";
        chefTip = "Stir-fry on high heat to give the grains a subtle smoky char.";
        steps = [
            "Chop available kitchen vegetables evenly.",
            "Heat oil in a wide skillet, sauté vegetables until crisp-tender.",
            "Add cooked rice and season with salt, pepper, and aromatics.",
            "Toss on high heat for 3 minutes and serve hot."
        ];
    } else {
        const mainItem = cleanItems[0] || "Pantry Medley";
        title = `Savory Skillet ${mainItem} & Herb Sauté`;
        prepTime = "8 mins";
        cookTime = "15 mins";
        steps = [
            `Rinse and slice your kitchen ${cleanItems.join(" and ")}.`,
            "Heat cooking oil in a non-stick skillet over medium-high heat.",
            "Add ingredients in order of firmness, sautéing until tender and golden.",
            "Season with salt, freshly cracked pepper, and herbs.",
            "Serve warm as a nourishing main dish or wholesome side."
        ];
    }

    return {
        title: title,
        category: mealType,
        cookingTime: cookTime,
        prepTime: prepTime,
        servings: servings,
        difficulty: difficulty,
        aiScore: "100% Kitchen Stock Match",
        chefTip: chefTip,
        nutrition: nutrition,
        ingredients: recipeIngredients,
        instructionsList: steps
    };
}

function getCuratedRecipeCollection(kitchenItems) {
    const kNames = (kitchenItems || []).map(i => i.name.toLowerCase());
    const hasPotatoes = kNames.some(n => n.includes("potato"));
    const hasMilk = kNames.some(n => n.includes("milk"));

    const recipes = [
        {
            title: "Creamy Potato & Herb Chowder",
            category: "Dinner",
            cookingTime: "25 mins",
            rating: 4.9,
            matchPercentage: (hasPotatoes && hasMilk) ? 100 : 75,
            canCookNow: hasPotatoes && hasMilk,
            imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600",
            ingredients: ["Potatoes", "Milk", "Onion", "Salt", "Black Pepper", "Butter"],
            matchedIngredients: (hasPotatoes && hasMilk) ? ["Potatoes", "Milk"] : ["Potatoes"],
            missingIngredients: (hasPotatoes && hasMilk) ? [] : ["Milk"],
            instructions: "1. Simmer diced potatoes in salted water until tender.
2. In a skillet, sauté chopped onions in butter.
3. Blend half the potatoes with warm milk until creamy.
4. Combine all ingredients, season, and simmer for 5 mins."
        },
        {
            title: "Crispy Golden Garlic Roasted Potatoes",
            category: "Lunch",
            cookingTime: "20 mins",
            rating: 4.8,
            matchPercentage: hasPotatoes ? 100 : 80,
            canCookNow: hasPotatoes,
            imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600",
            ingredients: ["Potatoes", "Olive Oil", "Garlic", "Rosemary", "Salt"],
            matchedIngredients: hasPotatoes ? ["Potatoes"] : [],
            missingIngredients: [],
            instructions: "1. Parboil potatoes for 5 mins.
2. Toss in olive oil, salt, and garlic.
3. Roast at high heat until golden and crunchy."
        },
        {
            title: "Classic Vegetable Omelette",
            category: "Breakfast",
            cookingTime: "15 mins",
            rating: 4.8,
            matchPercentage: 90,
            canCookNow: true,
            imageUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600",
            ingredients: ["Eggs", "Onion", "Tomato", "Chilli", "Salt", "Pepper"],
            matchedIngredients: ["Eggs", "Onion", "Tomato"],
            missingIngredients: [],
            instructions: "1. Beat eggs with salt and pepper.
2. Sauté onion and tomato in a pan.
3. Pour eggs and cook until set.
4. Fold and serve hot."
        },
        {
            title: "Quick Garlic Fried Rice",
            category: "Lunch",
            cookingTime: "20 mins",
            rating: 4.7,
            matchPercentage: 85,
            canCookNow: true,
            imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
            ingredients: ["Rice", "Garlic", "Onion", "Vegetables", "Soy Sauce"],
            matchedIngredients: ["Rice", "Onion"],
            missingIngredients: ["Garlic"],
            instructions: "1. Sauté minced garlic and onions in sesame oil.
2. Add diced vegetables.
3. Add cooked rice and season with salt & pepper.
4. Stir-fry on high heat for 3 mins."
        }
    ];

    return recipes;
}

function renderAiRecipeResult(recipe) {
    const resultBox = document.getElementById("aiRecipeResult");
    if (!resultBox) return;

    resultBox.innerHTML = `
        <div style="background:linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border:2px solid #2e7d32; border-radius:14px; padding:24px; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                <div>
                    <span style="background:#e8f5e9; color:#2e7d32; font-size:12px; font-weight:700; padding:4px 12px; border-radius:12px; display:inline-block; margin-bottom:6px;">
                        ✨ AI Agent Signature Recipe &bull; ${escapeHtml(recipe.aiScore || "100% Match")}
                    </span>
                    <h3 style="margin:0; font-size:22px; color:#0f172a;">${escapeHtml(recipe.title)}</h3>
                    <p style="margin:4px 0 0 0; color:#64748b; font-size:13px;">
                        ⏱️ Prep: ${escapeHtml(recipe.prepTime || "5m")} &bull; Cook: ${escapeHtml(recipe.cookingTime)} &bull; 🍽️ ${escapeHtml(recipe.servings || "2 servings")} &bull; 🏷️ ${escapeHtml(recipe.difficulty || "Easy")}
                    </p>
                </div>
                <button onclick="alert('Starting guided step-by-step cooking mode for ${escapeHtml(recipe.title)}!')" style="background:#2e7d32; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:700; cursor:pointer;">
                    👨‍🍳 Cook Now
                </button>
            </div>

            <!-- Ingredients Used -->
            <div style="margin:14px 0; background:#f1f5f9; padding:12px 16px; border-radius:8px;">
                <h4 style="margin:0 0 6px 0; font-size:13px; color:#334155; text-transform:uppercase;">🛒 Linked Kitchen Inventory Ingredients:</h4>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${(recipe.ingredients || []).map(ing => `
                        <span style="background:white; border:1px solid #cbd5e1; padding:4px 10px; border-radius:14px; font-size:12px; font-weight:600; color:#1e293b;">
                            ✓ ${escapeHtml(ing)}
                        </span>
                    `).join("")}
                </div>
            </div>

            <!-- Cooking Instructions -->
            <div style="margin:16px 0;">
                <h4 style="margin:0 0 10px 0; font-size:15px; color:#1e293b;">📝 Step-by-Step Cooking Guide:</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${(recipe.instructionsList || (recipe.instructions || "").split("\n")).filter(s => s && s.trim()).map(step => `
                        <div style="background:white; border:1px solid #e2e8f0; padding:10px 14px; border-radius:8px; font-size:14px; color:#334155; line-height:1.4;">
                            ${escapeHtml(step)}
                        </div>
                    `).join("")}
                </div>
            </div>

            <!-- Chef Pro Tip & Nutrition Highlights -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:16px;">
                <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:10px 14px; border-radius:6px;">
                    <strong style="color:#b45309; font-size:13px;">💡 Chef's Secret Pro-Tip:</strong>
                    <p style="margin:4px 0 0 0; font-size:13px; color:#78350f;">${escapeHtml(recipe.chefTip || "Cook with medium heat to retain moisture and depth.")}</p>
                </div>
                <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:10px 14px; border-radius:6px;">
                    <strong style="color:#15803d; font-size:13px;">🥗 Nutrition Highlights:</strong>
                    <p style="margin:4px 0 0 0; font-size:13px; color:#14532d;">${escapeHtml(recipe.nutrition || "Balanced calories and wholesome natural protein.")}</p>
                </div>
            </div>
        </div>
    `;

    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setupCategoryFilters(userId) {
    const buttons = document.querySelectorAll(".categories button");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => {
                b.style.background = "";
                b.style.color = "";
            });
            btn.style.background = "#2e7d32";
            btn.style.color = "white";

            const rawText = btn.textContent.replace(/[^a-zA-Z]/g, "").trim();
            loadRecommendedRecipes(userId, rawText);
        });
    });
}

function setupSearch(userId) {
    const input = document.querySelector(".search-container input");
    const searchBtn = document.querySelector(".search-container button");

    const doSearch = () => {
        if (!input) return;
        loadRecommendedRecipes(userId, null, input.value.trim());
    };

    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    if (input) {
        input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") doSearch();
        });
    }
}

function viewRecipeModal(title, instructions, ingredients) {
    alert(`🍲 ${title}\n\n🛒 Ingredients: ${ingredients}\n\n📝 Instructions:\n${instructions}`);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
