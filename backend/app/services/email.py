import logging
from typing import Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("roomsync.email")


def send_verification_email(to_email: str, otp_code: str) -> bool:
    """
    Send a professional 6-digit OTP verification email to the user via Resend.

    If RESEND_API_KEY is not configured (e.g. during offline development or testing),
    the email dispatch is safely simulated and logged for development convenience.
    """
    subject = "Verify your RoomSync email"
    html_content = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f7;
            color: #333333;
            margin: 0;
            padding: 24px;
          }}
          .container {{
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 36px;
            border: 1px solid #e6e6ec;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }}
          .logo {{
            font-size: 20px;
            font-weight: 700;
            color: #2D3246;
            letter-spacing: -0.5px;
            margin-bottom: 24px;
          }}
          h1 {{
            font-size: 22px;
            font-weight: 600;
            color: #111827;
            margin-top: 0;
            margin-bottom: 12px;
          }}
          p {{
            font-size: 15px;
            line-height: 1.6;
            color: #4b5563;
            margin-top: 0;
            margin-bottom: 20px;
          }}
          .otp-card {{
            background: #F8ECE8;
            border: 1.5px solid #EBD6CF;
            border-radius: 10px;
            text-align: center;
            padding: 20px;
            margin: 28px 0;
          }}
          .otp-code {{
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #2D3246;
            font-family: 'Courier New', Courier, monospace;
          }}
          .footer {{
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
            margin-top: 28px;
            line-height: 1.5;
          }}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">RoomSync</div>
          <h1>Verify your email</h1>
          <p>Welcome to RoomSync! Use the verification code below to verify your email address and activate your account:</p>
          
          <div class="otp-card">
            <div class="otp-code">{otp_code}</div>
          </div>
          
          <p>This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
          
          <div class="footer">
            If you did not create a RoomSync account, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
    """

    text_content = (
        f"RoomSync\n\n"
        f"Verify your email\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
        f"If you did not create a RoomSync account, you can safely ignore this email.\n"
    )

    api_key = settings.RESEND_API_KEY.strip() if settings.RESEND_API_KEY else ""

    if not api_key:
        logger.info(
            "[DEV MODE] Resend API key not set. Simulated sending OTP email to %s",
            to_email,
        )
        return True

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content,
            },
            timeout=10.0,
        )

        if response.status_code >= 200 and response.status_code < 300:
            logger.info("Successfully sent verification email to %s", to_email)
            return True
        else:
            logger.error(
                "Resend API error (%s): %s", response.status_code, response.text
            )
            return False

    except Exception as e:
        logger.error("Failed to deliver email to %s: %s", to_email, str(e))
        return False
