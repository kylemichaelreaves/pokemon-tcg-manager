"""
Pokemon TCG Card Image Scraper
Supports:
  - English galleries: tcg.pokemon.com/en-us/galleries/<set>/
  - Japanese galleries: www.pokemon-card.com/ex/<set>/index.html

Usage:
    pip install playwright requests
    playwright install chromium
    python scrape_pokemon_cards.py [optional_url]
"""
import asyncio
import re
import os
import sys
from urllib.parse import urljoin, urlparse
from pathlib import Path
try:
    from playwright.async_api import async_playwright
    import requests
except ImportError:
    print("Missing dependencies. Run:\n  pip install playwright requests\n  playwright install chromium")
    sys.exit(1)
GALLERY_URL = "https://tcg.pokemon.com/en-us/galleries/151/"


def detect_site(url: str) -> str:
    """Return 'jp' for pokemon-card.com, 'en' otherwise."""
    host = urlparse(url).hostname or ""
    if "pokemon-card.com" in host:
        return "jp"
    return "en"


OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "card-images"


async def scrape_jp_card_images(gallery_url: str) -> list[dict]:
    """Scrape full-size card images from pokemon-card.com (Japanese site).

    Uses Playwright to navigate to the card list page (JS-rendered).
    The list page shows full-size images directly (no detail pages needed).
    Scrolls to trigger lazy-loaded images, then paginates through all pages.
    """
    base_url = "https://www.pokemon-card.com"
    results: list[dict] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )

        # Load the gallery page and find the card list link
        print(f"Loading gallery: {gallery_url}")
        await page.goto(gallery_url, wait_until="domcontentloaded", timeout=60_000)
        await asyncio.sleep(2)

        card_list_link = page.locator('a[href*="/card-search/index.php"]').first
        card_list_href = await card_list_link.get_attribute("href")
        card_list_url = urljoin(base_url, card_list_href)
        print(f"Navigating to card list: {card_list_url}")
        await page.goto(card_list_url, wait_until="domcontentloaded", timeout=60_000)

        # Wait for JS-rendered card results to appear
        await asyncio.sleep(5)

        page_num = 1
        while True:
            # Wait for card images to render
            try:
                await page.wait_for_selector(
                    'img[src*="/card_images/large/"]',
                    timeout=10_000,
                )
            except Exception:
                print(f"  Page {page_num}: no card images found, stopping.")
                break

            # Scroll to bottom to trigger lazy-loaded images
            for _ in range(15):
                await page.evaluate("window.scrollBy(0, 600)")
                await asyncio.sleep(0.4)
            # Scroll back up and wait for images to resolve
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(2)

            # Extract all full-size card images from the current page
            cards_on_page = await page.evaluate("""
                () => Array.from(
                    document.querySelectorAll('img[src*="/card_images/large/"]')
                ).map(img => ({
                    url: img.getAttribute('src'),
                    name: img.getAttribute('alt') || ''
                }))
            """)
            results.extend(cards_on_page)
            print(f"  Page {page_num}: found {len(cards_on_page)} cards")

            # Try to click "次のページ" (next page)
            # Pagination is a Vue component — elements are <div>/<span>, not <a>
            next_btn = page.locator('div.next, div.nextButton').first
            try:
                await next_btn.wait_for(state="visible", timeout=5_000)
                await next_btn.scroll_into_view_if_needed()
                await next_btn.click()
                # Wait for new card images to load after page change
                await asyncio.sleep(5)
                page_num += 1
            except Exception:
                break  # No more pages

        await browser.close()

    # Resolve relative URLs and deduplicate
    seen = set()
    unique = []
    for card in results:
        full_url = urljoin(base_url, card["url"])
        if full_url not in seen:
            seen.add(full_url)
            unique.append({"url": full_url, "name": card["name"].strip()})

    print(f"Found {len(unique)} unique card images across {page_num} page(s).")
    return unique


