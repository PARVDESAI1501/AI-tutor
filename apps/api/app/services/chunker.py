from langchain_text_splitters import RecursiveCharacterTextSplitter


class TextChunker:
    """Splits parsed document pages into smaller overlapping chunks."""

    def __init__(self, chunk_size: int = 1500, chunk_overlap: int = 200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", ", ", " ", ""],
            length_function=len,
        )

    def chunk_pages(self, pages: list[dict]) -> list[dict]:
        """
        Take parsed pages and split into smaller chunks.
        Preserves page_number and metadata from the original page.
        """
        all_chunks = []
        chunk_index = 0

        for page in pages:
            splits = self.splitter.split_text(page["content"])

            for split_text in splits:
                if len(split_text.strip()) < 30:
                    continue

                all_chunks.append(
                    {
                        "content": split_text.strip(),
                        "chunk_index": chunk_index,
                        "page_number": page.get("page_number"),
                        "metadata": page.get("metadata", {}),
                    }
                )
                chunk_index += 1

        return all_chunks
