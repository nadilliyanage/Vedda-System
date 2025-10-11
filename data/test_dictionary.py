import sqlite3

conn = sqlite3.connect('vedda_translator.db')
cursor = conn.cursor()

print("First 10 words in dictionary:")
cursor.execute('SELECT vedda_word, english_word, vedda_ipa, english_ipa FROM dictionary LIMIT 10')
for row in cursor.fetchall():
    print(f'{row[0]} -> {row[1]} | Vedda IPA: {row[2]} | English IPA: {row[3]}')

conn.close()