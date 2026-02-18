from typing import Any


def write_run_log(connection: Any, job_name: str, status: str, metadata_json: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO ops_audit.run_log (job_name, status, metadata, created_at) "
            "VALUES (%(job_name)s, %(status)s, %(metadata)s::jsonb, now())",
            {"job_name": job_name, "status": status, "metadata": metadata_json},
        )
    connection.commit()

