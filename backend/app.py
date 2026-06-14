import os
from flask import Flask
from flask_cors import CORS
from sqlalchemy import text
from models import db
from routes.auth import auth_bp, seed_admin
from routes.teachers import teachers_bp
from routes.subjects import subjects_bp
from routes.assignments import assignments_bp
from routes.resources import resources_bp
from routes.announcements import announcements_bp
from routes.submissions import submissions_bp

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def run_migrations(app):
    """Apply pending schema changes that db.create_all() won't handle."""
    with app.app_context():
        with db.engine.connect() as conn:
            # Migration tracking table
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)"
            ))
            conn.commit()

            # v1 — make teachers.email nullable
            if not conn.execute(
                text("SELECT 1 FROM _migrations WHERE name='v1_teachers_email_nullable'")
            ).fetchone():
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                conn.execute(text("DROP TABLE IF EXISTS _teachers_new"))
                conn.execute(text("""
                    CREATE TABLE _teachers_new (
                        id       INTEGER PRIMARY KEY AUTOINCREMENT,
                        name     VARCHAR(100) NOT NULL,
                        email    VARCHAR(150)  UNIQUE,
                        created_at DATETIME
                    )
                """))
                conn.execute(text(
                    "INSERT INTO _teachers_new (id, name, email, created_at) "
                    "SELECT id, name, email, created_at FROM teachers"
                ))
                conn.execute(text("DROP TABLE teachers"))
                conn.execute(text("ALTER TABLE _teachers_new RENAME TO teachers"))
                conn.execute(text("PRAGMA foreign_keys=ON"))
                conn.execute(text(
                    "INSERT INTO _migrations VALUES ('v1_teachers_email_nullable')"
                ))
                conn.commit()
                print("[migration] v1_teachers_email_nullable applied")


def create_app():
    app = Flask(__name__)

    is_production = bool(os.environ.get("RENDER"))

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'assignments.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None" if is_production else "Lax"
    app.config["SESSION_COOKIE_SECURE"] = is_production

    raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [o.strip() for o in raw_origins.split(",")]
    CORS(app, supports_credentials=True, origins=allowed_origins)

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(teachers_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(announcements_bp)
    app.register_blueprint(submissions_bp)

    with app.app_context():
        db.create_all()
        seed_admin()

    run_migrations(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)
