from db import Base, engine, SessionLocal, Item, Ingredient, RecipeMap, init_db

def seed_data():
    session = SessionLocal()
    try:
        # Only seed if tables are empty
        if session.query(Item).count() == 0:
            # Sample items (you can rename later)
            pizza = Item(name="Pizza", category="Main")
            burger = Item(name="Burger", category="Main")
            pasta = Item(name="Pasta", category="Main")
            fries = Item(name="Fries", category="Side")

            session.add_all([pizza, burger, pasta, fries])
            session.flush()  # to get IDs

            # Sample ingredients
            base = Ingredient(name="Pizza Base", unit="pcs", current_stock=60, reorder_level=20)
            cheese = Ingredient(name="Cheese", unit="kg", current_stock=6, reorder_level=2)
            sauce = Ingredient(name="Tomato Sauce", unit="kg", current_stock=4, reorder_level=1.5)
            veggies = Ingredient(name="Veg Toppings", unit="kg", current_stock=5, reorder_level=2)

            session.add_all([base, cheese, sauce, veggies])
            session.flush()

            # Map: which item uses which ingredient
            # Example recipe mapping (same logic as we used in frontend)
            recipes = [
                # Pizza
                RecipeMap(item_id=pizza.id, ingredient_id=base.id, quantity_per_item=1.0),
                RecipeMap(item_id=pizza.id, ingredient_id=cheese.id, quantity_per_item=0.08),
                RecipeMap(item_id=pizza.id, ingredient_id=sauce.id, quantity_per_item=0.06),
                RecipeMap(item_id=pizza.id, ingredient_id=veggies.id, quantity_per_item=0.05),

                # Burger
                RecipeMap(item_id=burger.id, ingredient_id=cheese.id, quantity_per_item=0.03),
                RecipeMap(item_id=burger.id, ingredient_id=veggies.id, quantity_per_item=0.02),

                # Pasta
                RecipeMap(item_id=pasta.id, ingredient_id=cheese.id, quantity_per_item=0.04),
                RecipeMap(item_id=pasta.id, ingredient_id=sauce.id, quantity_per_item=0.07),

                # Fries (no shared ingredients in this simple example)
            ]

            session.add_all(recipes)
            session.commit()
            print("✅ Seed data inserted.")
        else:
            print("DB already has data, skipping seeding.")
    finally:
        session.close()


if __name__ == "__main__":
    print("Creating tables (if needed)...")
    init_db()
    seed_data()
    print("Done.")
