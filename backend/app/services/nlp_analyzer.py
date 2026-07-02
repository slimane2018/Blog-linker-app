import spacy
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict
import re

# Load the language model (English)
# If you haven't downloaded it yet, we'll do that later
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Please run: python -m spacy download en_core_web_sm")
    nlp = None

# Load the sentence transformer model for similarity calculations
# This is a small model that converts sentences into numbers (embeddings)
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Could not load model: {e}")
    model = None


def extract_keywords(text: str) -> List[str]:
    """
    Extract important keywords and phrases from text.
    Uses spaCy to find noun chunks and named entities.
    """
    if nlp is None:
        return []
    
    doc = nlp(text)
    keywords = set()
    
    # Extract noun chunks (e.g., "SEO tips", "content marketing")
    for chunk in doc.noun_chunks:
        # Only keep if it's 2-5 words long (too short or too long are not useful)
        words = chunk.text.split()
        if 2 <= len(words) <= 5:
            # Remove punctuation from the ends
            clean = chunk.text.strip().lower().strip(".,!?;:'\"()[]")
            if clean:
                keywords.add(clean)
    
    # Extract named entities (e.g., "Google", "WordPress", "January 2024")
    for ent in doc.ents:
        words = ent.text.split()
        if 2 <= len(words) <= 5:
            clean = ent.text.strip().lower().strip(".,!?;:'\"()[]")
            if clean:
                keywords.add(clean)
    
    return list(keywords)


def analyze_opportunities(posts: List[Dict], similarity_threshold: float = 0.4) -> List[Dict]:
    """
    Find internal linking opportunities between blog posts.
    
    For each pair of posts, compute how similar they are.
    If they are similar enough, check if the source post contains 
    a keyword that also appears in the target post -> that's a linking opportunity.
    """
    if model is None or len(posts) < 2:
        return []
    
    opportunities = []
    
    # Step 1: Extract plain text for each post
    texts = []
    for post in posts:
        # Use plain_text if available, otherwise fall back to content
        text = post.get('plain_text') or post.get('content', '')
        texts.append(text)
    
    # Step 2: Compute embeddings (numerical representations) for all posts
    print("Computing embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True)
    
    # Step 3: Compare each pair of posts
    print("Finding opportunities...")
    for i, source in enumerate(posts):
        # Extract keywords from source post
        source_keywords = extract_keywords(source.get('plain_text') or source.get('content', ''))
        
        for j, target in enumerate(posts):
            if i == j:
                continue  # Skip comparing a post with itself
            
            # Compute similarity score (0 to 1, higher = more similar)
            similarity = float(util.cos_sim(embeddings[i], embeddings[j]).item())
            
            if similarity >= similarity_threshold:
                # Find the best anchor text
                best_anchor = find_best_anchor(source_keywords, target)
                
                if best_anchor:
                    # Get a snippet of context around the anchor text in the target
                    target_text = target.get('plain_text') or target.get('content', '')
                    snippet = get_context_snippet(target_text, best_anchor)
                    
                    opportunities.append({
                        'source_post_id': source.get('id'),
                        'target_post_id': target.get('id'),
                        'source_url': source.get('url'),
                        'target_url': target.get('url'),
                        'anchor_text': best_anchor,
                        'context_snippet': snippet,
                        'similarity_score': similarity,
                        'link_type': 'internal'
                    })
    
    # Remove duplicates (same source-target pair with similar anchor)
    unique_opps = remove_duplicates(opportunities)
    
    print(f"Found {len(unique_opps)} linking opportunities")
    return unique_opps


def find_best_anchor(keywords: List[str], target_post: Dict) -> str:
    """
    Find the best keyword from the source that also appears in the target post.
    Returns the first match (you can improve this later).
    """
    target_text = (target_post.get('plain_text') or target_post.get('content', '')).lower()
    
    for keyword in keywords:
        if keyword in target_text:
            return keyword
    
    return None


def get_context_snippet(text: str, anchor: str, context_chars: int = 150) -> str:
    """
    Get a snippet of text surrounding the anchor for display purposes.
    """
    text_lower = text.lower()
    anchor_lower = anchor.lower()
    
    idx = text_lower.find(anchor_lower)
    if idx == -1:
        return ""
    
    start = max(0, idx - context_chars)
    end = min(len(text), idx + len(anchor) + context_chars)
    
    snippet = text[start:end]
    
    # Add ellipsis if we cut off text
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    
    return snippet


def remove_duplicates(opportunities: List[Dict]) -> List[Dict]:
    """
    Remove duplicate opportunities (same source and target).
    Keep only the one with the highest similarity score.
    """
    seen = {}
    for opp in opportunities:
        key = (opp['source_post_id'], opp['target_post_id'])
        if key not in seen or opp['similarity_score'] > seen[key]['similarity_score']:
            seen[key] = opp
    
    return list(seen.values())