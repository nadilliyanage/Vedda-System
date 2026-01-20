import requests
import time

text = "hello world"
print(f"\n🔄 Translating: '{text}' (English → Vedda)")

start = time.perf_counter()
response = requests.post(
    "http://127.0.0.1:5001/api/translate",
    json={
        "text": text,
        "source_language": "english",
        "target_language": "vedda"
    },
    timeout=30
)
elapsed_ms = (time.perf_counter() - start) * 1000

if response.status_code == 200:
    result = response.json()
    print(f"✅ Result: {result.get('translated_text', '')}")
    print(f"⏱️  Time: {elapsed_ms:.0f}ms")
    print(f"📊 Confidence: {result.get('confidence', 0):.2f}")
else:
    print(f"❌ Failed: HTTP {response.status_code}")
