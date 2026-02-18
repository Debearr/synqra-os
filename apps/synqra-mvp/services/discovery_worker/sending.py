import json
import logging
import time
from typing import Any, Callable


def send_from_queue(
    connection: Any,
    schema: str,
    send_email_fn: Callable[[str, str, str], None],
    limit: int = 25,
    global_sending_enabled: bool = True,
    campaign_status: str = "active",
    logger: logging.Logger | None = None,
) -> dict[str, int]:
    logger = logger or logging.getLogger(__name__)
    if not global_sending_enabled or campaign_status != "active":
        return {"sent": 0, "skipped": 0, "failed": 0}

    drafts = _claim_sendable_drafts(connection=connection, schema=schema, limit=limit)
    sent = 0
    skipped = 0
    failed = 0

    for draft in drafts:
        try:
            _send_with_retry(send_email_fn, draft["to_email"], draft["subject"], draft["body"])
            _mark_sent(connection=connection, schema=schema, draft_id=draft["id"])
            sent += 1
        except TimeoutError:
            failed += 1
            logger.warning("smtp_timeout draft_id=%s", draft["id"])
        except HardBounceError:
            _suppress_email(connection=connection, email=draft["to_email"], reason="hard_bounce")
            skipped += 1
        except SoftBounceError:
            _mark_retry_after(connection=connection, schema=schema, draft_id=draft["id"], retry_after_hours=48)
            skipped += 1
        except Exception as exc:
            failed += 1
            logger.warning("send_failed draft_id=%s error=%s", draft["id"], exc)

    return {"sent": sent, "skipped": skipped, "failed": failed}


def _claim_sendable_drafts(connection: Any, schema: str, limit: int) -> list[dict[str, Any]]:
    sql = (
        f"SELECT id,to_email,subject,body "
        f"FROM {schema}.email_drafts_safe "
        "WHERE send_flag = TRUE AND sent_at IS NULL "
        "ORDER BY created_at ASC "
        "FOR UPDATE SKIP LOCKED "
        "LIMIT %(limit)s"
    )
    with connection.cursor() as cursor:
        cursor.execute(sql, {"limit": limit})
        rows = cursor.fetchall()

    output: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            output.append(row)
        elif isinstance(row, (list, tuple)) and len(row) >= 4:
            output.append({"id": row[0], "to_email": row[1], "subject": row[2], "body": row[3]})
    return output


def _mark_sent(connection: Any, schema: str, draft_id: str) -> None:
    sql = (
        f"UPDATE {schema}.email_drafts "
        "SET sent_at = now(), updated_at = now() "
        "WHERE id = %(draft_id)s AND sent_at IS NULL"
    )
    with connection.cursor() as cursor:
        cursor.execute(sql, {"draft_id": draft_id})
    connection.commit()


def _mark_retry_after(connection: Any, schema: str, draft_id: str, retry_after_hours: int) -> None:
    sql = (
        f"UPDATE {schema}.email_drafts "
        "SET retry_after = now() + (%(retry_after_hours)s || ' hours')::interval, updated_at = now() "
        "WHERE id = %(draft_id)s"
    )
    with connection.cursor() as cursor:
        cursor.execute(sql, {"draft_id": draft_id, "retry_after_hours": retry_after_hours})
    connection.commit()


def _suppress_email(connection: Any, email: str, reason: str) -> None:
    sql = (
        "INSERT INTO ops_audit.suppression_list (email, reason, created_at) "
        "VALUES (%(email)s, %(reason)s, now()) "
        "ON CONFLICT (email) DO NOTHING"
    )
    with connection.cursor() as cursor:
        cursor.execute(sql, {"email": email.strip().lower(), "reason": reason})
    connection.commit()


def _send_with_retry(send_email_fn: Callable[[str, str, str], None], to_email: str, subject: str, body: str) -> None:
    for attempt in range(2):
        try:
            send_email_fn(to_email, subject, body)
            return
        except TimeoutError:
            if attempt == 0:
                time.sleep(0.25)
                continue
            raise


class HardBounceError(RuntimeError):
    pass


class SoftBounceError(RuntimeError):
    pass

