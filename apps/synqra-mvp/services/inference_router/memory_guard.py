import psutil
from fastapi import HTTPException, status


class MemoryGuard:
    """Rejects new requests when free RAM is below threshold."""

    def __init__(self, min_free_mb: int = 500) -> None:
        self.min_free_bytes = min_free_mb * 1024 * 1024

    def snapshot(self) -> dict:
        vm = psutil.virtual_memory()
        free_mb = int(vm.available / (1024 * 1024))
        return {
            "free_mb": free_mb,
            "min_required_mb": int(self.min_free_bytes / (1024 * 1024)),
            "healthy": vm.available >= self.min_free_bytes,
        }

    def enforce(self) -> None:
        vm = psutil.virtual_memory()
        if vm.available < self.min_free_bytes:
            free_mb = int(vm.available / (1024 * 1024))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Insufficient free RAM: {free_mb}MB available",
            )
