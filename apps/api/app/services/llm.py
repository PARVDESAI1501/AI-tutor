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

        # ── Try Gemini First ──
        try:
            yield from self._stream_gemini(prompt, system_prompt)
            return
        except Exception as e:
            print(f"[LLM] Gemini failed: {e}")
            print("[LLM] Falling back to Groq...")

        # ── Fallback: Groq ──
        try:
            yield from self._stream_groq(prompt, system_prompt)
        except Exception as e:
            print(f"[LLM] Groq also failed: {e}")
            yield "I'm sorry, I'm having trouble generating a response right now. Please try again in a moment."

    def _stream_gemini(self, prompt: str, system_prompt: str):
        """Stream response from Gemini."""

        response = self.gemini_client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part(text=prompt)],
                ),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt if system_prompt else None,
                temperature=0.3,
                max_output_tokens=2048,
            ),
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

        try:
            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=prompt)],
                    ),
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt if system_prompt else None,
                    temperature=0.3,
                    max_output_tokens=4096,
                    response_mime_type="application/json",
                ),
            )

            return json.loads(response.text)

        except Exception as e:
            print(f"[LLM] Gemini JSON failed: {e}, trying Groq...")

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

            return json.loads(response.choices[0].message.content)
