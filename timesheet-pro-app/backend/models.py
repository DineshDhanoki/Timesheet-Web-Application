from datetime import datetime, date
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column, Session
from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=Config.SQLALCHEMY_ECHO)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default='user')  # 'user' or 'manager'

class Timesheet(Base):
    __tablename__ = 'timesheets'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    client: Mapped[str] = mapped_column(String)
    manager: Mapped[str] = mapped_column(String)
    week_start: Mapped[date] = mapped_column(Date)
    week_end: Mapped[date] = mapped_column(Date)
    total_hours: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String, default='draft')  # draft/submitted/approved/rejected
    entries_json: Mapped[str] = mapped_column(Text)  # store as JSON string

    user = relationship('User')

def init_db():
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        # bootstrap demo user if not exists
        from sqlalchemy import select
        if not s.scalar(select(User).where(User.email=='dinesh@example.com')):
            from werkzeug.security import generate_password_hash
            u = User(email='dinesh@example.com', password_hash=generate_password_hash('password'), role='user')
            s.add(u)
            s.commit()
