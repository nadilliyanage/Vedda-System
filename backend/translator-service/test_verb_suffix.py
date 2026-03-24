"""Test verb suffix removal for Vedda translation"""
import requests
import json
import sys
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_verb_suffixes():
    """Test that Sinhala verb conjugation suffixes are properly removed for Vedda"""

    base_url = "http://127.0.0.1:5001/api/translate"

    # All these forms should normalize to "කන" or "කනවා" → "කැවිල්ලානවා"
    test_cases = [
        # Present tense person markers
        ("අපි කමු", "We eat - මු (we)"),
        ("මම කමි", "I eat - මි (I)"),
        ("ඔවුන් කති", "They eat - ති (they)"),
        ("අපි කමෝ", "Let's eat - මෝ (hortative)"),

        # Present continuous
        ("අපි කනවා", "We are eating - නවා (continuous)"),

        # Past tense forms (with vowel change කෑව → කන)
        ("අපි කෑවෙමු", "We ate - කෑවෙමු (past, we)"),
        ("ඔවුන් කෑවේය", "They ate - කෑවේය (past formal)"),
        ("කෑවාය", "Ate (past formal) - කෑවාය"),
        ("කෑවා", "Ate - කෑවා (past simple)"),

        # Perfect forms
        ("කාලා", "Having eaten - ලා (perfective)"),

        # Infinitive
        ("කන්න", "To eat - න්න (infinitive)"),

        # While doing
        ("කද්දී", "While eating - ද්දී"),
    ]

    print("\n" + "="*80)
    print("TESTING VEDDA VERB NORMALIZATION")
    print("="*80)
    print("\nAll forms should translate to Vedda: 'කැවිල්ලානවා' (or similar)")
    print("This tests that Sinhala verb conjugations are properly normalized.\n")

    results = []
    for sinhala_text, description in test_cases:
        print(f"{description}")
        print(f"   Sinhala: {sinhala_text}")

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

                print(f"   Vedda:   {translated}")
                print(f"   Confidence: {confidence:.2%}")

                results.append({
                    'sinhala': sinhala_text,
                    'vedda': translated,
                    'description': description,
                    'success': 'කැවිල්ලා' in translated or 'කන' in translated
                })

                if note:
                    print(f"   Note: {note}")
            else:
                print(f"   Failed: HTTP {response.status_code}")
                results.append({
                    'sinhala': sinhala_text,
                    'vedda': 'ERROR',
                    'description': description,
                    'success': False
                })

        except Exception as e:
            print(f"   Error: {str(e)}")
            results.append({
                'sinhala': sinhala_text,
                'vedda': 'ERROR',
                'description': description,
                'success': False
            })

        print()

    # Summary
    print("="*80)
    print("SUMMARY")
    print("="*80)
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    print(f"\n✓ Successful: {successful}/{total}")
    print(f"✗ Failed: {total - successful}/{total}\n")

    if successful < total:
        print("Failed cases:")
        for r in results:
            if not r['success']:
                print(f"  - {r['sinhala']}: {r['description']}")
                print(f"    Got: {r['vedda']}\n")

    print("="*80)
    print("\nExpected behavior:")
    print("All Sinhala verb forms (කමු, කමි, කති, කෑවෙමු, etc.) should")
    print("normalize to the base form 'කනවා' or 'කන' to find the")
    print("Vedda translation 'කැවිල්ලානවා' in the dictionary.")
    print("="*80 + "\n")

if __name__ == "__main__":
    test_verb_suffixes()
