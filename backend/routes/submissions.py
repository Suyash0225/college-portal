from flask import Blueprint, request, jsonify, session
from models import db, Submission, Assignment

submissions_bp = Blueprint("submissions", __name__, url_prefix="/api/submissions")


@submissions_bp.route("/assignment/<int:assignment_id>", methods=["POST"])
def submit(assignment_id):
    Assignment.query.get_or_404(assignment_id)
    data = request.get_json() or {}
    name = data.get("student_name", "").strip()
    roll = data.get("roll_number", "").strip()
    import re
    if not name or not roll:
        return jsonify({"error": "Name and roll number are required"}), 400
    if not re.match(r"^[A-Za-z\s]+$", name):
        return jsonify({"error": "Name must contain only letters"}), 400
    existing = Submission.query.filter_by(assignment_id=assignment_id, roll_number=roll).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    s = Submission(assignment_id=assignment_id, student_name=name, roll_number=roll)
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@submissions_bp.route("/assignment/<int:assignment_id>", methods=["GET"])
def get_by_assignment(assignment_id):
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    subs = (Submission.query
            .filter_by(assignment_id=assignment_id)
            .order_by(Submission.submitted_at.desc())
            .all())
    return jsonify([s.to_dict() for s in subs])


@submissions_bp.route("/", methods=["GET"])
def get_all():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    subs = Submission.query.order_by(Submission.submitted_at.desc()).all()
    result = []
    for s in subs:
        d = s.to_dict()
        a = Assignment.query.get(s.assignment_id)
        d["assignment_title"] = a.title if a else "—"
        d["subject_name"] = (a.subject.name if a and a.subject else None)
        d["teacher_name"] = (a.teacher.name if a and a.teacher else None)
        result.append(d)
    return jsonify(result)


@submissions_bp.route("/counts", methods=["GET"])
def get_counts():
    """Public endpoint: returns {assignment_id: count} map."""
    from sqlalchemy import func
    rows = db.session.query(
        Submission.assignment_id,
        func.count(Submission.id).label("cnt")
    ).group_by(Submission.assignment_id).all()
    return jsonify({r.assignment_id: r.cnt for r in rows})
