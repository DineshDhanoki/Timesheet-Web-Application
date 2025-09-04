# Timesheet Pro — Full‑Stack Web App

Professional, big‑tech‑style timesheet portal with:
- React + Tailwind frontend
- Flask + SQLite backend
- JWT login (demo account auto‑created)
- PDF generation via WeasyPrint
- History of submissions

## Quick Start (Local)

### 1) Backend
```bash
cd backend
python -m venv .venv && . .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on http://127.0.0.1:8000

### 2) Frontend
```bash
cd ../frontend
npm i
npm run dev
```
Frontend runs on http://127.0.0.1:5173 and proxies /api to the backend.

## Login
Use any email & password on first login, account is auto‑created (demo). Example:
- Email: dinesh@example.com
- Password: password

## Generate PDF
- Fill the weekly entries → “Generate PDF”. A file will download with the week’s range.

## Notes
- WeasyPrint may need OS packages (Debian/Ubuntu: `apt install libpango-1.0-0 libcairo2 libffi-dev` etc.).
- To switch PDF engine, replace `utils/pdf.py` with xhtml2pdf or reportlab version.
- Configure SMTP env vars in `config.py` if you’d like to auto‑email submissions later.
