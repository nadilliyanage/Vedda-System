# How to Add and Train New Vedda Words and Sentences

## 🎯 Overview

This guide shows you how to add new vocabulary and train your Vedda translation system to recognize new words and sentences.

## 📋 Step-by-Step Process

### Step 1: Add New Words to CSV Dictionary

**File:** `d:\SLIIT\RP\Vedda System\data\vedda_dictionary.csv`

1. **Open the CSV file** in a text editor or Excel
2. **Add new entries** following this format:

   ```csv
   vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
   ```

3. **Example entries:**

   ```csv
   නැනා,නංගි,sister,nænæ,nængi,ˈsɪstər,noun,නැනා ගෙදර ඉන්නවා - Sister is at home
   අච්චි,අක්කා,elder sister,ætʃi,ækkæ,ˈɛldər ˈsɪstər,noun,අච්චි වැඩට ගියා - Elder sister went to work
   පුත්තා,පුතා,son,puttæ,putæ,sʌn,noun,පුත්තා ඉස්කෝලේ යනවා - Son goes to school
   ```

4. **Required columns:**
   - **vedda_word**: The authentic Vedda word
   - **sinhala_word**: Sinhala equivalent
   - **english_word**: English translation
   - **vedda_ipa**: Vedda pronunciation (IPA notation)
   - **sinhala_ipa**: Sinhala pronunciation
   - **english_ipa**: English pronunciation
   - **word_type**: noun, verb, adjective, adverb, etc.
   - **usage_example**: Example sentence in Sinhala with English translation

### Step 2: Train the Database

**Location:** `d:\SLIIT\RP\Vedda System\data\`

1. **Navigate to data directory:**

   ```powershell
   cd "d:\SLIIT\RP\Vedda System\data"
   ```

2. **Run the training script:**

   ```powershell
   python train_new_words.py
   ```

3. **Expected output:**
   ```
   🔍 Checking database and CSV synchronization...
   📊 Current database records: 61
   📊 CSV file records: 64
   ⚠️  Database (61) and CSV (64) are out of sync!
   🔄 Updating database with CSV data...
   ✅ Successfully imported 64 records!
   ```

### Step 3: Restart Services

**Required after adding new words**

1. **Stop existing services** (if running):

   ```powershell
   # Press Ctrl+C in each service terminal
   ```

2. **Start Dictionary Service:**

   ```powershell
   cd "d:\SLIIT\RP\Vedda System\backend\dictionary-service"
   python app.py
   ```

3. **Start Translator Service** (in new terminal):

   ```powershell
   cd "d:\SLIIT\RP\Vedda System\backend\translator-service"
   python app.py
   ```

4. **Start History Service** (in new terminal):
   ```powershell
   cd "d:\SLIIT\RP\Vedda System\backend\history-service"
   python app.py
   ```

### Step 4: Test New Words

**Location:** `d:\SLIIT\RP\Vedda System\`

1. **Test individual words:**

   ```powershell
   python test_new_vedda_words.py
   ```

2. **Test specific words manually:**
   - Use Postman or curl to test the API
   - Use the frontend interface

### Step 5: Verify Training Success

1. **Check database records:**

   ```powershell
   cd "d:\SLIIT\RP\Vedda System\data"
   python check_db_structure.py
   ```

2. **Look for:**
   - ✅ Dictionary table record count matches CSV
   - ✅ New words appear in test results
   - ✅ Translation method shows "dictionary" for new words

## 🎯 Examples of Different Word Types

### 1. Basic Nouns

```csv
කුමාරයා,කුමාරයා,prince,kumaːrajæ,kumaːrajæ,prɪns,noun,කුමාරයා රජධානියේ ඉන්නවා - Prince lives in the palace
```

### 2. Action Verbs

```csv
නටනවා,නටනවා,dancing,naʈanaːvaː,naʈanaːvaː,ˈdænsɪŋ,verb,කෙල්ලෝ නටනවා - Girls are dancing
```

### 3. Descriptive Adjectives

```csv
රස්සන,රසවත්,delicious,ræssan,ræsavat,dɪˈlɪʃəs,adjective,කෑම රස්සන - Food is delicious
```

### 4. Question Words

```csv
මොනවාද,මොනවාද,what,monaːvaːda,monaːvaːda,wʌt,question,ඔයා මොනවාද කරන්නේ? - What are you doing?
```

### 5. Sentence Phrases

```csv
අයුබෝවන්,අයුබෝවන්,greetings,æjuboːvan,æjuboːvan,ˈɡriːtɪŋz,greeting,අයුබෝවන් කියන්න - Say greetings
```

## 🔄 Quick Training Commands

### Create a quick training script:

```powershell
# Navigate to data folder
cd "d:\SLIIT\RP\Vedda System\data"

# Train new words
python train_new_words.py

# Restart services (run each in separate terminal)
cd "../backend/dictionary-service" && python app.py
cd "../backend/translator-service" && python app.py
cd "../backend/history-service" && python app.py

# Test new words
cd ".." && python test_new_vedda_words.py
```

## 🎯 Best Practices

### 1. Word Selection

- ✅ Use authentic Vedda words when possible
- ✅ Include proper IPA pronunciations
- ✅ Add meaningful usage examples
- ✅ Categorize words correctly (noun, verb, etc.)

### 2. Testing

- ✅ Test both directions: Vedda↔English and Vedda↔Sinhala
- ✅ Test individual words and sentences
- ✅ Verify dictionary recognition (should show 94% confidence)

### 3. Maintenance

- ✅ Keep CSV and database synchronized
- ✅ Backup dictionary before major changes
- ✅ Document new word sources and authenticity

## 🚨 Troubleshooting

### Problem: New words not recognized

**Solution:**

1. Check CSV format is correct
2. Run `python train_new_words.py`
3. Restart all services
4. Verify database update with `python check_db_structure.py`

### Problem: Low confidence scores

**Solution:**

1. Check if word exists in dictionary
2. Verify Sinhala mapping is correct
3. Ensure IPA pronunciations are accurate

### Problem: Services not starting

**Solution:**

1. Check for syntax errors: `python -m py_compile app.py`
2. Verify database exists: `python check_db_structure.py`
3. Check port availability (5001, 5002, 5003)

## 📊 Training Verification Checklist

- [ ] CSV file updated with new entries
- [ ] Database training completed successfully
- [ ] All services restarted
- [ ] New words test passed
- [ ] Translation confidence ≥ 90% for dictionary words
- [ ] Frontend displays new translations correctly

## 🎉 Success Indicators

When training is successful, you should see:

- ✅ "🎯 AUTHENTIC VEDDA WORD RECOGNIZED!" in test output
- ✅ Translation method shows "vedda_to_sinhala_bridge"
- ✅ Methods used includes "dictionary"
- ✅ Confidence score ≥ 94% for authentic Vedda words

---

**Note:** Always backup your `vedda_dictionary.csv` file before making major changes!
