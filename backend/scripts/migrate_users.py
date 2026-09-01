import argparse
import sys
import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# Ensure the app package is accessible
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.db.base import Base
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.lifestyle_profile import LifestyleProfile
from app.models.roommate_preference import RoommatePreference
from app.models.accommodation_preference import AccommodationPreference
from app.models.location import Location
from app.models.chat import Conversation, Message

def get_engine(db_url):
    if not db_url:
        raise ValueError("Database URL cannot be empty")
    return create_engine(db_url)

def get_session(engine):
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return Session()

# Define the models we need to migrate in order of dependencies (parents first)
# User is the root.
MODELS_TO_MIGRATE = [
    UserProfile,
    LifestyleProfile,
    RoommatePreference,
    AccommodationPreference,
    Location,
    Conversation,
    Message,
]

def migrate_users(local_db_url, neon_db_url, dry_run=True):
    print(f"--- MIGRATION SCRIPT START (Dry Run: {dry_run}) ---")
    local_engine = get_engine(local_db_url)
    neon_engine = get_engine(neon_db_url)
    
    local_session = get_session(local_engine)
    neon_session = get_session(neon_engine)

    target_usernames = ['vanya123', 'aarushiiiiii28', 't_sharma']
    shell_usernames_to_delete = ['aarushii2805', 'aarushi.vv28']

    try:
        # 1. Identify users to delete in Neon
        neon_users_to_delete = neon_session.query(User).filter(User.username.in_(shell_usernames_to_delete)).all()
        print(f"\n[NEON] Found {len(neon_users_to_delete)} shell rows to delete: {[u.username for u in neon_users_to_delete]}")
        
        # 2. Identify users to migrate from Local
        local_users = local_session.query(User).filter(User.username.in_(target_usernames)).all()
        print(f"[LOCAL] Found {len(local_users)} real users to migrate: {[u.username for u in local_users]}")

        if dry_run:
            print("\n--- DRY RUN: Actions that WOULD be taken ---")
            
            # Deletions
            for user in neon_users_to_delete:
                print(f"DELETE User from Neon: id={user.id}, username={user.username}")
                
            # Insertions
            for user in local_users:
                print(f"\nINSERT User into Neon: id={user.id}, username={user.username}")
                # Fetch related data
                profile = local_session.query(UserProfile).filter(UserProfile.user_id == user.id).first()
                if profile:
                    print(f"  -> INSERT UserProfile: id={profile.id}")
                
                lifestyle = local_session.query(LifestyleProfile).filter(LifestyleProfile.user_id == user.id).first()
                if lifestyle:
                    print(f"  -> INSERT LifestyleProfile: id={lifestyle.id}")

                preferences = local_session.query(RoommatePreference).filter(RoommatePreference.user_id == user.id).first()
                if preferences:
                    print(f"  -> INSERT RoommatePreference: id={preferences.id}")
                    
                accom = local_session.query(AccommodationPreference).filter(AccommodationPreference.user_id == user.id).first()
                if accom:
                    print(f"  -> INSERT AccommodationPreference: id={accom.id}")

                location = local_session.query(Location).filter(Location.user_id == user.id).first()
                if location:
                    print(f"  -> INSERT Location: id={location.id}")

                # Note: Skipping chat tables in dry-run summary for brevity, but they will be copied in live run
                convs = local_session.query(Conversation).filter((Conversation.user_a_id == user.id) | (Conversation.user_b_id == user.id)).all()
                if convs:
                    print(f"  -> Found {len(convs)} Conversations")
            print("\n--- END DRY RUN ---")
            return

        # LIVE RUN
        print("\n--- LIVE RUN: Executing migration ---")
        
        # We delete shell rows
        for u in neon_users_to_delete:
            neon_session.delete(u)
        
        neon_session.flush() # Send deletes to DB before inserting
        print(f"Deleted {len(neon_users_to_delete)} shell rows in Neon.")

        # Re-attach and copy instances to neon session
        for user in local_users:
            # We use merge to insert the exact same row (with same PK) into the neon session
            # First, User table
            neon_session.merge(user)
            
            # Now related tables directly related by user_id (One-to-One)
            for model in [UserProfile, LifestyleProfile, RoommatePreference, AccommodationPreference, Location]:
                item = local_session.query(model).filter(model.user_id == user.id).first()
                if item:
                    neon_session.merge(item)

        # Conversations (process once globally to avoid duplicates)
        target_ids = [u.id for u in local_users]
        seen_conv_ids = set()
        
        for user in local_users:
            convs = local_session.query(Conversation).filter(
                (Conversation.user_a_id == user.id) | (Conversation.user_b_id == user.id)
            ).all()
            
            for conv in convs:
                if conv.id in seen_conv_ids:
                    continue
                
                # ONLY migrate conversation if BOTH users are being migrated, otherwise FK will fail
                if conv.user_a_id in target_ids and conv.user_b_id in target_ids:
                    neon_session.merge(conv)
                    seen_conv_ids.add(conv.id)
                    
                    # Messages
                    messages = local_session.query(Message).filter(Message.conversation_id == conv.id).all()
                    for msg in messages:
                        neon_session.merge(msg)

        # Commit everything as one atomic transaction
        neon_session.commit()
        print(f"Successfully migrated {len(local_users)} users and their related data to Neon.")

    except Exception as e:
        neon_session.rollback()
        print(f"\n[ERROR] Migration failed: {e}. Transaction rolled back.")
        raise
    finally:
        local_session.close()
        neon_session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate specific users from Local DB to Neon DB.")
    parser.add_argument("--local-url", required=True, help="Local PostgreSQL URL")
    parser.add_argument("--neon-url", required=True, help="Neon PostgreSQL URL")
    parser.add_argument("--live", action="store_true", help="Run the actual migration (default is dry-run)")
    args = parser.parse_args()

    migrate_users(args.local_url, args.neon_url, dry_run=not args.live)
