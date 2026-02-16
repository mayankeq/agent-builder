"""LLM client abstraction with multiple provider support."""
import json
import time
from typing import Any, Dict, Optional

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from ..observability.logger import LoggerMixin
from ..observability.metrics import metrics


class LLMClient(LoggerMixin):
    """Abstraction layer for LLM API interactions."""
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        default_provider: str = "openai",
        cache_enabled: bool = True
    ):
        """Initialize LLM client.
        
        Args:
            openai_api_key: OpenAI API key
            anthropic_api_key: Anthropic API key
            default_provider: Default provider to use
            cache_enabled: Whether to cache responses
        """
        self.openai_client = AsyncOpenAI(api_key=openai_api_key) if openai_api_key else None
        self.anthropic_client = AsyncAnthropic(api_key=anthropic_api_key) if anthropic_api_key else None
        self.default_provider = default_provider
        self.cache_enabled = cache_enabled
        self._cache: Dict[str, Any] = {}
    
    def _get_cache_key(self, prompt: str, model: str, **kwargs: Any) -> str:
        """Generate cache key for a request."""
        key_parts = [prompt, model]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}={v}")
        return "|".join(key_parts)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def complete(
        self,
        prompt: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Complete a prompt using specified LLM provider.
        
        Args:
            prompt: The prompt to complete
            provider: Provider to use (openai, anthropic)
            model: Specific model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            json_mode: Whether to request JSON output
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Response dict with 'content', 'provider', 'model', 'tokens_used'
            
        Raises:
            ValueError: If provider not configured
            Exception: On API errors after retries
        """
        provider = provider or self.default_provider
        
        # Check cache
        if self.cache_enabled:
            cache_key = self._get_cache_key(prompt, model or "default", **kwargs)
            if cache_key in self._cache:
                metrics.record_cache_access("llm_response", hit=True)
                self.log_event("llm_cache_hit", provider=provider)
                return self._cache[cache_key]
            metrics.record_cache_access("llm_response", hit=False)
        
        start_time = time.time()
        
        try:
            if provider == "openai":
                result = await self._complete_openai(
                    prompt, model, temperature, max_tokens, json_mode, **kwargs
                )
            elif provider == "anthropic":
                result = await self._complete_anthropic(
                    prompt, model, temperature, max_tokens, **kwargs
                )
            else:
                raise ValueError(f"Unknown provider: {provider}")
            
            latency = time.time() - start_time
            
            # Record metrics
            metrics.record_llm_request(
                provider=result["provider"],
                model=result["model"],
                operation="complete",
                latency=latency,
                tokens_used=result.get("tokens_used")
            )
            
            # Cache result
            if self.cache_enabled:
                self._cache[cache_key] = result
            
            self.log_event(
                "llm_completion_success",
                provider=result["provider"],
                model=result["model"],
                latency=latency
            )
            
            return result
            
        except Exception as e:
            latency = time.time() - start_time
            metrics.record_llm_request(
                provider=provider,
                model=model or "unknown",
                operation="complete",
                latency=latency,
                error=type(e).__name__
            )
            self.log_error(e, provider=provider, prompt_length=len(prompt))
            raise
    
    async def _complete_openai(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        json_mode: bool,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Complete using OpenAI."""
        if not self.openai_client:
            raise ValueError("OpenAI client not configured")
        
        model = model or "gpt-3.5-turbo"
        
        messages = [{"role": "user", "content": prompt}]
        
        response_format = {"type": "json_object"} if json_mode else {"type": "text"}
        
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            **kwargs
        )
        
        content = response.choices[0].message.content or ""
        
        # Parse JSON if requested
        if json_mode:
            try:
                content = json.loads(content)
            except json.JSONDecodeError:
                self.logger.warning("Failed to parse JSON response", content=content)
        
        return {
            "content": content,
            "provider": "openai",
            "model": model,
            "tokens_used": {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens
            }
        }
    
    async def _complete_anthropic(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Complete using Anthropic Claude."""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not configured")
        
        model = model or "claude-3-sonnet-20240229"
        
        response = await self.anthropic_client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        )
        
        content = response.content[0].text
        
        return {
            "content": content,
            "provider": "anthropic",
            "model": model,
            "tokens_used": {
                "prompt": response.usage.input_tokens,
                "completion": response.usage.output_tokens,
                "total": response.usage.input_tokens + response.usage.output_tokens
            }
        }