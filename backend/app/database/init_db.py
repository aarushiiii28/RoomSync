from sqlalchemy import text

from app.database.session import engine


def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))

        print("\n✅ Connected Successfully!\n")
        print(result.fetchone())


if __name__ == "__main__":
    test_connection()