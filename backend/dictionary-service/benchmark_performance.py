"""
Performance Benchmark Script for Optimized Dictionary Service
Tests response times, cache performance, and throughput
"""

import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "http://localhost:5002/api/dictionary"  # Dictionary service with API prefix
WARMUP_REQUESTS = 10
BENCHMARK_REQUESTS = 100
CONCURRENT_WORKERS = 10

# Test words
TEST_WORDS = [
    # Vedda -> Sinhala
    ('ඉස්තොප්පුව', 'vedda', 'sinhala'),
    ('නාකි', 'vedda', 'sinhala'),
    ('පැන්දුරු', 'vedda', 'sinhala'),
    ('දන්නංගලා', 'vedda', 'sinhala'),
    ('නේ', 'vedda', 'sinhala'),
    # Sinhala -> Vedda
    ('මවුස්', 'sinhala', 'vedda'),
    ('කුරුල්ලා', 'sinhala', 'vedda'),
    ('බලු', 'sinhala', 'vedda'),
    ('ඇස', 'sinhala', 'vedda'),
    ('කොළ', 'sinhala', 'vedda'),
]


def test_translate_endpoint(word, source, target):
    """Test the /translate endpoint"""
    start_time = time.perf_counter()
    response = requests.get(
        f"{BASE_URL}/translate",
        params={'word': word, 'source': source, 'target': target},
        timeout=5
    )
    elapsed = (time.perf_counter() - start_time) * 1000  # Convert to ms
    return elapsed, response.status_code == 200


def test_batch_translate(words_batch):
    """Test the /translate/batch endpoint"""
    words = [w[0] for w in words_batch]
    source = words_batch[0][1]
    target = words_batch[0][2]
    
    start_time = time.perf_counter()
    response = requests.post(
        f"{BASE_URL}/translate/batch",
        json={'words': words, 'source': source, 'target': target},
        timeout=10
    )
    elapsed = (time.perf_counter() - start_time) * 1000
    return elapsed, response.status_code == 200


def test_search_endpoint(query):
    """Test the /search endpoint"""
    start_time = time.perf_counter()
    response = requests.get(
        f"{BASE_URL}/search",
        params={'q': query, 'limit': 10},
        timeout=5
    )
    elapsed = (time.perf_counter() - start_time) * 1000
    return elapsed, response.status_code == 200


def get_cache_stats():
    """Get cache statistics"""
    response = requests.get(f"{BASE_URL}/stats", timeout=5)
    if response.status_code == 200:
        return response.json()['stats'].get('cache', {})
    return {}


def clear_cache():
    """Clear the cache"""
    requests.post(f"{BASE_URL}/cache/clear", timeout=5)


def benchmark_single_requests():
    """Benchmark individual translation requests"""
    print("\n" + "="*60)
    print("BENCHMARK: Single Translation Requests (/translate)")
    print("="*60)
    
    # Clear cache before starting
    clear_cache()
    
    # Warmup
    print(f"\n🔥 Warming up with {WARMUP_REQUESTS} requests...")
    for i in range(WARMUP_REQUESTS):
        word, source, target = TEST_WORDS[i % len(TEST_WORDS)]
        test_translate_endpoint(word, source, target)
    
    # Benchmark
    print(f"\n📊 Running {BENCHMARK_REQUESTS} translation requests...")
    times = []
    success_count = 0
    
    for i in range(BENCHMARK_REQUESTS):
        word, source, target = TEST_WORDS[i % len(TEST_WORDS)]
        elapsed, success = test_translate_endpoint(word, source, target)
        times.append(elapsed)
        if success:
            success_count += 1
    
    # Statistics
    print(f"\n✅ Results:")
    print(f"   Total requests: {BENCHMARK_REQUESTS}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {BENCHMARK_REQUESTS - success_count}")
    print(f"\n⏱️  Response Times:")
    print(f"   Min: {min(times):.2f} ms")
    print(f"   Max: {max(times):.2f} ms")
    print(f"   Mean: {statistics.mean(times):.2f} ms")
    print(f"   Median: {statistics.median(times):.2f} ms")
    print(f"   Std Dev: {statistics.stdev(times):.2f} ms")
    
    # Cache stats
    cache_stats = get_cache_stats()
    if cache_stats:
        print(f"\n💾 Cache Performance:")
        print(f"   Hits: {cache_stats.get('hits', 0)}")
        print(f"   Misses: {cache_stats.get('misses', 0)}")
        print(f"   Hit Rate: {cache_stats.get('hit_rate', 'N/A')}")
        print(f"   Cache Size: {cache_stats.get('size', 0)}/{cache_stats.get('maxsize', 0)}")
    
    return times


