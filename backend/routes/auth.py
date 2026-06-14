from flask import Blueprint, request, jsonify, session
import bcrypt
from models import db, Admin

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def seed_admin():
    """Create default admin if none exists."""
    if not Admin.query.first():
        hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt())
        admin = Admin(username="admin", password_hash=hashed.decode("utf-8"))
        db.session.add(admin)
        db.session.commit()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), admin.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    session["admin_id"] = admin.id
    return jsonify({"message": "Login successful", "admin": admin.to_dict()}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("admin_id", None)
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    admin_id = session.get("admin_id")
    if not admin_id:
        return jsonify({"error": "Not authenticated"}), 401
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify({"admin": admin.to_dict()}), 200
