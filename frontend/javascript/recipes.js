const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://smart-health-and-kitchen-assistant.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id") || 1;
    loadKitchenIngredients(userId);
    loadRecommendedRecipes(userId);
    setupCategoryFilters(userId);
    setupSearch(userId);
});

async function loadKitchenIngredients(userId) {
    const listContainer = document.querySelector(".ingredient-list");
    if (!listContainer) return;

    try {
        const res = await fetch(`${API_BASE}/api/items?user_id=${userId}`);
        const data = await res.json();
        const items = data.data || [];

        if (items.length === 0) {
            listContainer.innerHTML = `<span>No kitchen items found. <a href="kit.html" style="color:#2e7d32; text-decoration:underline;">Add items</a> to see recommendations!</span>`;
            return;
        }

        listContainer.innerHTML = items.map(item => `
            <span style="display:inline-block; margin:4px 6px; padding:6px 12px; background:#e8f5e9; border:1px solid #c8e6c9; border-radius:20px; font-weight:500;">
                🥦 ${escapeHtml(item.name)} (${item.quantity} ${item.unit || "units"})
            </span>
        `).join("");
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
            grid.innerHTML = "<p style='padding:20px; color:#666;'>No recipes matching your selection. Try a different category or add ingredients to your kitchen!</p>";
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

                    <!-- Match indicator -->
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
                        <button onclick="viewRecipeModal('${escapeHtml(recipe.title)}', '${escapeHtml(recipe.instructions || "Enjoy preparing this meal step-by-step!")}', '${escapeHtml(recipe.ingredients.join(", "))}')" style="flex:1; padding:8px; border:1px solid #ccc; background:#f5f5f5; border-radius:6px; cursor:pointer;">
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
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
