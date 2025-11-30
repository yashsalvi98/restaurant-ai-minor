import { useEffect, useState } from "react";
import axios from "axios";

const ADMIN_LABEL = "admin"; // just for display text

function AdminData() {
  const [items, setItems] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [savingIngredientId, setSavingIngredientId] = useState(null);
  const [savingRecipeId, setSavingRecipeId] = useState(null);

  const [newRecipe, setNewRecipe] = useState({
    item_id: "",
    ingredient_id: "",
    quantity_per_item: "",
  });

  // ---- AUTH STATE ----
  const [token, setToken] = useState(() => localStorage.getItem("adminToken") || "");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const backendBase = "http://127.0.0.1:5000";

  // apply token to axios when it changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("adminToken", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("adminToken");
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await axios.post(`${backendBase}/api/login`, {
        username,
        password,
      });
      setToken(res.data.token);
      setPassword("");
    } catch (error) {
      console.error(error);
      setAuthError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setToken("");
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [itemsRes, ingredientsRes, recipesRes] = await Promise.all([
        axios.get(`${backendBase}/api/items`),
        axios.get(`${backendBase}/api/ingredients`),
        axios.get(`${backendBase}/api/recipes`),
      ]);

      setItems(itemsRes.data);
      setIngredients(ingredientsRes.data);
      setRecipes(recipesRes.data);
    } catch (error) {
      console.error(error);
      alert("Error loading admin data. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- INGREDIENT HANDLERS ---

  const handleIngredientChange = (id, field, value) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleSaveIngredient = async (ing) => {
    try {
      if (!token) {
        alert("Please login as admin first.");
        return;
      }
      setSavingIngredientId(ing.id);
      await axios.put(`${backendBase}/api/ingredients/${ing.id}`, {
        current_stock: ing.current_stock,
        reorder_level: ing.reorder_level,
      });
      alert("Ingredient updated successfully ✅");
    } catch (error) {
      console.error(error);
      alert("Error updating ingredient (maybe token expired?).");
    } finally {
      setSavingIngredientId(null);
    }
  };

  // --- RECIPE HANDLERS ---

  const handleRecipeChange = (id, value) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, quantity_per_item: value } : r
      )
    );
  };

  const handleSaveRecipe = async (recipe) => {
    try {
      if (!token) {
        alert("Please login as admin first.");
        return;
      }
      setSavingRecipeId(recipe.id);
      await axios.put(`${backendBase}/api/recipes/${recipe.id}`, {
        quantity_per_item: recipe.quantity_per_item,
      });
      alert("Recipe updated successfully ✅");
    } catch (error) {
      console.error(error);
      alert("Error updating recipe (maybe token expired?).");
    } finally {
      setSavingRecipeId(null);
    }
  };

  const handleDeleteRecipe = async (id) => {
    if (!token) {
      alert("Please login as admin first.");
      return;
    }
    if (!window.confirm("Delete this mapping?")) return;
    try {
      await axios.delete(`${backendBase}/api/recipes/${id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting recipe.");
    }
  };

  const handleNewRecipeChange = (field, value) => {
    setNewRecipe((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddRecipe = async () => {
    if (!token) {
      alert("Please login as admin first.");
      return;
    }

    if (!newRecipe.item_id || !newRecipe.ingredient_id || !newRecipe.quantity_per_item) {
      alert("Please select item, ingredient and enter quantity.");
      return;
    }

    try {
      const res = await axios.post(`${backendBase}/api/recipes`, {
        item_id: Number(newRecipe.item_id),
        ingredient_id: Number(newRecipe.ingredient_id),
        quantity_per_item: Number(newRecipe.quantity_per_item),
      });

      setRecipes((prev) => [...prev, res.data]);
      // reset form
      setNewRecipe({
        item_id: "",
        ingredient_id: "",
        quantity_per_item: "",
      });
    } catch (error) {
      console.error(error);
      alert("Error adding recipe mapping.");
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Admin – Items, Ingredients & Recipes</h1>
      <p className="page-subtitle">
        Admin-only area to manage menu items, ingredient stock and recipe mappings.
      </p>

      {/* LOGIN CARD */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Admin Login</h3>
        {token ? (
          <div>
            <p className="card-note" style={{ marginBottom: "0.5rem" }}>
              Logged in as <strong>{ADMIN_LABEL}</strong> (token stored locally).
            </p>
            <button className="btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleLogin}
            className="form-row"
            style={{ gap: "0.75rem" }}
          >
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button className="btn" type="submit">
              Login
            </button>
            {authError && (
              <span className="card-note" style={{ color: "red" }}>
                {authError}
              </span>
            )}
          </form>
        )}
      </div>

      {/* ITEMS */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Menu Items</h3>
        {loading && items.length === 0 && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            Loading data...
          </p>
        )}

        {!loading && items.length === 0 && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            No items found. Items are usually seeded via the backend script or DB.
          </p>
        )}

        {items.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INGREDIENTS */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Ingredients & Stock</h3>
        {loading && ingredients.length === 0 && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            Loading data...
          </p>
        )}

        {!loading && ingredients.length === 0 && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            No ingredients found. Ingredients are usually seeded via the backend script or DB.
          </p>
        )}

        {ingredients.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td>{ing.id}</td>
                    <td>{ing.name}</td>
                    <td>{ing.unit}</td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ width: "90px" }}
                        value={ing.current_stock}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.id,
                            "current_stock",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ width: "90px" }}
                        value={ing.reorder_level}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.id,
                            "reorder_level",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn"
                        onClick={() => handleSaveIngredient(ing)}
                        disabled={savingIngredientId === ing.id}
                      >
                        {savingIngredientId === ing.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECIPES */}
      <div className="card">
        <h3>Recipe Mappings (Item → Ingredient)</h3>
        {loading && recipes.length === 0 && (
          <p className="card-note" style={{ marginTop: "0.5rem" }}>
            Loading data...
          </p>
        )}

        {recipes.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Ingredient</th>
                  <th>Quantity / Item</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.item_name}</td>
                    <td>{r.ingredient_name}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: "90px" }}
                        value={r.quantity_per_item}
                        onChange={(e) =>
                          handleRecipeChange(r.id, e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="btn"
                        style={{ marginRight: "0.5rem" }}
                        onClick={() => handleSaveRecipe(r)}
                        disabled={savingRecipeId === r.id}
                      >
                        {savingRecipeId === r.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleDeleteRecipe(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new mapping */}
        <div style={{ marginTop: "1rem" }}>
          <h4 style={{ marginBottom: "0.4rem" }}>Add New Mapping</h4>
          <div className="form-row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <select
              className="input"
              value={newRecipe.item_id}
              onChange={(e) =>
                handleNewRecipeChange("item_id", e.target.value)
              }
            >
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={newRecipe.ingredient_id}
              onChange={(e) =>
                handleNewRecipeChange("ingredient_id", e.target.value)
              }
            >
              <option value="">Select Ingredient</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              className="input"
              style={{ width: "110px" }}
              placeholder="Qty / item"
              value={newRecipe.quantity_per_item}
              onChange={(e) =>
                handleNewRecipeChange("quantity_per_item", e.target.value)
              }
            />

            <button className="btn" onClick={handleAddRecipe}>
              Add Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminData;
