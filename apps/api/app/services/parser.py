import re
import json
import xml.etree.ElementTree as ET
from io import BytesIO

import fitz  # PyMuPDF
import httpx
from docx import Document
from pptx import Presentation


class DocumentParser:
    """Unified parser for PDF, PPTX, DOCX, and YouTube transcripts."""

    # ─────────────────────────────────────────────
    # PDF
    # ─────────────────────────────────────────────
    def parse_pdf(self, file_bytes: bytes) -> list[dict]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages.append({
                    "content": text,
                    "page_number": page_num + 1,
                    "metadata": {"char_count": len(text), "type": "pdf"},
                })
        doc.close()
        return pages

    # ─────────────────────────────────────────────
    # PPTX
    # ─────────────────────────────────────────────
    def parse_pptx(self, file_bytes: bytes) -> list[dict]:
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
                slides.append({
                    "content": content,
                    "page_number": slide_num + 1,
                    "metadata": {"type": "slide"},
                })
        return slides

    # ─────────────────────────────────────────────
    # DOCX
    # ─────────────────────────────────────────────
    def parse_docx(self, file_bytes: bytes) -> list[dict]:
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
                    sections.append({
                        "content": "\n".join(current_section),
                        "page_number": section_index,
                        "metadata": {"type": "docx", "heading": current_heading},
                    })
                    section_index += 1
                current_heading = text
                current_section = [text]
            else:
                current_section.append(text)
        if current_section:
            sections.append({
                "content": "\n".join(current_section),
                "page_number": section_index,
                "metadata": {"type": "docx", "heading": current_heading},
            })
        if not sections:
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if full_text:
                sections.append({
                    "content": full_text,
                    "page_number": None,
                    "metadata": {"type": "docx"},
                })
        return sections

    # ─────────────────────────────────────────────
    # YouTube — Multiple Fallback Methods
    # ─────────────────────────────────────────────
    def parse_youtube(self, url: str) -> list[dict]:
        video_id = self._extract_video_id(url)
        print(f"[YouTube] Extracting transcript for video: {video_id}")

        transcript_entries = None
        errors = []

        # Method 1: youtube-transcript-api library
        try:
            print("[YouTube] Trying Method 1: youtube-transcript-api...")
            transcript_entries = self._method_youtube_transcript_api(video_id)
            print(f"[YouTube] Method 1 success! Got {len(transcript_entries)} entries")
        except Exception as e:
            errors.append(f"Method 1 (youtube-transcript-api): {str(e)[:100]}")
            print(f"[YouTube] Method 1 failed: {str(e)[:100]}")

        # Method 2: Direct YouTube page scraping
        if not transcript_entries:
            try:
                print("[YouTube] Trying Method 2: Direct page scraping...")
                transcript_entries = self._method_direct_scrape(video_id)
                print(f"[YouTube] Method 2 success! Got {len(transcript_entries)} entries")
            except Exception as e:
                errors.append(f"Method 2 (direct scrape): {str(e)[:100]}")
                print(f"[YouTube] Method 2 failed: {str(e)[:100]}")

        # Method 3: YouTube InnerTube API
        if not transcript_entries:
            try:
                print("[YouTube] Trying Method 3: InnerTube API...")
                transcript_entries = self._method_innertube(video_id)
                print(f"[YouTube] Method 3 success! Got {len(transcript_entries)} entries")
            except Exception as e:
                errors.append(f"Method 3 (InnerTube): {str(e)[:100]}")
                print(f"[YouTube] Method 3 failed: {str(e)[:100]}")

        if not transcript_entries:
            error_details = "\n".join(errors)
            raise ValueError(
                f"Could not fetch transcript for video {video_id}. "
                f"This may be because:\n"
                f"1. The video has no captions/subtitles\n"
                f"2. YouTube is blocking requests from this server\n"
                f"3. The video is private or age-restricted\n\n"
                f"Try uploading the video transcript as a text file instead.\n\n"
                f"Details:\n{error_details}"
            )

        # Group into ~2 minute segments
        return self._group_into_segments(transcript_entries)

    def _method_youtube_transcript_api(self, video_id: str) -> list[dict]:
        """Method 1: Use youtube-transcript-api library."""
        from youtube_transcript_api import YouTubeTranscriptApi

        # Try new API (v1.0+)
        try:
            api = YouTubeTranscriptApi()
            transcript = api.fetch(video_id)
            entries = []
            for snippet in transcript:
                entries.append({
                    "text": str(snippet.text),
                    "start": float(snippet.start),
                    "duration": float(snippet.duration),
                })
            if entries:
                return entries
        except (TypeError, AttributeError):
            pass

        # Try old API
        try:
            result = YouTubeTranscriptApi.get_transcript(video_id)
            if isinstance(result, list) and len(result) > 0:
                return result
        except AttributeError:
            pass

        raise Exception("youtube-transcript-api failed")

    def _method_direct_scrape(self, video_id: str) -> list[dict]:
        """Method 2: Scrape YouTube page for caption track URL, then fetch captions."""

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # Fetch the video page
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            response = client.get(
                f"https://www.youtube.com/watch?v={video_id}",
                headers=headers,
            )
            response.raise_for_status()
            html = response.text

        # Find captions data in the page
        caption_url = None

        # Look for timedtext URL in the page source
        patterns = [
            r'"captionTracks":\s*\[(.*?)\]',
            r'"captions":\s*\{.*?"playerCaptionsTracklistRenderer":\s*\{.*?"captionTracks":\s*\[(.*?)\]',
        ]

        for pattern in patterns:
            match = re.search(pattern, html, re.DOTALL)
            if match:
                tracks_json = "[" + match.group(1) + "]"
                # Fix JSON escaping
                tracks_json = tracks_json.replace("\\/", "/")
                tracks_json = re.sub(r'\\u0026', '&', tracks_json)

                try:
                    tracks = json.loads(tracks_json)
                    # Prefer English, but take any
                    for track in tracks:
                        base_url = track.get("baseUrl", "")
                        if base_url:
                            lang = track.get("languageCode", "")
                            if "en" in lang:
                                caption_url = base_url
                                break
                    if not caption_url and tracks:
                        caption_url = tracks[0].get("baseUrl", "")
                except json.JSONDecodeError:
                    continue

        if not caption_url:
            # Try alternative pattern
            match = re.search(r'"baseUrl"\s*:\s*"(https://www\.youtube\.com/api/timedtext[^"]+)"', html)
            if match:
                caption_url = match.group(1).replace("\\u0026", "&").replace("\\/", "/")

        if not caption_url:
            raise Exception("No caption tracks found in page source")

        # Fetch the captions XML
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            cap_response = client.get(caption_url, headers=headers)
            cap_response.raise_for_status()
            caption_xml = cap_response.text

        # Parse XML captions
        entries = self._parse_caption_xml(caption_xml)
        if not entries:
            raise Exception("Failed to parse caption XML")

        return entries

    def _method_innertube(self, video_id: str) -> list[dict]:
        """Method 3: Use YouTube InnerTube API to get transcript."""

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/json",
        }

        # First, get the page to find the API key
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            page_response = client.get(
                f"https://www.youtube.com/watch?v={video_id}",
                headers={"User-Agent": headers["User-Agent"]},
            )
            page_html = page_response.text

        # Extract InnerTube API key
        api_key_match = re.search(r'"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"', page_html)
        if not api_key_match:
            raise Exception("Could not find InnerTube API key")

        api_key = api_key_match.group(1)

        # Get the initial player response to find caption tracks
        caption_url = None
        patterns = [
            r'"captionTracks":\s*\[(.*?)\]',
        ]

        for pattern in patterns:
            match = re.search(pattern, page_html, re.DOTALL)
            if match:
                tracks_json = "[" + match.group(1) + "]"
                tracks_json = tracks_json.replace("\\/", "/")
                tracks_json = re.sub(r'\\u0026', '&', tracks_json)
                try:
                    tracks = json.loads(tracks_json)
                    for track in tracks:
                        base_url = track.get("baseUrl", "")
                        if base_url:
                            caption_url = base_url
                            break
                except json.JSONDecodeError:
                    continue

        if not caption_url:
            raise Exception("No captions found via InnerTube")

        # Fetch captions
        with httpx.Client(follow_redirects=True, timeout=15) as client:
            cap_response = client.get(
                caption_url,
                headers={"User-Agent": headers["User-Agent"]},
            )
            cap_response.raise_for_status()
            caption_xml = cap_response.text

        entries = self._parse_caption_xml(caption_xml)
        if not entries:
            raise Exception("Failed to parse captions from InnerTube")

        return entries

    def _parse_caption_xml(self, xml_text: str) -> list[dict]:
        """Parse YouTube caption XML format into transcript entries."""
        entries = []

        try:
            # Try parsing as XML
            root = ET.fromstring(xml_text)
            for text_elem in root.findall(".//text"):
                start = float(text_elem.get("start", 0))
                duration = float(text_elem.get("dur", 0))
                content = text_elem.text or ""

                # Clean HTML entities
                content = content.replace("&amp;", "&")
                content = content.replace("&lt;", "<")
                content = content.replace("&gt;", ">")
                content = content.replace("&quot;", '"')
                content = content.replace("&#39;", "'")
                content = re.sub(r'<[^>]+>', '', content)
                content = content.strip()

                if content:
                    entries.append({
                        "text": content,
                        "start": start,
                        "duration": duration,
                    })
        except ET.ParseError:
            # Try parsing as JSON (some formats return JSON)
            try:
                data = json.loads(xml_text)
                events = data.get("events", [])
                for event in events:
                    segs = event.get("segs", [])
                    text = "".join([s.get("utf8", "") for s in segs]).strip()
                    if text and text != "\n":
                        entries.append({
                            "text": text,
                            "start": event.get("tStartMs", 0) / 1000.0,
                            "duration": event.get("dDurationMs", 0) / 1000.0,
                        })
            except (json.JSONDecodeError, KeyError):
                pass

        return entries

    def _group_into_segments(self, transcript_entries: list[dict]) -> list[dict]:
        """Group transcript entries into ~2 minute segments."""
        segments = []
        current_texts = []
        segment_start = 0.0

        for entry in transcript_entries:
            current_texts.append(entry["text"])

            if entry["start"] - segment_start > 120:
                content = " ".join(current_texts).strip()
                if content:
                    segments.append({
                        "content": content,
                        "page_number": None,
                        "metadata": {
                            "type": "youtube_segment",
                            "start_time": segment_start,
                            "end_time": entry["start"],
                        },
                    })
                current_texts = []
                segment_start = entry["start"]

        if current_texts:
            content = " ".join(current_texts).strip()
            if content:
                segments.append({
                    "content": content,
                    "page_number": None,
                    "metadata": {
                        "type": "youtube_segment",
                        "start_time": segment_start,
                    },
                })

        return segments

    # ─────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────
    def _extract_video_id(self, url: str) -> str:
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
        video_id = self._extract_video_id(url)
        return f"YouTube Video ({video_id})"
