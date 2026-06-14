from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    subjects = db.relationship("Subject", backref="teacher", lazy=True, cascade="all, delete-orphan")
    assignments = db.relationship("Assignment", backref="teacher", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    assignments = db.relationship("Assignment", backref="subject", lazy=True, cascade="all, delete-orphan")
    resources = db.relationship("Resource", backref="subject", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.name if self.teacher else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=True)
    file_url = db.Column(db.String(500), nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def get_status(self):
        now = datetime.now(timezone.utc)
        due = self.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return "Active" if now <= due else "Expired"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.name if self.teacher else None,
            "file_url": self.file_url,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.get_status(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Resource(db.Model):
    __tablename__ = "resources"

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    resource_url = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(50), nullable=False, default="other")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "title": self.title,
            "resource_url": self.resource_url,
            "type": self.type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False, default="info")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "type": self.type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    roll_number = db.Column(db.String(50), nullable=False)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("assignment_id", "roll_number", name="uq_submission"),)

    def to_dict(self):
        return {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "student_name": self.student_name,
            "roll_number": self.roll_number,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def to_dict(self):
        return {"id": self.id, "username": self.username}
