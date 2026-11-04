const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

let userKitchenItems = [];

document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id") || 1;
    loadKitchenIngredients(userId);
    loadRecommendedRecipes(userId);
    setupCategoryFilters(userId);
    setupSearch(userId);
    setupAiGenerator(userId);
});

async function loadKitchenIngredients(userId) {
    const listContainer = document.querySelector(".ingredient-list");
    const aiPillsContainer = document.getElementById("aiPantryPills");

    try {
        const res = await fetch(`${API_BASE}/api/items?user_id=${userId}`);
        const data = await res.json();
        userKitchenItems = data.data || [];

        // 1. Render in top ingredients summary
        if (listContainer) {
            if (userKitchenItems.length === 0) {
                listContainer.innerHTML = `<span>No kitchen items found. <a href="additem.html" style="color:#2e7d32; text-decoration:underline;">Add food items</a> to get personalized recipes!</span>`;
            } else {
                listContainer.innerHTML = userKitchenItems.map(item => `
                    <span style="display:inline-block; margin:4px 6px; padding:6px 12px; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:20px; font-weight:500;">
                        🥦 ${escapeHtml(item.name)} (${item.quantity} ${item.unit || "units"})
                    </span>
                `).join("");
            }
        }

        // 2. Render into AI Ingredient Picker Pills
        if (aiPillsContainer) {
            if (userKitchenItems.length === 0) {
                aiPillsContainer.innerHTML = `
                    <span style="color:#64748b; font-size:13px;">No items currently logged in kitchen. Standard pantry staples will be used, or <a href="additem.html" style="color:#2e7d32; font-weight:600;">add items now</a>.</span>
                `;
            } else {
                aiPillsContainer.innerHTML = userKitchenItems.map((item, idx) => `
                    <label style="display:inline-flex; align-items:center; gap:6px; background:white; border:1px solid #cbd5e1; padding:6px 12px; border-radius:20px; font-size:13px; cursor:pointer; user-select:none; transition:all 0.15s ease;">
                        <input type="checkbox" name="aiIng" value="${escapeHtml(item.name)}" checked style="accent-color:#2e7d32;">
                        <span>${escapeHtml(item.name)}</span>
                    </label>
                `).join("");
            }
        }
    } catch (err) {
        console.error("Failed to load ingredients:", err);
    }
}

async function loadRecommendedRecipes(userId, category = null, searchQuery = "") {
    const grid = document.querySelector(".recipe-grid");
    if (!grid) return;

    grid.innerHTML = "<p style='padding:20px;'>Loading personalized recipe recommendations from your kitchen inventory...</p>";

    try {
        const url = `${API_BASE}/api/recipes/recommendations?user_id=${userId}`;
        const res = await fetch(url);
        const json = await res.json();
        let recipes = json.data || [];

        if (category && category.toLowerCase() !== "all") {
            recipes = recipes.filter(r => r.category.toLowerCase() === category.toLowerCase());
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            recipes = recipes.filter(r => 
                r.title.toLowerCase().includes(q) || 
                r.ingredients.some(ing => ing.toLowerCase().includes(q))
            );
        }

        if (recipes.length === 0) {
            grid.innerHTML = "<p style='padding:20px; color:#666;'>No recipes matching your selection. Try another category or generate an AI recipe above!</p>";
            return;
        }

        grid.innerHTML = recipes.map(recipe => {
            const matchColor = recipe.matchPercentage >= 70 ? "#2e7d32" : (recipe.matchPercentage >= 40 ? "#f57c00" : "#d32f2f");
            const canCookBadge = recipe.canCookNow 
                ? `<span style="background:#4caf50; color:white; padding:3px 8px; border-radius:12px; font-size:12px; font-weight:bold; margin-left:8px;">Ready to Cook!</span>`
                : "";

            return `
            <div class="recipe-card" style="box-shadow:0 4px 12px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; background:white;">
                <img src="${recipe.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600'}" alt="${escapeHtml(recipe.title)}" style="height:180px; object-fit:cover; width:100%;">
                <div class="recipe-content" style="padding:15px; display:flex; flex-direction:column; flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h3 style="margin:0; font-size:18px;">${escapeHtml(recipe.title)}</h3>
                        ${canCookBadge}
                    </div>

                    <p style="margin:4px 0; color:#666; font-size:13px;">⏱️ ${escapeHtml(recipe.cookingTime)} | 🏷️ ${escapeHtml(recipe.category)}</p>

                    <div style="margin:10px 0; padding:8px; background:#f9f9f9; border-radius:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; margin-bottom:4px;">
                            <span>Pantry Match:</span>
                            <span style="color:${matchColor}">${recipe.matchPercentage}% available</span>
                        </div>
                        <div style="background:#e0e0e0; height:6px; border-radius:3px; overflow:hidden;">
                            <div style="background:${matchColor}; width:${recipe.matchPercentage}%; height:100%;"></div>
                        </div>
                        <p style="margin:6px 0 0 0; font-size:12px; color:#444;">
                            <strong>In kitchen:</strong> ${recipe.matchedIngredients.length ? recipe.matchedIngredients.join(", ") : "None yet"}<br>
                            ${recipe.missingIngredients.length ? `<strong>Missing:</strong> <span style="color:#d32f2f">${recipe.missingIngredients.join(", ")}</span>` : ""}
                        </p>
                    </div>

                    <div class="rating" style="margin-bottom:12px; color:#ffb300;">
                        ${"⭐".repeat(Math.floor(recipe.rating))} <span style="color:#555; font-size:12px;">(${recipe.rating})</span>
                    </div>

                    <div class="buttons" style="margin-top:auto; display:flex; gap:8px;">
                        <button onclick="viewRecipeModal('${escapeHtml(recipe.title)}', '${escapeHtml(recipe.instructions || "Follow step-by-step cooking directions.")}', '${escapeHtml(recipe.ingredients.join(", "))}')" style="flex:1; padding:8px; border:1px solid #ccc; background:#f5f5f5; border-radius:6px; cursor:pointer;">
                            View Recipe
                        </button>
                        <button onclick="alert('Starting guided cooking mode for ${escapeHtml(recipe.title)}!')" style="flex:1; padding:8px; border:none; background:#2e7d32; color:white; border-radius:6px; cursor:pointer; font-weight:bold;">
                            ${recipe.canCookNow ? "Cook Now" : "Cook"}
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join("");
    } catch (err) {
        console.error("Failed to load recipes:", err);
        grid.innerHTML = "<p style='padding:20px; color:#d32f2f;'>Error loading recipes from server.</p>";
    }
}

// ----------------------------------------------------
// AI Recipe Generator & Agent
// ----------------------------------------------------

function setupAiGenerator(userId) {
    const btnAutoAll = document.getElementById("btnAiAutoAll");
    const btnCustom = document.getElementById("btnAiGenerateCustom");
    const resultBox = document.getElementById("aiRecipeResult");

    // 1. One-click generate from all kitchen items
    if (btnAutoAll) {
        btnAutoAll.addEventListener("click", async () => {
            await triggerAiGeneration(userId, [], "balanced", "Dinner", btnAutoAll);
        });
    }

    // 2. Custom generation from chosen ingredients & goals
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
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:20px; border-radius:10px; text-align:center;">
            <div style="font-size:28px; animation:spin 1s infinite linear;">🍳</div>
            <h4 style="margin:8px 0 4px 0; color:#166534;">AI Chef Agent is creating your recipe...</h4>
            <p style="margin:0; font-size:13px; color:#4ade80;">Evaluating flavor pairings, cook times, and nutrition...</p>
        </div>
    `;

    const originalText = triggerBtn.textContent;
    triggerBtn.textContent = "Synthesizing...";
    triggerBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/recipes/ai-generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                ingredients: ingredients,
                preference: preference,
                meal_type: mealType
            })
        });

        const json = await res.json();
        if (json.success && json.recipe) {
            renderAiRecipeResult(json.recipe);
        } else {
            resultBox.innerHTML = `<p style="color:#d32f2f;">Failed to generate AI recipe: ${json.message || "Unknown error"}</p>`;
        }
    } catch (err) {
        console.error("AI Generation error:", err);
        resultBox.innerHTML = `<p style="color:#d32f2f;">Could not connect to the AI recipe service.</p>`;
    } finally {
        triggerBtn.textContent = originalText;
        triggerBtn.disabled = false;
    }
}

