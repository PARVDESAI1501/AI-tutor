import re
import json
import tempfile
import os
import xml.etree.ElementTree as ET
from io import BytesIO
from bs4 import BeautifulSoup

import fitz  # PyMuPDF
import httpx
from docx import Document
from pptx import Presentation
from groq import Groq
from app.config import settings

class DocumentParser:
    """Unified parser for ALL formats including Web, Audio, Video, and Text."""

    def parse_pdf(self, file_bytes: bytes) -> list[dict]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text: pages.append({"content": text, "page_number": page_num + 1, "metadata": {"type": "pdf"}})
        doc.close()
        return pages

    def parse_pptx(self, file_bytes: bytes) -> list[dict]:
        prs = Presentation(BytesIO(file_bytes))
        slides = []
        for slide_num, slide in enumerate(prs.slides):
            texts = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for p in shape.text_frame.paragraphs:
                        if p.text.strip(): texts.append(p.text.strip())
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                if slide.notes_slide.notes_text_frame.text.strip(): texts.append(f"[Notes]: {slide.notes_slide.notes_text_frame.text.strip()}")
            content = "\n".join(texts).strip()
            if content: slides.append({"content": content, "page_number": slide_num + 1, "metadata": {"type": "slide"}})
        return slides

    def parse_docx(self, file_bytes: bytes) -> list[dict]:
        doc = Document(BytesIO(file_bytes))
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        return [{"content": full_text, "page_number": None, "metadata": {"type": "docx"}}]

    def parse_text(self, text: str) -> list[dict]:
        return [{"content": text.strip(), "page_number": None, "metadata": {"type": "text"}}]

    def parse_website(self, url: str) -> list[dict]:
        headers = {"User-Agent": "Mozilla/5.0"}
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        for element in soup(["script", "style", "nav", "footer", "header"]):
            element.decompose()
            
        text = soup.get_text(separator='\n', strip=True)
        # Clean up excessive newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        return [{"content": text.strip(), "page_number": None, "metadata": {"type": "website", "url": url}}]

    def parse_audio_video(self, file_bytes: bytes, filename: str) -> list[dict]:
        """Uses Groq Whisper API for transcription of audio/video."""
        ext = filename.split('.')[-1].lower() if filename else "webm"
        if ext not in ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']:
            ext = 'webm' # default for recordings

        client = Groq(api_key=settings.GROQ_API_KEY)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        try:
            with open(temp_path, "rb") as file:
                # Use standard JSON format, not verbose_json, to avoid dictionary attribute errors
                transcription = client.audio.transcriptions.create(
                    file=(f"audio.{ext}", file.read()),
                    model="whisper-large-v3",
                    response_format="json",
                )
            
            # The API returns a Transcription object or a dictionary depending on version
            # We handle both safely here
            text = ""
            if isinstance(transcription, dict):
                text = transcription.get('text', '')
            else:
                text = getattr(transcription, 'text', '')
                
            if not text or not text.strip():
                raise ValueError("No speech detected in the audio file.")
                
            return [{"content": text.strip(), "page_number": None, "metadata": {"type": "audio"}}]
            
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def parse_youtube(self, url: str) -> list[dict]:
        from youtube_transcript_api import YouTubeTranscriptApi
        video_id = self._extract_video_id(url)
        
        try:
            entries = YouTubeTranscriptApi.get_transcript(video_id)
        except Exception:
            try:
                entries = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            except Exception as e:
                raise ValueError(f"Failed to fetch YouTube transcript. The video might not have captions or is blocked. Error: {e}")
                
        segments = []
        current = []
        start = 0
        for e in entries:
            current.append(e["text"])
            if e["start"] - start > 120:
                segments.append({"content": " ".join(current), "page_number": None, "metadata": {"type": "youtube"}})
                current = []
                start = e["start"]
        if current: 
            segments.append({"content": " ".join(current), "page_number": None, "metadata": {"type": "youtube"}})
            
        return segments

    def _extract_video_id(self, url: str) -> str:
        patterns = [r"(?:v=)([0-9A-Za-z_-]{11})", r"(?:youtu\.be/)([0-9A-Za-z_-]{11})"]
        for p in patterns:
            match = re.search(p, url)
            if match: return match.group(1)
        raise ValueError("Invalid YouTube URL")
