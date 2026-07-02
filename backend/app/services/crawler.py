import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def crawl_site(site_url: str) -> List[Dict]:
    """
    Crawl a WordPress site and return all blog posts with their content.
    """
    posts = []
    
    # Try to get posts from sitemap first
    sitemap_urls = get_sitemap_urls(site_url)
    
    if sitemap_urls:
        print(f"Found {len(sitemap_urls)} URLs in sitemap")
        for url in sitemap_urls:
            # Only process URLs that look like blog posts
            if is_blog_post_url(url):
                post_data = fetch_post(url)
                if post_data:
                    posts.append(post_data)
    else:
        # Fallback: try WordPress REST API
        print("No sitemap found, trying REST API...")
        posts = fetch_posts_via_api(site_url)
    
    print(f"Successfully crawled {len(posts)} posts")
    return posts


def get_sitemap_urls(site_url: str) -> List[str]:
    """Fetch all URLs from sitemap.xml"""
    sitemap_url = site_url.rstrip('/') + '/sitemap.xml'
    
    try:
        response = requests.get(sitemap_url, timeout=15)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'xml')
            urls = []
            
            # Find all <loc> tags (they contain the URLs)
            for loc in soup.find_all('loc'):
                url = loc.text.strip()
                urls.append(url)
            
            return urls
    except Exception as e:
        print(f"Could not fetch sitemap: {e}")
    
    return []


def is_blog_post_url(url: str) -> bool:
    """Check if a URL looks like a blog post (not a page or category)"""
    # Skip common non-post URLs
    skip_patterns = [
        '/category/', '/tag/', '/author/', '/page/', 
        '/feed/', '/comments/', '/trackback/',
        '/wp-json/', '/wp-content/', '/wp-admin/',
        '/about', '/contact', '/privacy', '/terms'
    ]
    
    for pattern in skip_patterns:
        if pattern in url.lower():
            return False
    
    return True


def fetch_post(url: str) -> Dict:
    """Fetch a single post and extract its content"""
    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = ''
        title_selectors = ['h1', 'h1.entry-title', '.entry-title', '.post-title', 'h1.title']
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text(strip=True)
                break
        
        # Extract main content
        content_selectors = [
            'article', 
            '.post-content', 
            '.entry-content', 
            '.content',
            'main',
            '.post',
            '.article-body'
        ]
        
        article = None
        for selector in content_selectors:
            article = soup.select_one(selector)
            if article:
                break
        
        if not article:
            article = soup.find('body')
        
        content = str(article) if article else ''
        plain_text = article.get_text(separator=' ', strip=True) if article else ''
        
        return {
            'url': url,
            'title': title,
            'content': content,
            'plain_text': plain_text
        }
        
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def fetch_posts_via_api(site_url: str) -> List[Dict]:
    """Fallback: fetch posts using WordPress REST API"""
    api_url = site_url.rstrip('/') + '/wp-json/wp/v2/posts'
    posts = []
    page = 1
    
    try:
        while True:
            response = requests.get(
                api_url,
                params={
                    'page': page,
                    'per_page': 100,
                    '_fields': 'id,title,link,content,slug'
                },
                timeout=15
            )
            
            if response.status_code != 200:
                break
            
            data = response.json()
            if not data:
                break
            
            for post_data in data:
                # Extract plain text from HTML content
                content_html = post_data.get('content', {}).get('rendered', '')
                soup = BeautifulSoup(content_html, 'html.parser')
                plain_text = soup.get_text(separator=' ', strip=True)
                
                posts.append({
                    'url': post_data.get('link', ''),
                    'title': post_data.get('title', {}).get('rendered', ''),
                    'content': content_html,
                    'plain_text': plain_text
                })
            
            page += 1
            
    except Exception as e:
        print(f"Error fetching via API: {e}")
    
    return posts