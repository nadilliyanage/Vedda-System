import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import LoadingScreen from "../components/ui/LoadingScreen";

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

    const result = await Swal.fire({
      title: "Save Changes?",
      text: "Are you sure you want to update this word?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it",
      cancelButtonText: "Cancel",
      background: "#1a140b",
      color: "#f5e9c8",
      iconColor: "rgba(200,165,90,0.85)",
      confirmButtonColor: "rgba(22,163,74,0.80)",
      cancelButtonColor: "rgba(200,165,90,0.20)",
      customClass: {
        popup: "swal-vedda-popup",
        confirmButton: "swal-vedda-confirm-green",
        cancelButton: "swal-vedda-cancel",
      },
    });

    if (!result.isConfirmed) return;

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
        toast.success("Word updated successfully!");
        setEditingWord(null);
        setEditFormData({});
        fetchWords();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update word");
      }
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Error updating word");
    }
  };

  const handleDeleteWord = async (wordId) => {
    const result = await Swal.fire({
      title: "Delete Word?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      background: "#1a140b",
      color: "#f5e9c8",
      iconColor: "rgba(251,191,36,0.85)",
      confirmButtonColor: "rgba(220,38,38,0.80)",
      cancelButtonColor: "rgba(200,165,90,0.20)",
      customClass: {
        popup: "swal-vedda-popup",
        confirmButton: "swal-vedda-confirm",
        cancelButton: "swal-vedda-cancel",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5002/api/dictionary/${wordId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Word deleted successfully!");
        fetchWords();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete word");
      }
    } catch (error) {
      console.error("Error deleting word:", error);
      toast.error("Error deleting word");
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
        <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
          Word Management
        </h1>
        <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
          Manage Vedda language dictionary words
        </p>
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            background: "rgba(200,165,90,0.12)",
            border: "1px solid rgba(200,165,90,0.22)",
          }}
        >
          <p className="font-semibold" style={{ color: "#d4b483" }}>
            Dictionary Statistics: {statistics.word_count} words
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="admin-btn-primary px-4 py-2"
        >
          {showAddForm ? "Cancel" : "Add New Word"}
        </button>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="admin-btn-success px-4 py-2"
        >
          {showUploadForm ? "Cancel" : "Upload CSV/XLSX"}
        </button>
        <button
          onClick={downloadTemplate}
          className="admin-btn-secondary px-4 py-2"
        >
          Download Template
        </button>
      </div>

      {/* Add Single Word Form */}
      {showAddForm && (
        <div className="admin-glass p-6 mb-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#f5e9c8" }}
          >
            Add New Word
          </h3>

          {/* Mode Selection */}
          <div
            className="mb-6 flex gap-4 p-4 rounded-lg"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <button
              type="button"
              onClick={() => handleModeChange("new")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addMode === "new" ? "admin-btn-primary" : "admin-btn-secondary"
              }`}
            >
              Add New Word
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("copy")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                addMode === "copy" ? "admin-btn-primary" : "admin-btn-secondary"
              }`}
            >
              Existing Vedda Word
            </button>
          </div>

          {/* Vedda Word Selection (Copy Mode) */}
          {addMode === "copy" && (
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Select Existing Vedda Word
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={veddaSearchTerm}
                  onChange={(e) => setVeddaSearchTerm(e.target.value)}
                  placeholder="Search for Vedda word..."
                  className="admin-input w-full"
                />
                {veddaSearchTerm && uniqueVeddaWords.length > 0 && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      background: "rgba(26,20,11,0.97)",
                      border: "1px solid rgba(200,165,90,0.22)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {uniqueVeddaWords.map((word) => (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => handleVeddaWordSelect(word)}
                        className="w-full text-left px-4 py-2 transition-colors"
                        style={{ color: "rgba(212,180,131,0.85)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(200,165,90,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          className="font-medium"
                          style={{ color: "#f5e9c8" }}
                        >
                          {word.vedda_word}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "rgba(212,180,131,0.55)" }}
                        >
                          {word.sinhala_word} - {word.english_word}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedVeddaWord && (
                <div
                  className="mt-2 p-3 rounded-md"
                  style={{
                    background: "rgba(22,163,74,0.12)",
                    border: "1px solid rgba(22,163,74,0.25)",
                  }}
                >
                  <p className="text-sm" style={{ color: "#86efac" }}>
                    Selected: <strong>{selectedVeddaWord.vedda_word}</strong>
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(134,239,172,0.65)" }}
                  >
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
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Vedda Word *
              </label>
              <input
                type="text"
                name="vedda_word"
                value={formData.vedda_word}
                onChange={handleInputChange}
                className="admin-input w-full"
                required
                readOnly={addMode === "copy" && selectedVeddaWord}
                title={
                  addMode === "copy" && selectedVeddaWord
                    ? "Vedda word is copied from existing entry"
                    : ""
                }
              />
              {addMode === "copy" && selectedVeddaWord && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(147,197,253,0.80)" }}
                >
                  Using existing Vedda word
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Sinhala Word {addMode === "copy" ? "*" : ""}
              </label>
              <input
                type="text"
                name="sinhala_word"
                value={formData.sinhala_word}
                onChange={handleInputChange}
                className="admin-input w-full"
                required={addMode === "copy"}
                placeholder={
                  addMode === "copy" ? "Enter new Sinhala translation" : ""
                }
              />
              {addMode === "copy" && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(251,191,36,0.70)" }}
                >
                  Enter a different Sinhala word for this Vedda word
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                English Word
              </label>
              <input
                type="text"
                name="english_word"
                value={formData.english_word}
                onChange={handleInputChange}
                className="admin-input w-full"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Word Type
              </label>
              <select
                name="word_type"
                value={formData.word_type}
                onChange={handleInputChange}
                className="admin-select w-full"
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
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Vedda IPA
              </label>
              <input
                type="text"
                name="vedda_ipa"
                value={formData.vedda_ipa}
                onChange={handleInputChange}
                className="admin-input w-full"
                placeholder="e.g., kækulo"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Sinhala IPA
              </label>
              <input
                type="text"
                name="sinhala_ipa"
                value={formData.sinhala_ipa}
                onChange={handleInputChange}
                className="admin-input w-full"
                placeholder="e.g., ləməi"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                English IPA
              </label>
              <input
                type="text"
                name="english_ipa"
                value={formData.english_ipa}
                onChange={handleInputChange}
                className="admin-input w-full"
                placeholder="e.g., ˈtʃɪldrən"
              />
            </div>
            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Usage Example
              </label>
              <textarea
                name="usage_example"
                value={formData.usage_example}
                onChange={handleInputChange}
                rows="2"
                className="admin-textarea w-full"
                placeholder="e.g., මේ කැකුළෝ ගෙදර ඉන්නවා - These children are at home"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="admin-btn-primary px-6 py-2">
                Add Word
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Form */}
      {showUploadForm && (
        <div className="admin-glass p-6 mb-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#f5e9c8" }}
          >
            Upload CSV or XLSX File
          </h3>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="admin-input w-full"
              />
              <p
                className="text-xs mt-1"
                style={{ color: "rgba(212,180,131,0.55)" }}
              >
                CSV should have columns: vedda_word, sinhala_word, english_word,
                vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example
              </p>
            </div>

            {csvFile && (
              <div
                className="p-3 rounded-md"
                style={{
                  background: "rgba(22,163,74,0.12)",
                  border: "1px solid rgba(22,163,74,0.25)",
                }}
              >
                <p style={{ color: "#86efac" }}>Selected: {csvFile.name}</p>
              </div>
            )}

            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || uploading}
              className="admin-btn-success px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </button>
          </div>

          {uploadResults && (
            <div
              className="mt-4 p-4 rounded-md"
              style={{ background: "rgba(0,0,0,0.28)" }}
            >
              <h4 className="font-semibold mb-1" style={{ color: "#f5e9c8" }}>
                Upload Results:
              </h4>
              <p
                className="text-sm"
                style={{ color: "rgba(212,180,131,0.75)" }}
              >
                Added: {uploadResults.added_count || 0} words
              </p>
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm" style={{ color: "#fca5a5" }}>
                    Errors:
                  </p>
                  <ul
                    className="text-xs list-disc list-inside"
                    style={{ color: "rgba(252,165,165,0.75)" }}
                  >
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
      <div className="admin-glass p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: "#f5e9c8" }}>
            Dictionary Words ({filteredWords.length})
          </h2>
          <button
            onClick={fetchWords}
            className="transition-colors"
            style={{ color: "rgba(212,180,131,0.70)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#d4b483";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(212,180,131,0.70)";
            }}
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
              className="admin-input w-full"
              style={{ paddingLeft: "2.5rem" }}
            />
            <svg
              className="absolute left-3 top-3 h-5 w-5"
              style={{ color: "rgba(212,180,131,0.45)" }}
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
            <p
              className="text-sm mt-2"
              style={{ color: "rgba(212,180,131,0.60)" }}
            >
              Showing {filteredWords.length} of {words.length} words
            </p>
          )}
        </div>

        {loading ? (
          <LoadingScreen />
        ) : filteredWords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="admin-table-head">
                  <th className="admin-table-th">Vedda</th>
                  <th className="admin-table-th">Sinhala</th>
                  <th className="admin-table-th">English</th>
                  <th className="admin-table-th">Vedda IPA</th>
                  <th className="admin-table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((word, index) => (
                  <tr key={word.id || index} className="admin-table-row">
                    {editingWord === word.id ? (
                      // Edit mode
                      <>
                        <td className="admin-table-td">
                          <input
                            type="text"
                            name="vedda_word"
                            value={editFormData.vedda_word}
                            onChange={handleEditInputChange}
                            className="admin-input w-full py-1 text-sm"
                          />
                        </td>
                        <td className="admin-table-td">
                          <input
                            type="text"
                            name="sinhala_word"
                            value={editFormData.sinhala_word}
                            onChange={handleEditInputChange}
                            className="admin-input w-full py-1 text-sm"
                          />
                        </td>
                        <td className="admin-table-td">
                          <input
                            type="text"
                            name="english_word"
                            value={editFormData.english_word}
                            onChange={handleEditInputChange}
                            className="admin-input w-full py-1 text-sm"
                          />
                        </td>
                        <td className="admin-table-td">
                          <input
                            type="text"
                            name="vedda_ipa"
                            value={editFormData.vedda_ipa}
                            onChange={handleEditInputChange}
                            className="admin-input w-full py-1 text-sm"
                          />
                        </td>
                        <td className="admin-table-td">
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateWord}
                              className="admin-btn-success px-2 py-1 text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="admin-btn-secondary px-2 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td
                          className="admin-table-td font-medium"
                          style={{ color: "#f5e9c8" }}
                        >
                          {word.vedda_word}
                        </td>
                        <td className="admin-table-td">{word.sinhala_word}</td>
                        <td className="admin-table-td">{word.english_word}</td>
                        <td
                          className="admin-table-td text-sm"
                          style={{ color: "rgba(212,180,131,0.60)", fontStyle: "italic" }}
                        >
                          {word.vedda_ipa || "—"}
                        </td>
                        <td className="admin-table-td">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditWord(word)}
                              className="admin-btn-primary px-2 py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word.id)}
                              className="admin-btn-danger px-2 py-1 text-xs"
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
            <p className="text-lg" style={{ color: "rgba(212,180,131,0.65)" }}>
              No words found
            </p>
            <p className="mt-2" style={{ color: "rgba(212,180,131,0.45)" }}>
              Start by adding your first Vedda word
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWords;
