#!/usr/bin/env python3
import os
import re
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup
import html

def parse_date(date_str):
    """Convert 'Mar 21, 2023' to '2023-03-21'"""
    try:
        date_obj = datetime.strptime(date_str.strip(), '%b %d, %Y')
        return date_obj.strftime('%Y-%m-%d')
    except:
        return '2023-01-01'

def get_thumbnail(tags):
    """Determine thumbnail based on tags"""
    tags_lower = [tag.lower() for tag in tags]

    if 'javascript' in tags_lower or 'js' in tags_lower:
        return '/thumbnails/javascript.png'
    elif 'css' in tags_lower:
        return '/thumbnails/css.png'
    elif 'algorithm' in tags_lower:
        return '/thumbnails/js-algorithm.png'
    elif 'react' in tags_lower:
        return '/thumbnails/react.png'
    elif 'typescript' in tags_lower:
        return '/thumbnails/typescript.png'
    elif 'retrospective' in tags_lower:
        return '/thumbnails/retrospective.png'
    else:
        return '/thumbnails/default.png'

def slugify(text):
    """Convert title to filename slug"""
    # Remove emojis and special characters
    text = re.sub(r'[^\w\s가-힣-]', '', text)
    text = text.strip().lower()
    # Replace spaces and multiple hyphens
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text

def html_to_markdown(html_content):
    """Convert HTML content to markdown"""
    soup = BeautifulSoup(html_content, 'html.parser')

    # Convert headings
    for i in range(1, 7):
        for heading in soup.find_all(f'h{i}'):
            heading_text = heading.get_text().strip()
            heading.replace_with(f"\n{'#' * i} {heading_text}\n\n")

    # Convert blockquotes to Callout
    for blockquote in soup.find_all('blockquote'):
        content = blockquote.get_text().strip()
        blockquote.replace_with(f'\n<Callout>\n{content}\n</Callout>\n\n')

    # Convert code blocks
    for figure in soup.find_all('figure', class_='highlight'):
        code_block = figure.find('td', class_='code')
        if code_block:
            # Get language from class
            classes = figure.get('class', [])
            language = 'text'
            for cls in classes:
                if cls.startswith('highlight'):
                    continue
                elif cls in ['jsx', 'javascript', 'js', 'typescript', 'ts', 'python', 'css', 'html', 'bash']:
                    language = cls
                    break

            # Get code content
            code_text = code_block.get_text()
            figure.replace_with(f'\n```{language}\n{code_text}\n```\n\n')

    # Convert inline code
    for code in soup.find_all('code'):
        code_text = code.get_text()
        if code.parent.name != 'pre':
            code.replace_with(f'`{code_text}`')

    # Convert lists
    for ul in soup.find_all('ul'):
        items = []
        for li in ul.find_all('li', recursive=False):
            items.append(f"- {li.get_text().strip()}")
        ul.replace_with('\n' + '\n'.join(items) + '\n\n')

    for ol in soup.find_all('ol'):
        items = []
        for idx, li in enumerate(ol.find_all('li', recursive=False), 1):
            items.append(f"{idx}. {li.get_text().strip()}")
        ol.replace_with('\n' + '\n'.join(items) + '\n\n')

    # Convert links
    for a in soup.find_all('a'):
        href = a.get('href', '')
        text = a.get_text()
        if href and not href.startswith('#'):
            a.replace_with(f'[{text}]({href})')
        else:
            a.replace_with(text)

    # Convert images
    for img in soup.find_all('img'):
        src = img.get('src', '')
        alt = img.get('alt', '')
        if src:
            img.replace_with(f'\n![{alt}]({src})\n\n')

    # Convert strong/bold
    for strong in soup.find_all(['strong', 'b']):
        text = strong.get_text()
        strong.replace_with(f'**{text}**')

    # Convert emphasis/italic
    for em in soup.find_all(['em', 'i']):
        text = em.get_text()
        em.replace_with(f'*{text}*')

    # Get final text
    text = soup.get_text()

    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+\n', '\n', text)

    return text.strip()

