from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta, date
import io, json, os

from config import Config
from models import engine, init_db, User, Timesheet
from utils.pdf import render_timesheet_pdf

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# ✅ Flask 3: run init_db once at startup
with app.app_context():
    init_db()

# Initialize DB right after app is created
with app.app_context():
    init_db()

# ---------- AUTH ----------
@app.post('/api/auth/login')
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    with Session(engine) as s:
        user = s.scalar(select(User).where(User.email==email))
        if not user or not check_password_hash(user.password_hash, password):
            # if user doesn't exist, create it for demo
            if not user:
                user = User(email=email, password_hash=generate_password_hash(password), role='user')
                s.add(user); s.commit()
            else:
                return jsonify({"message":"Invalid credentials"}), 401
    access = create_access_token(identity=email, expires_delta=timedelta(hours=10))
    return jsonify({"access_token": access})

def current_user(session: Session):
    email = get_jwt_identity()
    return session.scalar(select(User).where(User.email==email))

# ---------- TIMESHEETS ----------
@app.get('/api/timesheets')
@jwt_required()
def list_timesheets():
    with Session(engine) as s:
        u = current_user(s)
        rows = s.scalars(select(Timesheet).where(Timesheet.user_id==u.id).order_by(Timesheet.id.desc())).all()
        items = [{
            "id": r.id,
            "week_start": r.week_start.isoformat(),
            "week_end": r.week_end.isoformat(),
            "total_hours": r.total_hours,
            "status": r.status
        } for r in rows]
        return jsonify({"items": items})

@app.post('/api/timesheets')
@jwt_required()
def create_timesheet():
    data = request.get_json() or {}
    entries = data.get('entries') or []
    if not entries:
        return jsonify({"message":"No entries provided"}), 400
    dates = [datetime.fromisoformat(e['date']).date() for e in entries]
    week_start, week_end = min(dates), max(dates)
    total = sum(float(e.get('hours') or 0) for e in entries)

    with Session(engine) as s:
        u = current_user(s)
        t = Timesheet(
            user_id=u.id,
            client=data.get('client') or Config.CUSTOMER_DEFAULT,
            manager=data.get('manager') or Config.MANAGER_DEFAULT,
            week_start=week_start,
            week_end=week_end,
            total_hours=total,
            status='draft',
            entries_json=json.dumps(entries, ensure_ascii=False)
        )
        s.add(t); s.commit()
        return jsonify({"id": t.id})

@app.get('/api/timesheets/<int:tid>')
@jwt_required()
def get_timesheet(tid):
    with Session(engine) as s:
        u = current_user(s)
        t = s.get(Timesheet, tid)
        if not t or t.user_id != u.id:
            return jsonify({"message":"Not found"}), 404
        return jsonify({
            "id": t.id,
            "client": t.client,
            "manager": t.manager,
            "week_start": t.week_start.isoformat(),
            "week_end": t.week_end.isoformat(),
            "total_hours": t.total_hours,
            "status": t.status,
            "entries": json.loads(t.entries_json)
        })

@app.get('/api/timesheets/<int:tid>/pdf')
def timesheet_pdf_public(tid):
    # allow token through query for simple download
    from flask_jwt_extended import verify_jwt_in_request, exceptions
    token = request.args.get('token')
    if token:
        try:
            verify_jwt_in_request(optional=True, locations=['query_string'])
        except exceptions.NoAuthorizationError:
            pass
    return timesheet_pdf(tid)

@app.get('/api/timesheets/<int:tid>/pdf')
@jwt_required(optional=True)
def timesheet_pdf(tid):
    with Session(engine) as s:
        t = s.get(Timesheet, tid)
        if not t:
            return jsonify({"message":"Not found"}), 404
        pdf_bytes = render_timesheet_pdf(t)
        fname = f"Claris-TS-{t.week_start.strftime('%m%d%y')}.pdf"
        return send_file(io.BytesIO(pdf_bytes), download_name=fname, as_attachment=True, mimetype='application/pdf')

@app.post('/api/timesheets/<int:tid>/submit')
@jwt_required()
def submit_timesheet(tid):
    with Session(engine) as s:
        u = current_user(s)
        t = s.get(Timesheet, tid)
        if not t or t.user_id != u.id:
            return jsonify({"message":"Not found"}), 404
        t.status = 'submitted'
        s.commit()
        # email feature could be added here if SMTP vars present
        return jsonify({"message":"Submitted"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
