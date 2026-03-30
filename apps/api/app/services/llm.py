import json
from google import genai
from google.genai import types
from groq import Groq
from app.config import settings


class LLMService:
    """Unified LLM interface. Gemini primary, Groq fallback."""

    def __init__(self):
        self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

    def stream_response(self, prompt: str, system_prompt: str = ""):
        """Stream LLM response. Try Gemini first, fall back to Groq."""

        try:
            yield from self._stream_gemini(prompt, system_prompt)
            return
        except Exception as e:
            print(f"[LLM] Gemini failed: {e}")
            print("[LLM] Falling back to Groq...")

        try:
            yield from self._stream_groq(prompt, system_prompt)
        except Exception as e:
            print(f"[LLM] Groq also failed: {e}")
            yield "I'm sorry, I'm having trouble generating a response right now. Please try again in a moment."

    def _stream_gemini(self, prompt: str, system_prompt: str):
        """Stream response from Gemini using new google.genai package."""

        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=2048,
        )

        if system_prompt:
            config.system_instruction = system_prompt

        response = self.gemini_client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=prompt,
            config=config,
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    def _stream_groq(self, prompt: str, system_prompt: str):
        """Stream response from Groq."""

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True,
            temperature=0.3,
            max_tokens=2048,
        )

        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def generate_json(self, prompt: str, system_prompt: str = "") -> dict:
        """Generate a complete (non-streaming) JSON response."""

        # ── Try Gemini first ──
        try:
            return self._generate_json_gemini(prompt, system_prompt)
        except Exception as e:
            print(f"[LLM] Gemini JSON failed: {e}")
            print("[LLM] Trying Gemini without JSON mode...")

        # ── Try Gemini without strict JSON mode ──
        try:
            return self._generate_json_gemini_fallback(prompt, system_prompt)
        except Exception as e:
            print(f"[LLM] Gemini fallback failed: {e}")
            print("[LLM] Trying Groq...")

        # ── Try Groq ──
        try:
            return self._generate_json_groq(prompt, system_prompt)
        except Exception as e:
            print(f"[LLM] Groq JSON failed: {e}")
            raise Exception(f"All LLM providers failed to generate JSON: {e}")

    def _generate_json_gemini(self, prompt: str, system_prompt: str) -> dict:
        """Generate JSON using Gemini with JSON response mode."""

        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
            response_mime_type="application/json",
        )

        if system_prompt:
            config.system_instruction = system_prompt

        response = self.gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=config,
        )

        text = response.text.strip()
        return json.loads(text)

    def _generate_json_gemini_fallback(self, prompt: str, system_prompt: str) -> dict:
        """Generate JSON using Gemini without JSON mode, then parse manually."""

        full_prompt = (
            prompt
            + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation. Just the raw JSON object."
        )

        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
        )

        if system_prompt:
            config.system_instruction = system_prompt

        response = self.gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
            config=config,
        )

        text = response.text.strip()

        # Clean up common issues
        # Remove markdown code fences if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)

    def _generate_json_groq(self, prompt: str, system_prompt: str) -> dict:
        """Generate JSON using Groq."""

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        text = response.choices[0].message.content.strip()
        return json.loads(text)
