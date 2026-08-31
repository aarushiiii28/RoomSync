import pytest
from uuid import uuid4

from app.db.database import SessionLocal
from app.models.user import User
from app.models.chat import Conversation, Message
from app.services.chat import save_message

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_chat_save_message_idempotency(db_session):
    # Setup test users
    user_a = User(email="test_a_idem@test.com", username="test_a_idem", password_hash="hash")
    user_b = User(email="test_b_idem@test.com", username="test_b_idem", password_hash="hash")
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_a)
    db_session.refresh(user_b)
    
    conv = Conversation(user_a_id=user_a.id, user_b_id=user_b.id)
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    client_id = uuid4()
    
    # First save
    msg1 = save_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=user_a.id,
        content="Hello!",
        client_id=client_id
    )
    assert msg1.client_id == client_id
    
    # Second save with same client_id
    msg2 = save_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=user_a.id,
        content="Hello again!", # content differs but client_id matches
        client_id=client_id
    )
    
    # Should return the exact same record due to idempotency
    assert msg1.id == msg2.id
    assert msg2.content == "Hello!"
    
    # Verify count in DB
    count = db_session.query(Message).filter(Message.conversation_id == conv.id).count()
    assert count == 1
    
    # Cleanup
    db_session.delete(conv)
    db_session.delete(user_a)
    db_session.delete(user_b)
    db_session.commit()
