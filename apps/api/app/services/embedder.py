import re
import time
from google import genai
from google.genai import types
from app.config import settings


class EmbeddingService:
    """Generate vector embeddings using Google gemini-embedding-001."""

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-embedding-001"
        self.output_dimensionality = 768
        self.max_retries = 5

    def _embed_with_retry(self, contents, task_type: str):
        """Call embedding API with automatic retry on rate limit."""

        for attempt in range(self.max_retries):
            try:
                result = self.client.models.embed_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.EmbedContentConfig(
                        task_type=task_type,
                        output_dimensionality=self.output_dimensionality,
                    ),
                )
                return result

            except Exception as e:
                error_str = str(e)

                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait_time = self._extract_wait_time(error_str)
                    if wait_time is None:
                        wait_time = min(30 * (2**attempt), 120)

                    print(
                        f"  [Embedder] Rate limited (attempt {attempt + 1}/{self.max_retries}). "
                        f"Waiting {wait_time:.0f} seconds..."
                    )
                    time.sleep(wait_time + 2)
                    continue
                else:
                    raise

        raise Exception(
            "Embedding failed after maximum retries. Please try again in a few minutes."
        )

    def _extract_wait_time(self, error_str: str):
        """Try to extract retry delay from error message."""
        patterns = [
            r"retry in ([\d.]+)s",
            r"retryDelay.*?([\d.]+)s",
            r"Please retry in ([\d.]+)",
        ]
        for pattern in patterns:
            match = re.search(pattern, error_str, re.IGNORECASE)
            if match:
                return float(match.group(1))
        return None

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts with batching."""
        all_embeddings = []
        batch_size = 50

        total_batches = (len(texts) + batch_size - 1) // batch_size
        print(
            f"  [Embedder] Embedding {len(texts)} texts in {total_batches} batch(es)..."
        )

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            batch_num = (i // batch_size) + 1

            print(
                f"  [Embedder] Batch {batch_num}/{total_batches} ({len(batch)} texts)..."
            )

            result = self._embed_with_retry(
                contents=batch,
                task_type="RETRIEVAL_DOCUMENT",
            )

            for embedding in result.embeddings:
                all_embeddings.append(list(embedding.values))

            if i + batch_size < len(texts):
                print("  [Embedder] Waiting 5 seconds before next batch...")
                time.sleep(5)

        print(f"  [Embedder] Done! Generated {len(all_embeddings)} embeddings")
        return all_embeddings

    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a single search query."""
        result = self._embed_with_retry(
            contents=query,
            task_type="RETRIEVAL_QUERY",
        )
        return list(result.embeddings[0].values)
