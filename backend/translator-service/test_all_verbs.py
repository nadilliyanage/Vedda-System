"""Test verb suffix removal for ALL Sinhala verbs"""
import requests
import json
import sys
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_multiple_verbs():
    """Test that verb normalization works for ALL Sinhala verbs"""

    base_url = "http://127.0.0.1:5001/api/translate"

    # Test cases for MULTIPLE verbs with different conjugations
    verb_tests = [
        {
            'verb': 'කනවා (eat)',
            'base_form': 'කනවා',
            'conjugations': [
                ('අපි කමු', 'We eat'),
                ('මම කමි', 'I eat'),
                ('ඔවුන් කති', 'They eat'),
                ('කෑවා', 'Ate'),
                ('කාලා', 'Having eaten'),
                ('කන්න', 'To eat'),
            ]
        },
        {
            'verb': 'යනවා (go)',
            'base_form': 'යනවා',
            'conjugations': [
                ('අපි යමු', 'We go'),
                ('මම යමි', 'I go'),
                ('ඔවුන් යති', 'They go'),
                ('ගියා', 'Went'),
                ('ගිහින්', 'Having gone'),
                ('යන්න', 'To go'),
            ]
        },
        {
            'verb': 'බලනවා (look)',
            'base_form': 'බලනවා',
            'conjugations': [
                ('අපි බලමු', 'We look'),
                ('මම බලමි', 'I look'),
                ('ඔවුන් බලති', 'They look'),
                ('බැලුවා', 'Looked'),
                ('බලලා', 'Having looked'),
                ('බලන්න', 'To look'),
            ]
        },
        {
            'verb': 'කියනවා (say)',
            'base_form': 'කියනවා',
            'conjugations': [
                ('අපි කියමු', 'We say'),
                ('මම කියමි', 'I say'),
                ('ඔවුන් කියති', 'They say'),
                ('කීවා', 'Said'),
                ('කියලා', 'Having said'),
                ('කියන්න', 'To say'),
            ]
        },
        {
            'verb': 'එනවා (come)',
            'base_form': 'එනවා',
            'conjugations': [
                ('අපි එමු', 'We come'),
                ('මම එමි', 'I come'),
                ('ඔවුන් එති', 'They come'),
                ('ආවා', 'Came'),
                ('ආවත්', 'Even came'),
                ('එන්න', 'To come'),
            ]
        },
        {
            'verb': 'ගනවා (take)',
            'base_form': 'ගනවා',
            'conjugations': [
                ('අපි ගමු', 'We take'),
                ('මම ගමි', 'I take'),
                ('ඔවුන් ගති', 'They take'),
                ('ගත්තා', 'Took'),
                ('ගෙන', 'Taking'),
                ('ගන්න', 'To take'),
            ]
        },
    ]

    print("\n" + "="*80)
    print("TESTING VERB NORMALIZATION FOR MULTIPLE VERBS")
    print("="*80)
    print("\nThis tests that Sinhala verb conjugations normalize correctly")
    print("for ALL verbs, not just one verb.\n")

    total_tests = 0
    successful_tests = 0
    failed_tests = []

    for verb_test in verb_tests:
        verb_name = verb_test['verb']
        base_form = verb_test['base_form']
        conjugations = verb_test['conjugations']

        print(f"\n{'='*80}")
        print(f"Testing: {verb_name} (Base: {base_form})")
        print(f"{'='*80}")

        for sinhala_text, description in conjugations:
            total_tests += 1
            print(f"\n  {description}")
            print(f"     Sinhala: {sinhala_text}")

            try:
                response = requests.post(
                    base_url,
                    json={
                        "text": sinhala_text,
                        "source_language": "sinhala",
                        "target_language": "vedda"
                    },
                    timeout=10
                )

                if response.status_code == 200:
                    result = response.json()
                    translated = result.get('translated_text', '')
                    confidence = result.get('confidence', 0)
                    note = result.get('note', '')

                    print(f"     Vedda:   {translated}")
                    print(f"     Confidence: {confidence:.2%}")

                    # Check if translation was successful (confidence > 70% or has dictionary hits)
                    if confidence >= 0.70:
                        print(f"     ✓ Success")
                        successful_tests += 1
                    else:
                        print(f"     ⚠ Low confidence")
                        failed_tests.append({
                            'verb': verb_name,
                            'sinhala': sinhala_text,
                            'description': description,
                            'result': translated,
                            'confidence': confidence
                        })

                    if note:
                        print(f"     Note: {note}")
                else:
                    print(f"     Failed: HTTP {response.status_code}")
                    failed_tests.append({
                        'verb': verb_name,
                        'sinhala': sinhala_text,
                        'description': description,
                        'result': 'ERROR',
                        'confidence': 0
                    })

            except Exception as e:
                print(f"     Error: {str(e)}")
                failed_tests.append({
                    'verb': verb_name,
                    'sinhala': sinhala_text,
                    'description': description,
                    'result': 'ERROR',
                    'confidence': 0
                })

    # Summary
    print("\n\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"\n✓ Successful: {successful_tests}/{total_tests} ({successful_tests/total_tests*100:.1f}%)")
    print(f"✗ Failed/Low Confidence: {len(failed_tests)}/{total_tests}")

    if failed_tests:
        print(f"\n{'-'*80}")
        print("Failed or Low Confidence Cases:")
        print(f"{'-'*80}")
        for test in failed_tests:
            print(f"\n  Verb: {test['verb']}")
            print(f"  Sinhala: {test['sinhala']} ({test['description']})")
            print(f"  Result: {test['result']}")
            print(f"  Confidence: {test['confidence']:.2%}")

    print("\n" + "="*80)
    print("EXPECTED BEHAVIOR:")
    print("All Sinhala verb conjugations (මු, මි, ති, past forms, infinitives)")
    print("should normalize to their base form to find the Vedda translation.")
    print("This should work for ALL verbs, not just කනවා!")
    print("="*80 + "\n")

    return successful_tests, total_tests, failed_tests

if __name__ == "__main__":
    test_multiple_verbs()
