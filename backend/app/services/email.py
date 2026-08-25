import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import httpx

from app.core.config import settings

logger = logging.getLogger("roomsync.email")


def send_verification_email(to_email: str, otp_code: str) -> bool:
    """
    Send a professional 6-digit OTP verification email to the user via Resend or SMTP.

    - If RESEND_API_KEY is configured, sends via Resend.
    - If SMTP_USER / SMTP_HOST is configured, sends via SMTP (e.g. Gmail SMTP).
    - Otherwise logs the OTP safely in development.
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

    # Option 1: Send via Resend
    if api_key:
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
                logger.info("Successfully sent verification email via Resend to %s", to_email)
                return True
            else:
                logger.error(
                    "Resend API error (%s): %s", response.status_code, response.text
                )
                return False
        except Exception as e:
            logger.error("Failed to deliver email via Resend to %s: %s", to_email, str(e))
            return False

    # Option 2: Send via SMTP (e.g. Gmail App Password)
    if settings.SMTP_HOST or settings.SMTP_USER:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_USER or settings.EMAIL_FROM
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            host = settings.SMTP_HOST or "smtp.gmail.com"
            port = settings.SMTP_PORT or 587
            with smtplib.SMTP(host, port, timeout=10) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], [to_email], msg.as_string())
            logger.info("Successfully sent email via SMTP to %s", to_email)
            return True
        except Exception as smtp_err:
            logger.error("Failed to deliver email via SMTP to %s: %s", to_email, str(smtp_err))
            return False

    # Option 3: Development Mode Simulation
    logger.info(
        "[DEV MODE] Email credentials not set. Simulated sending OTP code [%s] to %s",
        otp_code,
        to_email,
    )
    return True
