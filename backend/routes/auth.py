import os
import time
import datetime
from collections import defaultdict
from flask import Blueprint, request, jsonify, session, current_app, g
import bcrypt
from jose import jwt as jose_jwt
from models import db, Admin

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ── Brute-force protection ────────────────────────────────────────────────────
_failed = defaultdict(list)   # {ip: [timestamps]}
MAX_ATTEMPTS   = 5            # lock after 5 wrong attempts
LOCKOUT_SECS   = 300          # 5-minute lockout


def _client_ip():
    return request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()


def _is_locked(ip):
    now = time.time()
    _failed[ip] = [t for t in _failed[ip] if now - t < LOCKOUT_SECS]
    return len(_failed[ip]) >= MAX_ATTEMPTS


def _record_fail(ip):
    _failed[ip].append(time.time())


def _clear_fail(ip):
    _failed.pop(ip, None)


# ── Seed ──────────────────────────────────────────────────────────────────────
def seed_admin():
    if not Admin.query.first():
        default_pw = os.environ.get("ADMIN_PASSWORD", "Admin@Portal#2024")
        hashed = bcrypt.hashpw(default_pw.encode(), bcrypt.gensalt())
        admin = Admin(username="admin", password_hash=hashed.decode("utf-8"))
        db.session.add(admin)
        db.session.commit()
        print(f"[seed] Admin created. Password from ADMIN_PASSWORD env var (or default).")


# ── Routes ────────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    ip = _client_ip()

    if _is_locked(ip):
        remaining = int(LOCKOUT_SECS - (time.time() - _failed[ip][0]))
        return jsonify({"error": f"Too many failed attempts. Try again in {remaining // 60}m {remaining % 60}s."}), 429

    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not bcrypt.checkpw(password.encode(), admin.password_hash.encode()):
        _record_fail(ip)
        left = MAX_ATTEMPTS - len(_failed[ip])
        msg = "Invalid credentials"
        if left <= 2:
            msg += f" — {left} attempt{'s' if left != 1 else ''} left before lockout"
        return jsonify({"error": msg}), 401

    _clear_fail(ip)
    session["admin_id"] = admin.id
    session.permanent = True

    token = jose_jwt.encode(
        {"admin_id": admin.id, "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)},
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )
    return jsonify({"message": "Login successful", "admin": admin.to_dict(), "token": token}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    admin_id = g.get("admin_id") or session.get("admin_id")
    if not admin_id:
        return jsonify({"error": "Not authenticated"}), 401
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify({"admin": admin.to_dict()}), 200