def benchmark_concurrent_requests():
    """Benchmark concurrent translation requests"""
    print("\n" + "="*60)
    print(f"BENCHMARK: Concurrent Requests ({CONCURRENT_WORKERS} workers)")
    print("="*60)
    
    # Clear cache before starting
    clear_cache()
    
    print(f"\n📊 Running {BENCHMARK_REQUESTS} concurrent requests...")
    times = []
    success_count = 0
    
    start_time = time.perf_counter()
    
    with ThreadPoolExecutor(max_workers=CONCURRENT_WORKERS) as executor:
        futures = []
        for i in range(BENCHMARK_REQUESTS):
            word, source, target = TEST_WORDS[i % len(TEST_WORDS)]
            future = executor.submit(test_translate_endpoint, word, source, target)
            futures.append(future)
        
        for future in as_completed(futures):
            elapsed, success = future.result()
            times.append(elapsed)
            if success:
                success_count += 1
    
    total_time = (time.perf_counter() - start_time) * 1000
    
    # Statistics
    print(f"\n✅ Results:")
    print(f"   Total requests: {BENCHMARK_REQUESTS}")
    print(f"   Successful: {success_count}")
    print(f"   Total time: {total_time:.2f} ms")
    print(f"   Throughput: {(BENCHMARK_REQUESTS / total_time * 1000):.2f} req/sec")
    print(f"\n⏱️  Response Times:")
    print(f"   Min: {min(times):.2f} ms")
    print(f"   Max: {max(times):.2f} ms")
    print(f"   Mean: {statistics.mean(times):.2f} ms")
    print(f"   Median: {statistics.median(times):.2f} ms")
    
    # Cache stats
    cache_stats = get_cache_stats()
    if cache_stats:
        print(f"\n💾 Cache Performance:")
        print(f"   Hits: {cache_stats.get('hits', 0)}")
        print(f"   Misses: {cache_stats.get('misses', 0)}")
        print(f"   Hit Rate: {cache_stats.get('hit_rate', 'N/A')}")


def benchmark_batch_requests():
    """Benchmark batch translation requests"""
    print("\n" + "="*60)
    print("BENCHMARK: Batch Translation (/translate/batch)")
    print("="*60)
    
    clear_cache()
    
    print(f"\n📊 Running batch translation tests...")
    batch_sizes = [5, 10, 20, 50]
    
    for batch_size in batch_sizes:
        times = []
        for _ in range(10):  # 10 batches per size
            batch = TEST_WORDS[:batch_size]
            elapsed, success = test_batch_translate(batch)
            if success:
                times.append(elapsed)
        
        if times:
            print(f"\n📦 Batch size: {batch_size} words")
            print(f"   Mean time: {statistics.mean(times):.2f} ms")
            print(f"   Time per word: {statistics.mean(times) / batch_size:.2f} ms")


def benchmark_search_requests():
    """Benchmark search endpoint"""
    print("\n" + "="*60)
    print("BENCHMARK: Search Requests (/search)")
    print("="*60)
    
    search_queries = ['නා', 'ඉස්', 'පැ', 'දන්', 'මව']
    
    print(f"\n📊 Running search benchmarks...")
    times = []
    
    for _ in range(20):
        for query in search_queries:
            elapsed, success = test_search_endpoint(query)
            if success:
                times.append(elapsed)
    
    print(f"\n✅ Results ({len(times)} searches):")
    print(f"   Min: {min(times):.2f} ms")
    print(f"   Max: {max(times):.2f} ms")
    print(f"   Mean: {statistics.mean(times):.2f} ms")
    print(f"   Median: {statistics.median(times):.2f} ms")


def main():
    """Run all benchmarks"""
    print("\n" + "🚀" * 30)
    print("   DICTIONARY SERVICE PERFORMANCE BENCHMARK")
    print("🚀" * 30)
    
    try:
        # Check if service is running
        response = requests.get(f"{BASE_URL}/stats", timeout=5)
        if response.status_code != 200:
            print("\n❌ Error: Dictionary service not responding")
            print(f"   Make sure it's running on {BASE_URL}")
            return
        
        print(f"\n✅ Dictionary service is running on {BASE_URL}")
        
        # Run benchmarks
        benchmark_single_requests()
        benchmark_concurrent_requests()
        benchmark_batch_requests()
        benchmark_search_requests()
        
        print("\n" + "="*60)
        print("✨ All benchmarks completed!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error: Could not connect to {BASE_URL}")
        print("   Make sure the dictionary service is running")
    except Exception as e:
        print(f"\n❌ Error running benchmarks: {e}")


if __name__ == "__main__":
    main()
