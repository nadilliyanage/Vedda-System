import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const AdminWords = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statistics, setStatistics] = useState({ word_count: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [addMode, setAddMode] = useState("new"); // "new" or "copy"
  const [selectedVeddaWord, setSelectedVeddaWord] = useState(null);
  const [veddaSearchTerm, setVeddaSearchTerm] = useState("");

  // Filter words based on search term
  const filteredWords = words.filter((word) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      word.vedda_word?.toLowerCase().includes(search) ||
      word.sinhala_word?.toLowerCase().includes(search) ||
      word.english_word?.toLowerCase().includes(search) ||
      word.word_type?.toLowerCase().includes(search) ||
      word.usage_example?.toLowerCase().includes(search)
    );
  });

  // Form state for adding single word
  const [formData, setFormData] = useState({
    vedda_word: "",
    sinhala_word: "",
    english_word: "",
    vedda_ipa: "",
    sinhala_ipa: "",
    english_ipa: "",
    word_type: "",
    usage_example: "",
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);

  // Edit state
  const [editingWord, setEditingWord] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchWords();
    fetchStatistics();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await fetch("http://localhost:5002/api/dictionary/all");
      if (response.ok) {
        const data = await response.json();
        setWords(data.results || []);
      } else {
        console.error("Failed to fetch words:", response.status);
        toast.error("Failed to fetch words");
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      toast.error("Failed to fetch words");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch("http://localhost:5002/health");
      if (response.ok) {
        const data = await response.json();
        setStatistics({ word_count: data.word_count || 0 });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleModeChange = (mode) => {
    setAddMode(mode);
    setSelectedVeddaWord(null);
    setVeddaSearchTerm("");
    // Reset form when switching modes
    setFormData({
      vedda_word: "",
      sinhala_word: "",
      english_word: "",
      vedda_ipa: "",
      sinhala_ipa: "",
      english_ipa: "",
      word_type: "",
      usage_example: "",
    });
  };

  const handleVeddaWordSelect = (word) => {
    setSelectedVeddaWord(word);
    setVeddaSearchTerm(word.vedda_word);
    // Populate form with selected word's data, but clear sinhala_word for new entry
    setFormData({
      vedda_word: word.vedda_word,
      sinhala_word: "", // Clear this so user can add new Sinhala word
      english_word: word.english_word || "",
      vedda_ipa: word.vedda_ipa || "",
      sinhala_ipa: "", // Clear this too since it's specific to Sinhala word
      english_ipa: word.english_ipa || "",
      word_type: word.word_type || "",
      usage_example: "", // Clear this as it might be specific to the Sinhala translation
    });
  };

  // Get unique Vedda words for the dropdown
  const uniqueVeddaWords = Array.from(
    new Map(words.map((word) => [word.vedda_word, word])).values(),
  ).filter(
    (word) =>
      !veddaSearchTerm ||
      word.vedda_word.toLowerCase().includes(veddaSearchTerm.toLowerCase()),
  );

  const handleAddWord = async (e) => {
    e.preventDefault();

    if (!formData.vedda_word.trim()) {
      toast.error("Vedda word is required");
      return;
    }

    if (addMode === "copy" && !formData.sinhala_word.trim()) {
      toast.error("Sinhala word is required when copying existing Vedda word");
      return;
    }

    try {
      const response = await fetch("http://localhost:5002/api/dictionary/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const successMsg =
          addMode === "copy"
            ? `New Sinhala translation added for "${formData.vedda_word}"!`
            : "Word added successfully!";
        toast.success(successMsg);
        setFormData({
          vedda_word: "",
          sinhala_word: "",
          english_word: "",
          vedda_ipa: "",
          sinhala_ipa: "",
          english_ipa: "",
          word_type: "",
          usage_example: "",
        });
        setAddMode("new");
        setSelectedVeddaWord(null);
        setVeddaSearchTerm("");
        setShowAddForm(false);
        fetchWords();
        fetchStatistics();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add word");
      }
    } catch (error) {
      console.error("Error adding word:", error);
      toast.error("Failed to add word");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    const isValidFile =
      file &&
      (file.type === "text/csv" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.toLowerCase().endsWith(".csv") ||
        file.name.toLowerCase().endsWith(".xlsx"));

    if (isValidFile) {
      setCsvFile(file);
      setUploadResults(null);
    } else {
      toast.error("Please select a valid CSV or XLSX file");
      setCsvFile(null);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("csv_file", csvFile);

    try {
      const response = await fetch(
        "http://localhost:5002/api/dictionary/upload-csv",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        const fileType = csvFile.name.toLowerCase().endsWith(".xlsx")
          ? "XLSX"
          : "CSV";
        let message = `${fileType} uploaded successfully! Added ${result.added_count} words`;
        if (result.errors && result.errors.length > 0) {
          message += ` (${result.errors.length} warnings)`;
          console.warn("File Upload Warnings:", result.errors);
        }
        if (result.encoding_used) {
          console.info("File encoding used:", result.encoding_used);
        }
        toast.success(message);
        setUploadResults(result);
        setCsvFile(null);
        fetchWords();
        fetchStatistics();
      } else {
        const errorMsg = result.error || "Failed to upload file";
        if (errorMsg.includes("encoding") || errorMsg.includes("decode")) {
          toast.error(
            "Encoding error: Please save your CSV file as UTF-8 encoding. In Excel: File > Save As > CSV UTF-8",
          );
        } else {
          toast.error(errorMsg);
        }
        setUploadResults(result);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `vedda_word,sinhala_word,english_word,vedda_ipa,sinhala_ipa,english_ipa,word_type,usage_example
කැකුළෝ,ළමයි,children,kækulo,ləməi,ˈtʃɪldrən,noun,මේ කැකුළෝ ගෙදර ඉන්නවා - These children are at home
දියරච්ඡා,වතුර,water,dijaracca,vaturu,ˈwɔːtər,noun,දියරච්ඡා බොන්න - drink water`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vedda_dictionary_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditWord = (word) => {
    setEditingWord(word.id);
    setEditFormData({
      vedda_word: word.vedda_word || "",
      sinhala_word: word.sinhala_word || "",
      english_word: word.english_word || "",
      vedda_ipa: word.vedda_ipa || "",
      sinhala_ipa: word.sinhala_ipa || "",
      english_ipa: word.english_ipa || "",
      word_type: word.word_type || "",
      usage_example: word.usage_example || "",
    });
  };

  const handleUpdateWord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5002/api/dictionary/${editingWord}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        },
      );

      if (response.ok) {
        alert("Word updated successfully!");
        setEditingWord(null);
        setEditFormData({});
        fetchWords();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to update word"}`);
      }
    } catch (error) {
      console.error("Error updating word:", error);
      alert("Error updating word");
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (!window.confirm("Are you sure you want to delete this word?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5002/api/dictionary/${wordId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        alert("Word deleted successfully!");
        fetchWords();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete word"}`);
      }
    } catch (error) {
      console.error("Error deleting word:", error);
      alert("Error deleting word");
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const cancelEdit = () => {
    setEditingWord(null);
    setEditFormData({});
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Word Management</h1>
        <p className="text-gray-600 mt-2">
          Manage Vedda language dictionary words
        </p>
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-semibold">
            Dictionary Statistics: {statistics.word_count} words
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? "Cancel" : "Add New Word"}
        </button>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {showUploadForm ? "Cancel" : "Upload CSV/XLSX"}
        </button>
        <button
          onClick={downloadTemplate}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Download Template
        </button>
      </div>

      {/* Add Single Word Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add New Word
          </h3>

          {/* Mode Selection */}
          <div className="mb-6 flex gap-4 p-4 bg-gray-50 rounded-lg">
            <button
              type="button"
              onClick={() => handleModeChange("new")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addMode === "new"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Add New Word
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("copy")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addMode === "copy"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Existing Vedda Word
            </button>
          </div>

          {/* Vedda Word Selection (Copy Mode) */}
          {addMode === "copy" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Existing Vedda Word
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={veddaSearchTerm}
                  onChange={(e) => setVeddaSearchTerm(e.target.value)}
                  placeholder="Search for Vedda word..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {veddaSearchTerm && uniqueVeddaWords.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {uniqueVeddaWords.map((word) => (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => handleVeddaWordSelect(word)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {word.vedda_word}
                        </div>
                        <div className="text-sm text-gray-500">
                          {word.sinhala_word} - {word.english_word}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedVeddaWord && (
                <div className="mt-2 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-800">
                    Selected: <strong>{selectedVeddaWord.vedda_word}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Now add a new Sinhala translation for this Vedda word
                  </p>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={handleAddWord}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vedda Word *
              </label>
              <input
                type="text"
                name="vedda_word"
                value={formData.vedda_word}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                readOnly={addMode === "copy" && selectedVeddaWord}
                title={
                  addMode === "copy" && selectedVeddaWord
                    ? "Vedda word is copied from existing entry"
                    : ""
                }
              />
              {addMode === "copy" && selectedVeddaWord && (
                <p className="text-xs text-blue-600 mt-1">
                  Using existing Vedda word
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sinhala Word {addMode === "copy" ? "*" : ""}
              </label>
              <input
                type="text"
                name="sinhala_word"
                value={formData.sinhala_word}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={addMode === "copy"}
                placeholder={
                  addMode === "copy" ? "Enter new Sinhala translation" : ""
                }
              />
              {addMode === "copy" && (
                <p className="text-xs text-orange-600 mt-1">
                  Enter a different Sinhala word for this Vedda word
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English Word
              </label>
              <input
                type="text"
                name="english_word"
                value={formData.english_word}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Type
              </label>
              <select
                name="word_type"
                value={formData.word_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="pronoun">Pronoun</option>
                <option value="preposition">Preposition</option>
                <option value="conjunction">Conjunction</option>
                <option value="interjection">Interjection</option>
                <option value="number">Number</option>
                <option value="determiner">Determiner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vedda IPA
              </label>
              <input
                type="text"
                name="vedda_ipa"
                value={formData.vedda_ipa}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., kækulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sinhala IPA
              </label>
              <input
                type="text"
                name="sinhala_ipa"
                value={formData.sinhala_ipa}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ləməi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English IPA
              </label>
              <input
                type="text"
                name="english_ipa"
                value={formData.english_ipa}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ˈtʃɪldrən"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Example
              </label>
              <textarea
                name="usage_example"
                value={formData.usage_example}
                onChange={handleInputChange}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., මේ කැකුළෝ ගෙදර ඉන්නවා - These children are at home"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Word
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Upload CSV or XLSX File
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                CSV should have columns: vedda_word, sinhala_word, english_word,
                vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example
              </p>
            </div>

            {csvFile && (
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-green-800">Selected: {csvFile.name}</p>
              </div>
            )}

            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || uploading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>

          {uploadResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold text-gray-800">Upload Results:</h4>
              <p className="text-sm text-gray-600">
                Added: {uploadResults.added_count || 0} words
              </p>
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-600">Errors:</p>
                  <ul className="text-xs text-red-500 list-disc list-inside">
                    {uploadResults.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {uploadResults.errors.length > 5 && (
                      <li>
                        ... and {uploadResults.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Words List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Dictionary Words ({filteredWords.length})
          </h2>
          <button
            onClick={fetchWords}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search words (Vedda, Sinhala, English, Type, Example)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-3 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredWords.length} of {words.length} words
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading words...</p>
          </div>
        ) : filteredWords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Vedda
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Sinhala
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    English
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Example
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWords.map((word, index) => (
                  <tr key={word.id || index} className="hover:bg-gray-50">
                    {editingWord === word.id ? (
                      // Edit mode
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            name="vedda_word"
                            value={editFormData.vedda_word}
                            onChange={handleEditInputChange}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            name="sinhala_word"
                            value={editFormData.sinhala_word}
                            onChange={handleEditInputChange}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            name="english_word"
                            value={editFormData.english_word}
                            onChange={handleEditInputChange}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            name="word_type"
                            value={editFormData.word_type}
                            onChange={handleEditInputChange}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select type</option>
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adjective">Adjective</option>
                            <option value="adverb">Adverb</option>
                            <option value="pronoun">Pronoun</option>
                            <option value="preposition">Preposition</option>
                            <option value="conjunction">Conjunction</option>
                            <option value="interjection">Interjection</option>
                            <option value="number">Number</option>
                            <option value="determiner">Determiner</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            name="usage_example"
                            value={editFormData.usage_example}
                            onChange={handleEditInputChange}
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateWord}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {word.vedda_word}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {word.sinhala_word}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {word.english_word}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {word.word_type}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate"
                          title={word.usage_example}
                        >
                          {word.usage_example}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditWord(word)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No words found</p>
            <p className="text-gray-400 mt-2">
              Start by adding your first Vedda word
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWords;
