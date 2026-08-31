"""
AWS Cognito Pre Sign-up Lambda Trigger: Account Linking for Federated Identities (Google)

Official AWS Reference Pattern:
https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation-consolidate-users.html

Trigger: PreSignUp_ExternalProvider
Runtime: Python 3.11 or 3.12
"""

import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cognito_client = boto3.client("cognito-idp")


def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

    trigger_source = event.get("triggerSource")
    user_pool_id = event.get("userPoolId")
    user_attributes = event.get("request", {}).get("userAttributes", {})
    email = user_attributes.get("email")

    if trigger_source == "PreSignUp_ExternalProvider":
        if not email:
            logger.warning("No email found in external provider claims.")
            return event

        clean_email = email.strip().lower()
        google_email_verified = str(user_attributes.get("email_verified", "")).lower() == "true"

        # 1. Search for an existing user with the same email
        try:
            response = cognito_client.list_users(
                UserPoolId=user_pool_id,
                Filter=f'email = "{clean_email}"',
                Limit=10,
            )
            users = response.get("Users", [])
        except Exception as exc:
            logger.error("Error calling list_users: %s", exc)
            raise exc

        # 2. Look for a native (non-external) Cognito user
        native_user = None
        for user in users:
            username = user.get("Username", "")
            # Check user attributes for identities or external username prefix
            attrs = {a["Name"]: a["Value"] for a in user.get("Attributes", [])}
            has_identities = bool(attrs.get("identities"))
            is_external_prefix = any(
                username.lower().startswith(prefix)
                for prefix in ("google_", "facebook_", "amazon_", "apple_", "cognito_")
            )
            
            if not has_identities and not is_external_prefix:
                native_user = user
                break

        # 3. Extract provider details (e.g. Provider: "Google", ProviderUserId: "106945830433916501498")
        provider_name = "Google"
        provider_user_id = None

        # Check if 'identities' attribute is present in userAttributes
        identities_raw = user_attributes.get("identities")
        if identities_raw:
            try:
                identities_list = json.loads(identities_raw) if isinstance(identities_raw, str) else identities_raw
                if identities_list and isinstance(identities_list, list):
                    first_identity = identities_list[0]
                    provider_name = first_identity.get("providerName") or provider_name
                    provider_user_id = first_identity.get("userId")
            except Exception as e:
                logger.warning("Could not parse identities JSON: %s", e)

        # Fallback to event['userName'] (e.g. 'Google_106945830433916501498')
        if not provider_user_id:
            full_username = event.get("userName", "")
            if "_" in full_username:
                p_name, p_id = full_username.split("_", 1)
                provider_name = p_name
                provider_user_id = p_id
            else:
                provider_user_id = full_username

        # Normalize ProviderName casing (Cognito configured provider name is "Google")
        if provider_name.lower() == "google":
            provider_name = "Google"

        # 4. If an existing native account is found and Google verified the email, link it!
        if native_user:
            if not google_email_verified:
                logger.warning(
                    "Matching native account found for %s, but Google email_verified is not true. Skipping link for security.",
                    clean_email,
                )
            else:
                native_username = native_user["Username"]
                logger.info(
                    "Found existing native user '%s' for verified email '%s'. Linking provider '%s' with id '%s'...",
                    native_username,
                    clean_email,
                    provider_name,
                    provider_user_id,
                )

                try:
                    cognito_client.admin_link_provider_for_user(
                        UserPoolId=user_pool_id,
                        DestinationUser={
                            "ProviderName": "Cognito",
                            "ProviderAttributeValue": native_username,
                        },
                        SourceUser={
                            "ProviderName": provider_name,
                            "ProviderAttributeName": "Cognito_Subject",
                            "ProviderAttributeValue": provider_user_id,
                        },
                    )
                    logger.info(
                        "Successfully linked %s user %s to Cognito user %s",
                        provider_name,
                        provider_user_id,
                        native_username,
                    )
                except Exception as link_err:
                    logger.error("Failed to link provider: %s", link_err)
                    raise link_err
        else:
            logger.info("No existing native account found for email %s. Creating new federated user.", clean_email)

        # 5. Auto-confirm user; auto-verify email only if verified by the upstream identity provider
        event["response"]["autoConfirmUser"] = True
        event["response"]["autoVerifyEmail"] = google_email_verified

    return event
