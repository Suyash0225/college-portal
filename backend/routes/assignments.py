from flask import Blueprint, request, jsonify, session
from datetime import datetime, timezone
from models import db, Assignment, Teacher, Subject

assignments_bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")


def require_admin():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


def parse_due_date(date_str):
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


@assignments_bp.route("/", methods=["GET"])
def get_assignments():
    assignments = Assignment.query.order_by(Assignment.due_date).all()
    return jsonify([a.to_dict() for a in assignments]), 200


@assignments_bp.route("/<int:assignment_id>", methods=["GET"])
def get_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    return jsonify(assignment.to_dict()), 200


@assignments_bp.route("/", methods=["POST"])
def create_assignment():
    err = require_admin()
    if err:
        return err

    data = request.get_json()
    title = data.get("title", "").strip()
    subject_id = data.get("subject_id")
    teacher_id = data.get("teacher_id")
    file_url = data.get("file_url", "").strip()
    due_date_str = data.get("due_date", "")

    if not title:
        return jsonify({"error": "Assignment title is required"}), 400
    if not due_date_str:
        return jsonify({"error": "Due date is required"}), 400

    due_date = parse_due_date(due_date_str)
    if not due_date:
        return jsonify({"error": "Invalid due date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM"}), 400

    if subject_id and not Subject.query.get(subject_id):
        return jsonify({"error": "Subject not found"}), 404
    if teacher_id and not Teacher.query.get(teacher_id):
        return jsonify({"error": "Teacher not found"}), 404

    assignment = Assignment(
        title=title,
        subject_id=subject_id or None,
        teacher_id=teacher_id or None,
        file_url=file_url or None,
        due_date=due_date,
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify(assignment.to_dict()), 201


@assignments_bp.route("/<int:assignment_id>", methods=["PUT"])
def update_assignment(assignment_id):
    err = require_admin()
    if err:
        return err

    assignment = Assignment.query.get_or_404(assignment_id)
    data = request.get_json()

    title = data.get("title", "").strip()
    subject_id = data.get("subject_id")
    teacher_id = data.get("teacher_id")
    file_url = data.get("file_url", "").strip()
    due_date_str = data.get("due_date", "")

    if not title:
        return jsonify({"error": "Assignment title is required"}), 400
    if not due_date_str:
        return jsonify({"error": "Due date is required"}), 400

    due_date = parse_due_date(due_date_str)
    if not due_date:
        return jsonify({"error": "Invalid due date format"}), 400

    if subject_id and not Subject.query.get(subject_id):
        return jsonify({"error": "Subject not found"}), 404
    if teacher_id and not Teacher.query.get(teacher_id):
        return jsonify({"error": "Teacher not found"}), 404

    assignment.title = title
    assignment.subject_id = subject_id or None
    assignment.teacher_id = teacher_id or None
    assignment.file_url = file_url or None
    assignment.due_date = due_date
    db.session.commit()
    return jsonify(assignment.to_dict()), 200


@assignments_bp.route("/<int:assignment_id>", methods=["DELETE"])
def delete_assignment(assignment_id):
    err = require_admin()
    if err:
        return err

    assignment = Assignment.query.get_or_404(assignment_id)
    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"message": "Assignment deleted"}), 200
