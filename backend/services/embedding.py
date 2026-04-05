"""
Embedding service using sentence-transformers for semantic search.
Model: sentence-transformers/all-MiniLM-L6-v2 (384-dimension embeddings)
"""

from typing import List
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """Initialize the embedding model (cached after first load)."""
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = 384  # all-MiniLM-L6-v2 outputs 384-dim vectors

    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single text string.
        Returns: list of 384 floats representing the embedding.
        """
        if not text or not text.strip():
            return [0.0] * self.embedding_dim
        
        embedding = self.model.encode(text.strip(), convert_to_numpy=True)
        return embedding.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed multiple texts efficiently.
        Returns: list of embeddings.
        """
        if not texts:
            return []
        
        # Filter empty texts
        texts = [t.strip() for t in texts if t and t.strip()]
        if not texts:
            return []
        
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()


# Global instance (lazy-loaded on first use)
embedding_service: EmbeddingService = None


def get_embedding_service() -> EmbeddingService:
    """Get or initialize the embedding service."""
    global embedding_service
    if embedding_service is None:
        embedding_service = EmbeddingService()
    return embedding_service
