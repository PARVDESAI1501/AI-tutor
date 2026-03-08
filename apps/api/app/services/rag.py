import json
from app.services.embedder import EmbeddingService
from app.services.llm import LLMService


RAG_SYSTEM_PROMPT = """You are an expert AI tutor. Your job is to help the student understand their study materials.

RULES:
1. Answer the student's question based ONLY on the provided context from their materials.
2. Reference specific parts of the context using [Source X] notation where X is the source number.
3. If the context does not contain enough information to answer, say so honestly. Do NOT make up information.
4. Use markdown formatting for clarity: headers, bullet points, bold text, code blocks where appropriate.
5. Be encouraging, clear, and pedagogically sound.
6. Give thorough explanations — don't just quote the source, explain the concept.

CONTEXT FROM THE STUDENT'S MATERIALS:
{context}

CONVERSATION HISTORY:
{history}"""


class RAGService:
    """Full RAG pipeline: retrieve relevant chunks → augment prompt → generate response."""

    def __init__(self):
        self.embedder = EmbeddingService()
        self.llm = LLMService()

    def retrieve_context(
        self,
        query: str,
        source_id: str,
        user_id: str,
        supabase,
        top_k: int = 6,
    ) -> list[dict]:
        """Retrieve the most relevant chunks for a query using vector search."""

        # Generate embedding for the query
        query_embedding = self.embedder.embed_query(query)

        # Call the match_chunks Postgres function
        result = supabase.rpc(
            "match_chunks",
            {
                "query_embedding": query_embedding,
                "match_count": top_k,
                "filter_source_id": source_id,
                "filter_user_id": user_id,
            },
        ).execute()

        return result.data if result.data else []

    def format_context(self, chunks: list[dict]) -> str:
        """Format retrieved chunks into a numbered context string."""

        if not chunks:
            return "No relevant context found in the student's materials."

        context_parts = []
        for i, chunk in enumerate(chunks):
            page_info = ""
            if chunk.get("page_number"):
                page_info = f" (Page {chunk['page_number']})"

            context_parts.append(f"[Source {i + 1}]{page_info}:\n{chunk['content']}")

        return "\n\n---\n\n".join(context_parts)

    def format_history(self, history: list[dict], max_messages: int = 6) -> str:
        """Format conversation history for the prompt."""

        if not history:
            return "No previous conversation."

        recent = history[-max_messages:]
        formatted = []
        for msg in recent:
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            # Truncate long messages in history
            if len(content) > 500:
                content = content[:500] + "..."
            formatted.append(f"{role}: {content}")

        return "\n".join(formatted)

    def chat_stream(
        self,
        query: str,
        source_id: str,
        user_id: str,
        conversation_history: list[dict],
        supabase,
    ):
        """
        Full RAG pipeline:
        1. Retrieve relevant chunks
        2. Format context and history
        3. Stream LLM response
        4. Yield source citations at the end
        """

        # 1. Retrieve relevant chunks
        print(f"[RAG] Retrieving context for: {query[:50]}...")
        chunks = self.retrieve_context(query, source_id, user_id, supabase)
        print(f"[RAG] Found {len(chunks)} relevant chunks")

        # 2. Format context and history
        context = self.format_context(chunks)
        history = self.format_history(conversation_history)

        # 3. Build the system prompt
        system_prompt = RAG_SYSTEM_PROMPT.format(
            context=context,
            history=history,
        )

        # 4. Stream the LLM response
        print("[RAG] Streaming LLM response...")
        for token in self.llm.stream_response(query, system_prompt):
            yield token

        # 5. Yield source citations as a special marker at the end
        cited_sources = []
        for i, chunk in enumerate(chunks):
            cited_sources.append(
                {
                    "index": i + 1,
                    "content": chunk["content"][:200],
                    "page": chunk.get("page_number"),
                    "similarity": round(chunk.get("similarity", 0), 3),
                }
            )

        yield f"\n\n<!--SOURCES:{json.dumps(cited_sources)}-->"
