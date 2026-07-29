from app.db.database import engine
from app.db.base import Base

import app.models

print("Connected successfully!")
print(Base.metadata.tables.keys())