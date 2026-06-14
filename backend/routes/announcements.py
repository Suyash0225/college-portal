from flask import Blueprint, request, jsonify, session
from models import db, Announcement

announcements_bp = Blueprint("announcements", __name__, url_prefix="/api/announcements")

VALID_TYPES = {"info", "warning", "success", "urgent"}


def require_admin():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


@announcements_bp.route("/", methods=["GET"])
def get_announcements():
    items = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify([a.to_dict() for a in items]), 200


@announcements_bp.route("/<int:ann_id>", methods=["GET"])
def get_announcement(ann_id):
    ann = Announcement.query.get_or_404(ann_id)
    return jsonify(ann.to_dict()), 200


@announcements_bp.route("/", methods=["POST"])
def create_announcement():
    err = require_admin()
    if err:
        return err

    data = request.get_json()
    title   = data.get("title", "").strip()
    content = data.get("content", "").strip()
    atype   = data.get("type", "info").strip().lower()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not content:
        return jsonify({"error": "Content is required"}), 400
    if atype not in VALID_TYPES:
        atype = "info"

    ann = Announcement(title=title, content=content, type=atype)
    db.session.add(ann)
    db.session.commit()
    return jsonify(ann.to_dict()), 201


@announcements_bp.route("/<int:ann_id>", methods=["PUT"])
def update_announcement(ann_id):
    err = require_admin()
    if err:
        return err

    ann  = Announcement.query.get_or_404(ann_id)
    data = request.get_json()
    title   = data.get("title", "").strip()
    content = data.get("content", "").strip()
    atype   = data.get("type", "info").strip().lower()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not content:
        return jsonify({"error": "Content is required"}), 400
    if atype not in VALID_TYPES:
        atype = "info"

    ann.title   = title
    ann.content = content
    ann.type    = atype
    db.session.commit()
    return jsonify(ann.to_dict()), 200


@announcements_bp.route("/<int:ann_id>", methods=["DELETE"])
def delete_announcement(ann_id):
    err = require_admin()
    if err:
        return err

    ann = Announcement.query.get_or_404(ann_id)
    db.session.delete(ann)
    db.session.commit()
    return jsonify({"message": "Announcement deleted"}), 200
