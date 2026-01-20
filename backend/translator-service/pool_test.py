import requests
import time

tests = [
    ("hello world", "english", "vedda"),
    ("bird eye", "english", "vedda"),
    ("sun moon", "english", "vedda"),
    ("forest animal", "english", "vedda"),
    ("water fire", "english", "vedda")
]

print("\n" + "="*60)
print("TESTING CONNECTION POOLING PERFORMANCE")
print("="*60)

times = []

for i, (text, source, target) in enumerate(tests, 1):
    print(f"\n🔄 Test {i}: '{text}' ({source} → {target})")
    
    start = time.perf_counter()
    response = requests.post(
        "http://127.0.0.1:5001/api/translate",
        json={
            "text": text,
            "source_language": source,
            "target_language": target
        },
        timeout=30
    )
    elapsed_ms = (time.perf_counter() - start) * 1000
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ Result: {result.get('translated_text', '')}")
        print(f"   ⏱️  Time: {elapsed_ms:.0f}ms")
        times.append(elapsed_ms)
    else:
        print(f"   ❌ Failed: HTTP {response.status_code}")

if times:
    print(f"\n" + "="*60)
    print(f"📊 RESULTS:")
    print(f"   First request: {times[0]:.0f}ms (cold start)")
    if len(times) > 1:
        avg_warm = sum(times[1:]) / len(times[1:])
        print(f"   Subsequent requests: {avg_warm:.0f}ms average (warm connections)")
        improvement = ((times[0] - avg_warm) / times[0]) * 100
        print(f"   Improvement: {improvement:.1f}% faster after warm-up!")
    print("="*60)