async def scrape_card_images(gallery_url: str) -> list[dict]:
    """
    Open the gallery page in a headless browser, scroll to load all cards,
    and collect card image URLs + names.
    """
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )
        print(f"Loading: {gallery_url}")
        await page.goto(gallery_url, wait_until="networkidle", timeout=60_000)
        # Click "View All" button if present to load all cards at once
        try:
            view_all = page.locator("button.gallery__loadMoreButton").first
            await view_all.wait_for(state="visible", timeout=10_000)
            print("Clicking 'View All'...")
            await view_all.click()
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(3)
        except Exception:
            pass
        # Scroll to bottom repeatedly to trigger lazy loading
        print("Scrolling to load all cards...")
        prev_height = 0
        for _ in range(30):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.5)
            height = await page.evaluate("document.body.scrollHeight")
            if height == prev_height:
                break
            prev_height = height
        # Give lazy images a moment to resolve
        await asyncio.sleep(2)
        # --- Extract card images between "See All" filter and "Want to See More" ---
        # After clicking "View All", card images sit between the "See All" filter
        # button (inside .card-gallery__controls) and the "Want to see more?" callout.
        raw_cards = await page.evaluate("""
            () => {
                const allElements = Array.from(document.querySelectorAll('*'));

                // Upper boundary: the "See All" filter button
                const seeAllBtn = document.querySelector('button.button__filter');
                // Lower boundary: the "Want to See More" database callout
                const wantMoreEl = document.querySelector('.database-callout--inner');

                if (!seeAllBtn || !wantMoreEl) return [];

                const seeAllIdx = allElements.indexOf(seeAllBtn);
                const wantMoreIdx = allElements.indexOf(wantMoreEl);

                if (seeAllIdx === -1 || wantMoreIdx === -1) return [];

                // Collect all <img> elements between the two boundaries
                const imgs = [];
                for (let i = seeAllIdx + 1; i < wantMoreIdx; i++) {
                    const el = allElements[i];
                    if (el.tagName === 'IMG') {
                        const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
                        const alt = el.getAttribute('alt') || '';
                        if (src) imgs.push({ src, alt });
                    }
                }
                return imgs;
            }
        """)

        for item in raw_cards:
            src = item["src"]
            alt = item["alt"]
            if any(skip in src for skip in ["logo", "icon", "banner", "sprite", "background", "favicon", "nav", "divider", "card-back"]):
                continue
            if re.search(r"\.(png|jpg|webp)(\?|$)", src, re.IGNORECASE):
                full_url = urljoin(gallery_url, src)
                results.append({"url": full_url, "name": alt.strip()})
        await browser.close()
    # Deduplicate by URL
    seen = set()
    unique = []
    for r in results:
        if r["url"] not in seen:
            seen.add(r["url"])
            unique.append(r)
    print(f"Found {len(unique)} card images.")
    return unique


def download_images(cards: list[dict], output_dir: Path, referer: str = "https://tcg.pokemon.com/"):
    output_dir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": referer,
    })
    for i, card in enumerate(cards, 1):
        url = card["url"]
        ext = re.search(r"\.(png|jpg|webp)", url, re.IGNORECASE)
        ext = ext.group(0) if ext else ".png"
        # Use alt text as filename, fallback to index
        safe_name = re.sub(r"[^\w\s-]", "", card["name"]).strip().replace(" ", "_") or f"card_{i:03d}"
        filename = output_dir / f"{i:03d}_{safe_name}{ext}"
        if filename.exists():
            print(f"  [{i}/{len(cards)}] Already exists: {filename.name}")
            continue
        try:
            resp = session.get(url, timeout=15)
            resp.raise_for_status()
            filename.write_bytes(resp.content)
            print(f"  [{i}/{len(cards)}] Saved: {filename.name}")
        except Exception as e:
            print(f"  [{i}/{len(cards)}] FAILED {url}: {e}")


async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else GALLERY_URL
    site = detect_site(url)

    if site == "jp":
        slug_match = re.search(r"/ex/([^/#]+)", url)
        folder = OUTPUT_DIR / (slug_match.group(1) if slug_match else "pokemon_cards_jp")
        cards = await scrape_jp_card_images(url)
        referer = "https://www.pokemon-card.com/"
    else:
        slug_match = re.search(r"/galleries/([^/#]+)", url)
        folder = OUTPUT_DIR / (slug_match.group(1) if slug_match else "pokemon_cards")
        cards = await scrape_card_images(url)
        referer = "https://tcg.pokemon.com/"

    if not cards:
        print("No card images found. The page structure may have changed — inspect the page manually.")
        return
    print(f"\nDownloading {len(cards)} images to {folder}/")
    download_images(cards, folder, referer=referer)
    print("\nDone!")
if __name__ == "__main__":
    asyncio.run(main())
