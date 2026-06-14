from flask import Blueprint, request, jsonify, session
from models import db, Teacher

teachers_bp = Blueprint("teachers", __name__, url_prefix="/api/teachers")


def require_admin():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


@teachers_bp.route("/", methods=["GET"])
def get_teachers():
    teachers = Teacher.query.order_by(Teacher.name).all()
    return jsonify([t.to_dict() for t in teachers]), 200


@teachers_bp.route("/<int:teacher_id>", methods=["GET"])
def get_teacher(teacher_id):
    teacher = Teacher.query.get_or_404(teacher_id)
    return jsonify(teacher.to_dict()), 200


@teachers_bp.route("/", methods=["POST"])
def create_teacher():
    err = require_admin()
    if err:
        return err

    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower() or None

    if not name:
        return jsonify({"error": "Teacher name is required"}), 400

    if email and Teacher.query.filter_by(email=email).first():
        return jsonify({"error": "A teacher with this email already exists"}), 409

    teacher = Teacher(name=name, email=email)
    db.session.add(teacher)
    db.session.commit()
    return jsonify(teacher.to_dict()), 201


@teachers_bp.route("/<int:teacher_id>", methods=["PUT"])
def update_teacher(teacher_id):
    err = require_admin()
    if err:
        return err

    teacher = Teacher.query.get_or_404(teacher_id)
    data = request.get_json()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower() or None

    if not name:
        return jsonify({"error": "Teacher name is required"}), 400

    if email:
        existing = Teacher.query.filter_by(email=email).first()
        if existing and existing.id != teacher_id:
            return jsonify({"error": "A teacher with this email already exists"}), 409

    teacher.name = name
    teacher.email = email
    db.session.commit()
    return jsonify(teacher.to_dict()), 200


@teachers_bp.route("/<int:teacher_id>", methods=["DELETE"])
def delete_teacher(teacher_id):
    err = require_admin()
    if err:
        return err

    teacher = Teacher.query.get_or_404(teacher_id)
    db.session.delete(teacher)
    db.session.commit()
    return jsonify({"message": "Teacher deleted"}), 200
