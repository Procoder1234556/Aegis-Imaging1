"""Base agent interface — all 5 agents implement this."""
from abc import ABC, abstractmethod
import time


class BaseAgent(ABC):
    name: str = "base"

    async def execute(self, context: dict) -> dict:
        start = time.time()
        try:
            result = await self.run(context)
            result["agent"] = self.name
            result.setdefault("error", None)
            result["latency_ms"] = int((time.time() - start) * 1000)
        except Exception as e:
            result = {
                "agent": self.name,
                "score": 0.5,
                "evidence": [],
                "latency_ms": int((time.time() - start) * 1000),
                "error": str(e),
            }
        return result

    @abstractmethod
    async def run(self, context: dict) -> dict:
        ...
