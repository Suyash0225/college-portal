from flask import Blueprint, request, jsonify, session
from models import db, Subject, Teacher

subjects_bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


def require_admin():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


@subjects_bp.route("/", methods=["GET"])
def get_subjects():
    subjects = Subject.query.order_by(Subject.name).all()
    return jsonify([s.to_dict() for s in subjects]), 200


@subjects_bp.route("/<int:subject_id>", methods=["GET"])
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/", methods=["POST"])
def create_subject():
    err = require_admin()
    if err:
        return err

    data = request.get_json()
    name = data.get("name", "").strip()
    teacher_id = data.get("teacher_id")

    if not name:
        return jsonify({"error": "Subject name is required"}), 400

    if teacher_id:
        if not Teacher.query.get(teacher_id):
            return jsonify({"error": "Teacher not found"}), 404

    subject = Subject(name=name, teacher_id=teacher_id or None)
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict()), 201


@subjects_bp.route("/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id):
    err = require_admin()
    if err:
        return err

    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()

    name = data.get("name", "").strip()
    teacher_id = data.get("teacher_id")

    if not name:
        return jsonify({"error": "Subject name is required"}), 400

    if teacher_id:
        if not Teacher.query.get(teacher_id):
            return jsonify({"error": "Teacher not found"}), 404

    subject.name = name
    subject.teacher_id = teacher_id or None
    db.session.commit()
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    err = require_admin()
    if err:
        return err

    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted"}), 200
