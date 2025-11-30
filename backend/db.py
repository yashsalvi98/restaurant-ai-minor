from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# For now we use SQLite file in backend folder
DATABASE_URL = "sqlite:///restaurant_ai.db"

engine = create_engine(
    DATABASE_URL,
    echo=False,          # set True if you want SQL logs
    future=True
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=True)

    recipes = relationship("RecipeMap", back_populates="item")

    def __repr__(self):
        return f"<Item {self.name}>"


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    unit = Column(String(20), nullable=False)  # kg, g, pcs, ml
    current_stock = Column(Float, default=0.0)  # current quantity
    reorder_level = Column(Float, default=0.0)  # optional threshold

    recipes = relationship("RecipeMap", back_populates="ingredient")

    def __repr__(self):
        return f"<Ingredient {self.name}>"


class RecipeMap(Base):
    __tablename__ = "recipe_map"

    id = Column(Integer, primary_key=True, index=True)

    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)

    quantity_per_item = Column(Float, nullable=False)  # in ingredient.unit

    item = relationship("Item", back_populates="recipes")
    ingredient = relationship("Ingredient", back_populates="recipes")

    def __repr__(self):
        return (
            f"<Recipe item_id={self.item_id} "
            f"ingredient_id={self.ingredient_id} "
            f"qty={self.quantity_per_item}>"
        )


def init_db():
    """Create tables (if not exist)."""
    Base.metadata.create_all(bind=engine)