def extract_content_from_html(html_path):
    """Extract metadata and content from HTML file"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    # Extract title
    title_elem = soup.find('div', class_='post-title')
    title = title_elem.get_text().strip() if title_elem else 'Untitled'

    # Extract date
    date_elem = soup.find('span', class_='post-date')
    date_str = date_elem.get_text().strip() if date_elem else 'Jan 1, 2023'
    date = parse_date(date_str)

    # Extract tags
    tags = []
    tag_list = soup.find('div', class_='tag-list')
    if tag_list:
        for tag_elem in tag_list.find_all('span', class_='post-tag'):
            tag_text = tag_elem.get_text().strip()
            if tag_text:
                tags.append(tag_text)

    # Extract content
    post_content = soup.find('div', class_='post-content')
    if post_content:
        content_html = str(post_content)
        markdown_content = html_to_markdown(content_html)
    else:
        markdown_content = ''

    return {
        'title': title,
        'date': date,
        'tags': tags,
        'content': markdown_content
    }

def create_mdx_file(data, output_path):
    """Create MDX file with frontmatter and content"""
    title = data['title']
    date = data['date']
    tags = data['tags']
    content = data['content']
    thumbnail = get_thumbnail(tags)

    # Create frontmatter
    frontmatter = f"""---
title: "{title}"
description: "{title}"
date: {date}
tags: [{', '.join([f'"{tag}"' for tag in tags])}]
thumbnail: {thumbnail}

---

"""

    # Add imports if needed
    imports = ""
    if '<Callout>' in content:
        imports += "import Callout from '@/components/Callout'\n"
    if '<Steps>' in content:
        imports += "import Steps from '@/components/Steps'\n"

    if imports:
        imports += "\n"

    # Combine everything
    mdx_content = frontmatter + imports + content

    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(mdx_content)

def process_archive_directory(archive_dir, output_dir):
    """Process a single archive directory"""
    html_file = os.path.join(archive_dir, 'index.html')

    if not os.path.exists(html_file):
        return None, "No index.html found"

    try:
        # Extract data
        data = extract_content_from_html(html_file)

        # Generate filename
        slug = slugify(data['title'])
        if not slug:
            slug = os.path.basename(archive_dir).replace('-archive', '')

        filename = f"{slug}.mdx"
        output_path = os.path.join(output_dir, filename)

        # Check if file already exists
        if os.path.exists(output_path):
            return None, f"File already exists: {filename}"

        # Create MDX file
        create_mdx_file(data, output_path)

        return filename, None
    except Exception as e:
        return None, f"Error: {str(e)}"

def main():
    base_dir = '/Users/jaerin/Documents/jane-dev/leejaelll.github.io'
    archives_dir = os.path.join(base_dir, '2023')
    output_dir = os.path.join(base_dir, 'blog/content')

    # Skip this directory as mentioned
    skip_dirs = ['230321-archive']

    # Find all archive directories
    archive_dirs = []
    for item in sorted(os.listdir(archives_dir)):
        if item.endswith('-archive') and item not in skip_dirs:
            full_path = os.path.join(archives_dir, item)
            if os.path.isdir(full_path):
                archive_dirs.append(full_path)

    print(f"Found {len(archive_dirs)} archive directories to process")
    print("-" * 80)

    results = {
        'success': [],
        'skipped': [],
        'errors': []
    }

    for archive_dir in archive_dirs:
        dir_name = os.path.basename(archive_dir)
        filename, error = process_archive_directory(archive_dir, output_dir)

        if error:
            if 'already exists' in error:
                results['skipped'].append((dir_name, error))
                print(f"⏭️  SKIPPED: {dir_name} - {error}")
            else:
                results['errors'].append((dir_name, error))
                print(f"❌ ERROR: {dir_name} - {error}")
        else:
            results['success'].append((dir_name, filename))
            print(f"✅ SUCCESS: {dir_name} -> {filename}")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Successfully converted: {len(results['success'])}")
    print(f"⏭️  Skipped (already exists): {len(results['skipped'])}")
    print(f"❌ Errors: {len(results['errors'])}")

    if results['success']:
        print("\n📝 Successfully converted files:")
        for dir_name, filename in results['success']:
            print(f"  {dir_name} -> {filename}")

    if results['errors']:
        print("\n❌ Files with errors:")
        for dir_name, error in results['errors']:
            print(f"  {dir_name}: {error}")

if __name__ == '__main__':
    main()
