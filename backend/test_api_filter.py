
import requests
import urllib.parse

BASE_URL = "http://127.0.0.1:8000/api/v1/content/podcasts/"

def test_filter(category_name):
    print(f"Testing filter for: '{category_name}'")
    
    # 1. Manual construction to match axios behavior roughly, but requests handles params
    params = {'category': category_name}
    try:
        r = requests.get(BASE_URL, params=params)
        print(f"URL: {r.url}") # Check encoding
        if r.status_code == 200:
            data = r.json()
            count = data.get('count', 0)
            results = data.get('results', [])
            print(f"Status: 200 OK. Found {count} results.")
            for p in results:
                print(f" - {p.get('title')} (Category: {p.get('category')})")
        else:
            print(f"Status: {r.status_code}")
            print(r.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("--- Testing API Filtering ---")
    test_filter("News & Archives")
    print("\n--- Testing Partial/Alternative ---")
    test_filter("News") # Should fail if exact match required
