import re
from io import BytesIO

import fitz  # PyMuPDF
from docx import Document
from pptx import Presentation


class DocumentParser:
    """Unified parser for PDF, PPTX, DOCX, and YouTube transcripts."""

    # ─────────────────────────────────────────────
    # PDF
    # ─────────────────────────────────────────────
    def parse_pdf(self, file_bytes: bytes) -> list[dict]:
        """Extract text from PDF, page by page."""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages.append(
                    {
                        "content": text,
                        "page_number": page_num + 1,
                        "metadata": {"char_count": len(text), "type": "pdf"},
                    }
                )
        doc.close()
        return pages

    # ─────────────────────────────────────────────
    # PPTX (PowerPoint)
    # ─────────────────────────────────────────────
    def parse_pptx(self, file_bytes: bytes) -> list[dict]:
        """Extract text from PowerPoint slides including speaker notes."""
        prs = Presentation(BytesIO(file_bytes))
        slides = []
        for slide_num, slide in enumerate(prs.slides):
            texts = []

            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        para_text = paragraph.text.strip()
                        if para_text:
                            texts.append(para_text)

            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                notes_text = slide.notes_slide.notes_text_frame.text.strip()
                if notes_text:
                    texts.append(f"[Speaker Notes]: {notes_text}")

            content = "\n".join(texts).strip()
            if content:
                slides.append(
                    {
                        "content": content,
                        "page_number": slide_num + 1,
                        "metadata": {"type": "slide"},
                    }
                )
        return slides

    # ─────────────────────────────────────────────
    # DOCX (Word)
    # ─────────────────────────────────────────────
    def parse_docx(self, file_bytes: bytes) -> list[dict]:
        """Extract text from Word documents, split by headings."""
        doc = Document(BytesIO(file_bytes))
        sections = []
        current_section = []
        current_heading = "Document Start"
        section_index = 1

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue

            if para.style.name.startswith("Heading"):
                if current_section:
                    sections.append(
                        {
                            "content": "\n".join(current_section),
                            "page_number": section_index,
                            "metadata": {
                                "type": "docx",
                                "heading": current_heading,
                            },
                        }
                    )
                    section_index += 1
                current_heading = text
                current_section = [text]
            else:
                current_section.append(text)

        if current_section:
            sections.append(
                {
                    "content": "\n".join(current_section),
                    "page_number": section_index,
                    "metadata": {"type": "docx", "heading": current_heading},
                }
            )

        if not sections:
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if full_text:
                sections.append(
                    {
                        "content": full_text,
                        "page_number": None,
                        "metadata": {"type": "docx"},
                    }
                )

        return sections

    # ─────────────────────────────────────────────
    # YouTube
    # ─────────────────────────────────────────────
    def parse_youtube(self, url: str) -> list[dict]:
        """Extract transcript from YouTube video in ~2 minute segments."""
        video_id = self._extract_video_id(url)
        transcript_entries = self._fetch_transcript(video_id)

        segments = []
        current_texts = []
        segment_start = 0.0

        for entry in transcript_entries:
            current_texts.append(entry["text"])

            if entry["start"] - segment_start > 120:
                content = " ".join(current_texts).strip()
                if content:
                    segments.append(
                        {
                            "content": content,
                            "page_number": None,
                            "metadata": {
                                "type": "youtube_segment",
                                "start_time": segment_start,
                                "end_time": entry["start"],
                            },
                        }
                    )
                current_texts = []
                segment_start = entry["start"]

        if current_texts:
            content = " ".join(current_texts).strip()
            if content:
                segments.append(
                    {
                        "content": content,
                        "page_number": None,
                        "metadata": {
                            "type": "youtube_segment",
                            "start_time": segment_start,
                        },
                    }
                )

        return segments

    def _fetch_transcript(self, video_id: str) -> list[dict]:
        """Fetch YouTube transcript. Works with any version of the API."""

        from youtube_transcript_api import YouTubeTranscriptApi

        # ── Method 1: New API (v1.0+) — instance method ──
        try:
            api = YouTubeTranscriptApi()
            transcript = api.fetch(video_id)

            entries = []
            for snippet in transcript:
                entries.append(
                    {
                        "text": str(snippet.text),
                        "start": float(snippet.start),
                        "duration": float(snippet.duration),
                    }
                )
            if entries:
                return entries
        except (TypeError, AttributeError):
            pass
        except Exception as e:
            if "Could not retrieve" not in str(e) and "No transcript" not in str(e):
                # Some other error with new API, try old API
                pass
            else:
                raise ValueError(
                    f"No transcript found for video {video_id}. "
                    f"The video may not have captions. Error: {e}"
                )

        # ── Method 2: Old API (v0.6.x) — class method ──
        try:
            result = YouTubeTranscriptApi.get_transcript(video_id)
            if isinstance(result, list) and len(result) > 0:
                return result
        except AttributeError:
            pass
        except Exception as e:
            if "Could not retrieve" in str(e) or "No transcript" in str(e):
                raise ValueError(
                    f"No transcript found for video {video_id}. "
                    f"The video may not have captions. Error: {e}"
                )

        # ── Method 3: New API with language listing ──
        try:
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)

            for t in transcript_list:
                try:
                    transcript = t.fetch()
                    entries = []
                    for snippet in transcript:
                        entries.append(
                            {
                                "text": str(snippet.text),
                                "start": float(snippet.start),
                                "duration": float(snippet.duration),
                            }
                        )
                    if entries:
                        return entries
                except Exception:
                    continue
        except Exception:
            pass

        raise ValueError(
            f"Could not fetch transcript for video {video_id}. "
            f"The video may not have captions/subtitles available."
        )

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────
    def _extract_video_id(self, url: str) -> str:
        """Extract the video ID from various YouTube URL formats."""
        patterns = [
            r"(?:v=)([0-9A-Za-z_-]{11})",
            r"(?:youtu\.be/)([0-9A-Za-z_-]{11})",
            r"(?:embed/)([0-9A-Za-z_-]{11})",
            r"(?:shorts/)([0-9A-Za-z_-]{11})",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        raise ValueError(f"Could not extract video ID from URL: {url}")

    def get_youtube_title(self, url: str) -> str:
        """Get a basic title from video ID."""
        video_id = self._extract_video_id(url)
        return f"YouTube Video ({video_id})"
