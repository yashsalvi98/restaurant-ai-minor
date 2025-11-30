from flask import Flask, jsonify, request
from flask_cors import CORS

from ml.demand_model import predict_demand
from ml.item_demand_model import predict_item_demand
from db import SessionLocal, Item, Ingredient, RecipeMap, init_db

# --- New imports for auth ---
import datetime
import jwt
from functools import wraps


app = Flask(__name__)
CORS(app)

# --- Simple auth config (change for production) ---
SECRET_KEY = "super-secret-key-change-this"  # change this later
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"  # change this later
TOKEN_EXP_MINUTES = 60


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXP_MINUTES),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    # PyJWT >= 2 usually returns str, but just in case:
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        # Expect: "Bearer <token>"
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        username = verify_token(token)
        if username != ADMIN_USERNAME:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)

    return wrapper


# Make sure DB tables exist
init_db()


@app.route("/")
def home():
    return jsonify({"message": "Backend running ✅"})


# ---------- AUTH API ----------

@app.route("/api/login", methods=["POST"])
def login():
    """
    Simple admin login.
    Body JSON: { "username": "...", "password": "..." }
    Returns: { "token": "..." } on success
    """
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = create_token(username)
        return jsonify({"token": token})
    else:
        return jsonify({"error": "Invalid credentials"}), 401


# ---------- Forecast APIs ----------

