import asyncio
import logging
from typing import Any

import httpx


logger = logging.getLogger(__name__)


class ProviderError(Exception):
    def __init__(self, provider: str, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.provider = provider
        self.status_code = status_code


class ProviderClients:
    def __init__(
        self,
        *,
        groq_api_key: str | None,
        groq_model: str,
        groq_timeout_seconds: float,
        ollama_base_url: str,
        ollama_model: str,
        ollama_max_concurrency: int,
        claude_api_key: str | None,
        claude_model: str,
        kie_api_key: str | None,
        kie_base_url: str,
    ) -> None:
        self.groq_api_key = groq_api_key
        self.groq_model = groq_model
        self.groq_timeout_seconds = groq_timeout_seconds
        self.ollama_base_url = ollama_base_url.rstrip("/")
        self.ollama_model = ollama_model
        self._ollama_semaphore = asyncio.Semaphore(max(1, ollama_max_concurrency))
        self.claude_api_key = claude_api_key
        self.claude_model = claude_model
        self.kie_api_key = kie_api_key
        self.kie_base_url = kie_base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(35.0))

    async def close(self) -> None:
        await self._client.aclose()

    async def call_groq(self, prompt: str) -> str:
        if not self.groq_api_key:
            raise ProviderError("groq", "GROQ_API_KEY is not configured")

        url = "https://api.groq.com/openai/v1/chat/completions"
        payload = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        headers = {"Authorization": f"Bearer {self.groq_api_key}"}

        response = await self._client.post(
            url,
            json=payload,
            headers=headers,
            timeout=httpx.Timeout(self.groq_timeout_seconds),
        )
        if response.status_code >= 400:
            raise ProviderError("groq", response.text, response.status_code)

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderError("groq", f"Malformed response: {data}") from exc

    async def call_ollama(self, prompt: str) -> str:
        async with self._ollama_semaphore:
            url = f"{self.ollama_base_url}/api/generate"
            payload = {"model": self.ollama_model, "prompt": prompt, "stream": False}
            response = await self._client.post(url, json=payload)
            if response.status_code >= 400:
                raise ProviderError("ollama", response.text, response.status_code)

            data = response.json()
            if "response" not in data:
                raise ProviderError("ollama", f"Malformed response: {data}")
            return str(data["response"])

    async def call_claude(self, prompt: str) -> str:
        if not self.claude_api_key:
            raise ProviderError("claude", "CLAUDE_API_KEY is not configured")

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.claude_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.claude_model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }
        response = await self._client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            raise ProviderError("claude", response.text, response.status_code)

        data = response.json()
        try:
            chunks = data["content"]
            text_parts = [chunk.get("text", "") for chunk in chunks if chunk.get("type") == "text"]
            return "".join(text_parts).strip()
        except (KeyError, TypeError) as exc:
            raise ProviderError("claude", f"Malformed response: {data}") from exc

    async def call_kie(self, prompt: str, media_url: str, metadata: dict[str, Any]) -> Any:
        if not self.kie_api_key:
            raise ProviderError("kie", "KIE_API_KEY is not configured")

        url = f"{self.kie_base_url}/v1/media/infer"
        headers = {"Authorization": f"Bearer {self.kie_api_key}"}
        payload = {"prompt": prompt, "media_url": media_url, "metadata": metadata}
        response = await self._client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            raise ProviderError("kie", response.text, response.status_code)

        data = response.json()
        if isinstance(data, dict) and "output" in data:
            return data["output"]
        return data
