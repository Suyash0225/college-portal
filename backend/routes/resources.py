from flask import Blueprint, request, jsonify, session
from models import db, Resource, Subject

resources_bp = Blueprint("resources", __name__, url_prefix="/api/resources")

VALID_TYPES = {"pdf", "youtube", "drive", "other"}


def require_admin():
    if not session.get("admin_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


@resources_bp.route("/", methods=["GET"])
def get_resources():
    resources = Resource.query.order_by(Resource.title).all()
    return jsonify([r.to_dict() for r in resources]), 200


@resources_bp.route("/<int:resource_id>", methods=["GET"])
def get_resource(resource_id):
    resource = Resource.query.get_or_404(resource_id)
    return jsonify(resource.to_dict()), 200


@resources_bp.route("/", methods=["POST"])
def create_resource():
    err = require_admin()
    if err:
        return err

    data = request.get_json()
    subject_id = data.get("subject_id")
    title = data.get("title", "").strip()
    resource_url = data.get("resource_url", "").strip()
    rtype = data.get("type", "other").strip().lower()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not resource_url:
        return jsonify({"error": "Resource URL is required"}), 400
    if rtype not in VALID_TYPES:
        rtype = "other"

    if subject_id and not Subject.query.get(subject_id):
        return jsonify({"error": "Subject not found"}), 404

    resource = Resource(
        subject_id=subject_id or None,
        title=title,
        resource_url=resource_url,
        type=rtype,
    )
    db.session.add(resource)
    db.session.commit()
    return jsonify(resource.to_dict()), 201


@resources_bp.route("/<int:resource_id>", methods=["PUT"])
def update_resource(resource_id):
    err = require_admin()
    if err:
        return err

    resource = Resource.query.get_or_404(resource_id)
    data = request.get_json()

    subject_id = data.get("subject_id")
    title = data.get("title", "").strip()
    resource_url = data.get("resource_url", "").strip()
    rtype = data.get("type", "other").strip().lower()

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not resource_url:
        return jsonify({"error": "Resource URL is required"}), 400
    if rtype not in VALID_TYPES:
        rtype = "other"

    if subject_id and not Subject.query.get(subject_id):
        return jsonify({"error": "Subject not found"}), 404

    resource.subject_id = subject_id or None
    resource.title = title
    resource.resource_url = resource_url
    resource.type = rtype
    db.session.commit()
    return jsonify(resource.to_dict()), 200


@resources_bp.route("/<int:resource_id>", methods=["DELETE"])
def delete_resource(resource_id):
    err = require_admin()
    if err:
        return err

    resource = Resource.query.get_or_404(resource_id)
    db.session.delete(resource)
    db.session.commit()
    return jsonify({"message": "Resource deleted"}), 200