@app.route("/forecast", methods=["GET"])
def forecast():
    """
    Total demand forecast (single value)
    Example: GET /forecast?day_of_week=5&month=1
    """
    try:
        day_str = request.args.get("day_of_week", "0")
        month_str = request.args.get("month", "1")

        day = int(day_str)
        month = int(month_str)

        if day < 0 or day > 6:
            return jsonify({"error": "day_of_week must be between 0 and 6"}), 400
        if month < 1 or month > 12:
            return jsonify({"error": "month must be between 1 and 12"}), 400

        predicted_quantity = predict_demand(day, month)

        return jsonify({
            "day_of_week": day,
            "month": month,
            "predicted_quantity": predicted_quantity
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/item-forecast", methods=["GET"])
def item_forecast():
    """
    Item-wise demand forecast
    Example: GET /item-forecast?day_of_week=5&month=1
    """
    try:
        day_str = request.args.get("day_of_week", "0")
        month_str = request.args.get("month", "1")

        day = int(day_str)
        month = int(month_str)

        if day < 0 or day > 6:
            return jsonify({"error": "day_of_week must be between 0 and 6"}), 400
        if month < 1 or month > 12:
            return jsonify({"error": "month must be between 1 and 12"}), 400

        item_predictions = predict_item_demand(day, month)

        return jsonify({
            "day_of_week": day,
            "month": month,
            "items": item_predictions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- DB helper ----------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Simple DB APIs ----------

@app.route("/api/items", methods=["GET"])
def get_items():
    db = SessionLocal()
    try:
        items = db.query(Item).all()
        data = [
            {
                "id": item.id,
                "name": item.name,
                "category": item.category,
            }
            for item in items
        ]
        return jsonify(data)
    finally:
        db.close()


@app.route("/api/ingredients", methods=["GET"])
def get_ingredients():
    db = SessionLocal()
    try:
        ingredients = db.query(Ingredient).all()
        data = [
            {
                "id": ing.id,
                "name": ing.name,
                "unit": ing.unit,
                "current_stock": ing.current_stock,
                "reorder_level": ing.reorder_level,
            }
            for ing in ingredients
        ]
        return jsonify(data)
    finally:
        db.close()


@app.route("/api/ingredients/<int:ingredient_id>", methods=["PUT"])
@require_admin
def update_ingredient_stock(ingredient_id):
    """
    Update current_stock (and optionally reorder_level) of an ingredient.
    Body JSON example:
    {
      "current_stock": 10.5,
      "reorder_level": 3.0   # optional
    }
    """
    db = SessionLocal()
    try:
        ing = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ing:
            return jsonify({"error": "Ingredient not found"}), 404

        data = request.get_json() or {}

        if "current_stock" in data:
            try:
                ing.current_stock = float(data["current_stock"])
            except ValueError:
                return jsonify({"error": "current_stock must be a number"}), 400

        if "reorder_level" in data:
            try:
                ing.reorder_level = float(data["reorder_level"])
            except ValueError:
                return jsonify({"error": "reorder_level must be a number"}), 400

        db.commit()
        db.refresh(ing)

        return jsonify({
            "id": ing.id,
            "name": ing.name,
            "unit": ing.unit,
            "current_stock": ing.current_stock,
            "reorder_level": ing.reorder_level,
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@app.route("/api/recipes", methods=["GET"])
def get_recipes():
    db = SessionLocal()
    try:
        recipes = db.query(RecipeMap).all()
        data = []
        for r in recipes:
            data.append(
                {
                    "id": r.id,
                    "item_id": r.item_id,
                    "item_name": r.item.name if r.item else None,
                    "ingredient_id": r.ingredient_id,
                    "ingredient_name": r.ingredient.name if r.ingredient else None,
                    "quantity_per_item": r.quantity_per_item,
                }
            )
        return jsonify(data)
    finally:
        db.close()


@app.route("/api/recipes", methods=["POST"])
@require_admin
def create_recipe():
    """
    Create a new recipe mapping: which ingredient + how much per item.
    Body JSON:
    {
      "item_id": 1,
      "ingredient_id": 2,
      "quantity_per_item": 0.08
    }
    """
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        item_id = data.get("item_id")
        ingredient_id = data.get("ingredient_id")
        quantity_per_item = data.get("quantity_per_item")

        if not item_id or not ingredient_id or quantity_per_item is None:
            return jsonify({"error": "item_id, ingredient_id and quantity_per_item are required"}), 400

        # validate item and ingredient exist
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            return jsonify({"error": "Item not found"}), 404

        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ingredient:
            return jsonify({"error": "Ingredient not found"}), 404

        try:
            quantity_per_item = float(quantity_per_item)
        except ValueError:
            return jsonify({"error": "quantity_per_item must be a number"}), 400

        recipe = RecipeMap(
            item_id=item_id,
            ingredient_id=ingredient_id,
            quantity_per_item=quantity_per_item,
        )
        db.add(recipe)
        db.commit()
        db.refresh(recipe)

        return jsonify({
            "id": recipe.id,
            "item_id": recipe.item_id,
            "item_name": item.name,
            "ingredient_id": recipe.ingredient_id,
            "ingredient_name": ingredient.name,
            "quantity_per_item": recipe.quantity_per_item,
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@app.route("/api/recipes/<int:recipe_id>", methods=["PUT"])
@require_admin
def update_recipe(recipe_id):
    """
    Update quantity_per_item for an existing recipe mapping.
    Body JSON:
    {
      "quantity_per_item": 0.1
    }
    """
    db = SessionLocal()
    try:
        recipe = db.query(RecipeMap).filter(RecipeMap.id == recipe_id).first()
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        data = request.get_json() or {}
        if "quantity_per_item" in data:
            try:
                recipe.quantity_per_item = float(data["quantity_per_item"])
            except ValueError:
                return jsonify({"error": "quantity_per_item must be a number"}), 400

        db.commit()
        db.refresh(recipe)

        return jsonify({
            "id": recipe.id,
            "item_id": recipe.item_id,
            "item_name": recipe.item.name if recipe.item else None,
            "ingredient_id": recipe.ingredient_id,
            "ingredient_name": recipe.ingredient.name if recipe.ingredient else None,
            "quantity_per_item": recipe.quantity_per_item,
        })
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@app.route("/api/recipes/<int:recipe_id>", methods=["DELETE"])
@require_admin
def delete_recipe(recipe_id):
    db = SessionLocal()
    try:
        recipe = db.query(RecipeMap).filter(RecipeMap.id == recipe_id).first()
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        db.delete(recipe)
        db.commit()
        return jsonify({"message": "Recipe deleted"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@app.route("/api/stock-plan", methods=["GET"])
def stock_plan():
    """
    Example:
      GET /api/stock-plan?day_of_week=5&month=1

    1. Uses ML item-demand model to predict item-wise orders.
    2. Uses recipe_map + ingredients table to compute:
       - required_total per ingredient
       - need_to_buy (if shortage)
    """
    try:
        day_str = request.args.get("day_of_week", "0")
        month_str = request.args.get("month", "1")

        day = int(day_str)
        month = int(month_str)

        if day < 0 or day > 6:
            return jsonify({"error": "day_of_week must be between 0 and 6"}), 400
        if month < 1 or month > 12:
            return jsonify({"error": "month must be between 1 and 12"}), 400

        # 1) Get item-wise demand from ML model (now using month as well)
        item_predictions = predict_item_demand(day, month)
        # e.g. { "Pizza": 60.1, "Burger": 35.4, ... }

        db = SessionLocal()
        try:
            # 2) Load all items, ingredients, and recipes
            items = db.query(Item).all()
            ingredients = db.query(Ingredient).all()
            recipes = db.query(RecipeMap).all()

            # Helper maps
            item_name_to_id = {i.name.lower(): i.id for i in items}
            ingredient_id_to_obj = {ing.id: ing for ing in ingredients}

            # item_id -> list of (ingredient_id, quantity_per_item)
            item_recipes = {}
            for r in recipes:
                item_recipes.setdefault(r.item_id, []).append(
                    (r.ingredient_id, r.quantity_per_item)
                )

            # 3) Compute total required ingredients
            required_per_ingredient = {ing.id: 0.0 for ing in ingredients}

            for item_name, predicted_qty in item_predictions.items():
                item_name_lower = item_name.lower()
                item_id = item_name_to_id.get(item_name_lower)
                if not item_id:
                    # If ML item name doesn't exist in DB yet, skip
                    continue

                for ingredient_id, qty_per_item in item_recipes.get(item_id, []):
                    required_per_ingredient[ingredient_id] += predicted_qty * qty_per_item

            # 4) Build response list
            stock_plan_result = []
            for ing_id, required_total in required_per_ingredient.items():
                ing = ingredient_id_to_obj[ing_id]
                current_stock = ing.current_stock or 0
                shortage = required_total - current_stock
                need_to_buy = shortage if shortage > 0 else 0
                status = "Shortage" if need_to_buy > 0 else "Enough for predicted demand"

                stock_plan_result.append(
                    {
                        "ingredient_id": ing.id,
                        "ingredient_name": ing.name,
                        "unit": ing.unit,
                        "current_stock": current_stock,
                        "required_total": required_total,
                        "need_to_buy": need_to_buy,
                        "status": status,
                    }
                )

            return jsonify(
                {
                    "day_of_week": day,
                    "month": month,
                    "item_predictions": item_predictions,
                    "stock_plan": stock_plan_result,
                }
            )
        finally:
            db.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
