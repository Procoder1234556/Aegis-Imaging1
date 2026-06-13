"""
IronLabs Router — maps task types to LLM tiers.
Primary: IronLabs API (OpenAI-compatible), key sk_ht...
Fallback: Emergent Universal Key via emergentintegrations library.
"""
import os, time, uuid, json, asyncio, logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

IRONLABS_API_KEY  = os.getenv("IRONLABS_API_KEY", "")
IRONLABS_BASE_URL = os.getenv("IRONLABS_BASE_URL", "https://api.ironlabs.ai/v1")
EMERGENT_LLM_KEY  = os.getenv("EMERGENT_LLM_KEY", "")

# Task type → IronLabs model name  (matches Architecture PRD routing matrix)
IRONLABS_MODEL_MAP = {
    "metadata_extraction": "llama-3.1-8b-instruct",
    "forensics_analysis":  "gpt-4o-mini",
    "clinical_reasoning":  "claude-3-haiku-20240307",
    "critical_decision":   "claude-3-5-sonnet-20241022",
    "template_formatting": "llama-3.1-8b-instruct",
}

# Fallback via Emergent key (provider, model)
EMERGENT_FALLBACK_MAP = {
    "metadata_extraction": ("openai",    "gpt-4o-mini"),
    "forensics_analysis":  ("openai",    "gpt-4o-mini"),
    "clinical_reasoning":  ("anthropic", "claude-haiku-4-5-20251001"),
    "critical_decision":   ("anthropic", "claude-sonnet-4-6"),
    "template_formatting": ("openai",    "gpt-4o-mini"),
}

COST_PER_1K = {
    "llama-3.1-8b-instruct":      0.00006,
    "gpt-4o-mini":                 0.00015,
    "claude-3-haiku-20240307":     0.00025,
    "claude-3-5-sonnet-20241022":  0.003,
    "claude-haiku-4-5-20251001":   0.00025,
    "claude-sonnet-4-6":           0.003,
}


async def _call_ironlabs(task_type: str, prompt: str, system: str, image_path: str | None) -> str | None:
    """Try IronLabs API via openai SDK. Returns text or None on failure."""
    if not IRONLABS_API_KEY:
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=IRONLABS_API_KEY, base_url=IRONLABS_BASE_URL)
        model = IRONLABS_MODEL_MAP.get(task_type, "gpt-4o-mini")

        messages = [{"role": "system", "content": system}]
        if image_path and task_type in ("forensics_analysis", "clinical_reasoning"):
            import base64
            with open(image_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                ],
            })
        else:
            messages.append({"role": "user", "content": prompt})

        resp = await asyncio.wait_for(
            client.chat.completions.create(
                model=model, messages=messages, max_tokens=600, temperature=0.2
            ),
            timeout=15,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.warning(f"IronLabs failed for {task_type}: {e}")
        return None


async def _call_emergent(task_type: str, prompt: str, system: str, image_path: str | None) -> str | None:
    """Fallback via Emergent Universal Key using emergentintegrations."""
    if not EMERGENT_LLM_KEY:
        return None
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, FileContentWithMimeType

        provider, model = EMERGENT_FALLBACK_MAP.get(task_type, ("openai", "gpt-4o-mini"))
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system,
        ).with_model(provider, model)

        if image_path and task_type in ("forensics_analysis", "clinical_reasoning"):
            import mimetypes
            mime = mimetypes.guess_type(image_path)[0] or "image/png"
            msg = UserMessage(
                text=prompt,
                file_contents=[FileContentWithMimeType(file_path=image_path, mime_type=mime)],
            )
        else:
            msg = UserMessage(text=prompt)

        chunks = []
        async for ev in chat.stream_message(msg):
            if isinstance(ev, TextDelta):
                chunks.append(ev.content)
            elif isinstance(ev, StreamDone):
                break
        return "".join(chunks)
    except Exception as e:
        logger.error(f"Emergent fallback failed for {task_type}: {e}")
        return None


class IronLabsRouter:
    """
    Routes LLM tasks:  IronLabs (primary) → Emergent (fallback) → static string.
    Logs telemetry for ironlabs_calls table.
    """
    async def route(
        self,
        task_type: str,
        prompt: str,
        system_message: str = "You are a specialist AI agent for medical image verification. Be precise and concise.",
        image_path: str | None = None,
        audit_id: str | None = None,
    ) -> tuple[str, dict]:
        start = time.time()
        model_used = IRONLABS_MODEL_MAP.get(task_type, "gpt-4o-mini")

        # 1. Try IronLabs
        text = await _call_ironlabs(task_type, prompt, system_message, image_path)

        # 2. Emergent fallback
        if text is None:
            _, fallback_model = EMERGENT_FALLBACK_MAP.get(task_type, ("openai", "gpt-4o-mini"))
            model_used = fallback_model
            text = await _call_emergent(task_type, prompt, system_message, image_path)

        # 3. Static fallback
        if text is None:
            text = "Verification unavailable; manual review recommended. (ESCALATE)"
            model_used = "static-fallback"

        latency_ms = int((time.time() - start) * 1000)
        tokens_est = len(text.split()) + len(prompt.split())
        cost_usd = round(tokens_est / 1000 * COST_PER_1K.get(model_used, 0.0003), 6)

        telemetry = {
            "audit_id": audit_id,
            "agent": task_type,
            "model": model_used,
            "task_type": task_type,
            "tokens": tokens_est,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
        }
        return text, telemetry
