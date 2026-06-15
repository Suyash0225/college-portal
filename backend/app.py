import os
from flask import Flask
from flask_cors import CORS
from models import db
from routes.auth import auth_bp, seed_admin
from routes.teachers import teachers_bp
from routes.subjects import subjects_bp
from routes.assignments import assignments_bp
from routes.resources import resources_bp
from routes.announcements import announcements_bp
from routes.submissions import submissions_bp

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def create_app():
    app = Flask(__name__)

    is_production = bool(os.environ.get("RENDER"))

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

    database_url = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'assignments.db')}")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "None" if is_production else "Lax"
    app.config["SESSION_COOKIE_SECURE"] = is_production

    raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    allowed_origins = [o.strip() for o in raw_origins.split(",")]
    CORS(app,
         supports_credentials=True,
         origins=allowed_origins,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    db.init_app(app)

    @app.before_request
    def load_token():
        from flask import request as req, session as sess, g as fg
        auth = req.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            try:
                from jose import jwt as jose_jwt
                payload = jose_jwt.decode(auth[7:], app.config["SECRET_KEY"], algorithms=["HS256"])
                admin_id = payload.get("admin_id")
                fg.admin_id = admin_id
                sess["admin_id"] = admin_id
            except Exception:
                fg.admin_id = None
        else:
            from flask import g as fg
            fg.admin_id = sess.get("admin_id")

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

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)