function renderAiRecipeResult(recipe) {
    const resultBox = document.getElementById("aiRecipeResult");
    if (!resultBox) return;

    resultBox.innerHTML = `
        <div style="background:linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); border:2px solid #2e7d32; border-radius:14px; padding:24px; box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                <div>
                    <span style="background:#e8f5e9; color:#2e7d32; font-size:12px; font-weight:700; padding:3px 10px; border-radius:12px; display:inline-block; margin-bottom:6px;">
                        ✨ AI Agent Signature Recipe &bull; ${escapeHtml(recipe.aiScore || "98% Match")}
                    </span>
                    <h3 style="margin:0; font-size:22px; color:#0f172a;">${escapeHtml(recipe.title)}</h3>
                    <p style="margin:4px 0 0 0; color:#64748b; font-size:13px;">
                        ⏱️ Prep: ${escapeHtml(recipe.prepTime || "5m")} &bull; Cook: ${escapeHtml(recipe.cookingTime)} &bull; 🍽️ ${escapeHtml(recipe.servings || "2")} &bull; 🏷️ ${escapeHtml(recipe.difficulty || "Easy")}
                    </p>
                </div>
                <button onclick="alert('Starting guided step-by-step cooking mode!')" style="background:#2e7d32; color:white; border:none; padding:10px 18px; border-radius:8px; font-weight:700; cursor:pointer;">
                    👨‍🍳 Cook Now
                </button>
            </div>

            <!-- Ingredients Used -->
            <div style="margin:14px 0; background:#f1f5f9; padding:12px 16px; border-radius:8px;">
                <h4 style="margin:0 0 6px 0; font-size:13px; color:#334155; text-transform:uppercase;">🛒 Ingredients Used From Kitchen:</h4>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${(recipe.ingredients || []).map(ing => `
                        <span style="background:white; border:1px solid #cbd5e1; padding:3px 10px; border-radius:14px; font-size:12px; font-weight:600; color:#1e293b;">
                            ✓ ${escapeHtml(ing)}
                        </span>
                    `).join("")}
                </div>
            </div>

            <!-- Cooking Instructions -->
            <div style="margin:16px 0;">
                <h4 style="margin:0 0 10px 0; font-size:15px; color:#1e293b;">📝 Step-by-Step Cooking Guide:</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${(recipe.instructionsList || (recipe.instructions || "").split("\n")).filter(s => s.trim()).map(step => `
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
            buttons.forEach(b => b.style.background = "");
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
