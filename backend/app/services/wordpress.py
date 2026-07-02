import requests
from requests.auth import HTTPBasicAuth
from typing import Dict, Optional
import re
from bs4 import BeautifulSoup


def get_post_id_by_url(api_url: str, post_url: str, app_password: str, username: str) -> Optional[int]:
    """
    Get the WordPress post ID by its URL using the REST API.
    """
    # Extract the slug from the URL (the last part after the last slash)
    slug = post_url.rstrip('/').split('/')[-1]
    
    # Try to find the post by slug
    response = requests.get(
        f"{api_url}wp/v2/posts",
        params={'slug': slug},
        auth=HTTPBasicAuth(username, app_password),
        timeout=10
    )
    
    if response.status_code == 200 and response.json():
        return response.json()[0]['id']
    
    return None


def insert_link_into_post(
    api_url: str,
    app_password: str,
    username: str,
    post_id: int,
    target_url: str,
    anchor_text: str,
    link_type: str = 'internal'
) -> bool:
    """
    Insert an anchor link into a WordPress post.
    
    Finds the first occurrence of the anchor text in the post content
    and wraps it with an <a> tag linking to the target URL.
    """
    # Step 1: Get the current post content
    auth = HTTPBasicAuth(username, app_password)
    
    response = requests.get(
        f"{api_url}wp/v2/posts/{post_id}",
        auth=auth,
        timeout=10
    )
    
    if response.status_code != 200:
        print(f"Failed to fetch post {post_id}: {response.status_code}")
        return False
    
    post = response.json()
    content = post['content']['raw']  # raw HTML content
    
    # Step 2: Find the anchor text in the content (case-insensitive)
    # We'll use regex to find the first occurrence
    pattern = re.compile(re.escape(anchor_text), re.IGNORECASE)
    match = pattern.search(content)
    
    if match:
        # Replace the matched text with an anchor link
        link_html = f'<a href="{target_url}" rel="{link_type}">{match.group()}</a>'
        new_content = content[:match.start()] + link_html + content[match.end():]
        print(f"Found anchor text '{anchor_text}' and replaced it with link.")
    else:
        # Fallback: Append a paragraph with the link at the end of the content
        print(f"Anchor text '{anchor_text}' not found in content. Appending at end.")
        link_html = f'<p>Read more: <a href="{target_url}" rel="{link_type}">{anchor_text}</a></p>'
        new_content = content + '\n\n' + link_html
    
    # Step 3: Update the post with the new content
    update_response = requests.post(
        f"{api_url}wp/v2/posts/{post_id}",
        auth=auth,
        json={'content': new_content},
        timeout=10
    )
    
    if update_response.status_code == 200:
        print(f"Successfully inserted link into post {post_id}")
        return True
    else:
        print(f"Failed to update post {post_id}: {update_response.status_code} - {update_response.text}")
        return False


def verify_connection(api_url: str, app_password: str, username: str) -> bool:
    """
    Test if the WordPress connection works by fetching the current user.
    """
    try:
        response = requests.get(
            f"{api_url}wp/v2/users/me",
            auth=HTTPBasicAuth(username, app_password),
            timeout=10
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False