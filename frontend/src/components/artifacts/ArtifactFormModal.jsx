import { useState, useEffect } from "react";
import { X, Upload, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  createArtifactWithImage,
  updateArtifact,
  uploadImage,
  generateMetadata,
} from "../../services/artifactService";

const CATEGORIES = [
  { value: "tools", label: "Tools" },
  { value: "pottery", label: "Pottery" },
  { value: "jewelry", label: "Jewelry" },
  { value: "weapons", label: "Weapons" },
  { value: "clothing", label: "Clothing" },
  { value: "other", label: "Other" },
];

const ArtifactFormModal = ({ isOpen, onClose, onSuccess, artifact = null }) => {
  const isEditMode = !!artifact;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    location: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (artifact && isOpen) {
      setFormData({
        name: artifact.name || "",
        description: artifact.description || "",
        category: artifact.category || "",
        tags: artifact.tags?.join(", ") || "",
        location: artifact.location || "",
      });
      setImagePreview(artifact.imageUrl || artifact.images?.[0]?.url || null);
      // Load existing additional images (skip the primary one)
      const extras = (artifact.images || []).filter((img, i) => i > 0);
      setExistingAdditionalImages(extras);
    }
  }, [artifact, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImages = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setAdditionalFiles((prev) => [...prev, ...validFiles]);
          setAdditionalPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same files can be selected again
    e.target.value = "";
  };

  const removeAdditionalImage = (index) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAdditionalImage = (index) => {
    setExistingAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoFill = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    setAiLoading(true);
    try {
      const uploadResult = await uploadImage(imageFile);

      if (uploadResult.success) {
        const aiResult = await generateMetadata(uploadResult.data.url);

        setFormData((prev) => ({
          ...prev,
          name: aiResult.name || prev.name,
          description: aiResult.description || prev.description,
          category: aiResult.category || prev.category,
          tags: aiResult.tags?.join(", ") || prev.tags,
          location: aiResult.suggestedLocation || prev.location,
        }));

        toast.success(
          "✨ AI-powered fields auto-filled! Review and adjust as needed.",
        );
      }
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error(
        error.message || "Failed to auto-fill fields. Please try again.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload additional images and attach them to an artifact
  const uploadAndAttachAdditionalImages = async (
    artifactId,
    currentImages = [],
  ) => {
    if (
      additionalFiles.length === 0 &&
      existingAdditionalImages.length === currentImages.length - 1
    ) {
      return; // No changes to additional images
    }

    try {
      // Upload new additional images
      const uploadedImages = [];
      for (const file of additionalFiles) {
        const result = await uploadImage(file);
        if (result.success) {
          uploadedImages.push({
            url: result.data.url,
            publicId: result.data.publicId,
            isPrimary: false,
          });
        }
      }

      // Build the full images array: primary image + existing additional + newly uploaded
      const primaryImage =
        currentImages.find((img) => img.isPrimary) || currentImages[0];
      const allImages = [
        primaryImage,
        ...existingAdditionalImages,
        ...uploadedImages,
      ].filter(Boolean);

      // Update the artifact with the complete images array
      if (
        uploadedImages.length > 0 ||
        existingAdditionalImages.length !== currentImages.length - 1
      ) {
        await updateArtifact(artifactId, { images: allImages });
      }
    } catch (error) {
      console.error("Error uploading additional images:", error);
      toast.error("Some additional images failed to upload");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile && !isEditMode) {
      toast.error("Please upload an artifact image");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          tags: formData.tags
            ? formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        };

        if (imageFile) {
          const uploadResult = await uploadImage(imageFile);
          if (uploadResult.success) {
            updateData.imageUrl = uploadResult.data.url;
            updateData.images = [
              {
                url: uploadResult.data.url,
                publicId: uploadResult.data.publicId,
                isPrimary: true,
              },
            ];
          }
        }

        const response = await updateArtifact(artifact._id, updateData);

        if (response.success) {
          // Handle additional images
          await uploadAndAttachAdditionalImages(
            artifact._id,
            response.data.images || artifact.images || [],
          );
          toast.success("Artifact updated successfully!");
          onSuccess(response.data, true);
          handleClose();
        }
      } else {
        // Create new artifact
        const submitData = new FormData();
        submitData.append("image", imageFile);
        submitData.append("name", formData.name);
        submitData.append("description", formData.description);
        submitData.append("category", formData.category);
        submitData.append("location", formData.location);
        submitData.append("createdBy", "admin");

        if (formData.tags) {
          const tagsArray = formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
          submitData.append("tags", JSON.stringify(tagsArray));
        }

        const response = await createArtifactWithImage(submitData);

        if (response.success) {
          // Upload and attach additional images
          if (additionalFiles.length > 0) {
            await uploadAndAttachAdditionalImages(
              response.data._id,
              response.data.images || [],
            );
          }
          toast.success("Artifact created successfully!");
          onSuccess(response.data);
          handleClose();
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} artifact`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      tags: "",
      location: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setAdditionalFiles([]);
    setAdditionalPreviews([]);
    setExistingAdditionalImages([]);
    onClose();
  };

  const totalAdditionalImages =
    existingAdditionalImages.length + additionalPreviews.length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="max-w-7xl w-full h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          background: "rgba(20,14,4,0.97)",
          border: "1px solid rgba(200,165,90,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.70)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center shrink-0"
          style={{
            borderBottom: "1px solid rgba(200,165,90,0.18)",
            background: "rgba(255,248,230,0.03)",
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: "#f5e9c8" }}>
            {isEditMode ? "Edit Artifact" : "Add New Artifact"}
          </h2>
          <button
            onClick={handleClose}
            className="transition-colors"
            style={{ color: "rgba(212,180,131,0.60)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5e9c8")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(212,180,131,0.60)")
            }
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <div className="h-full flex gap-6 p-6">
            {/* Left Side - Image Upload */}
            <div className="w-2/5 flex flex-col">
              <div
                className="flex-1 p-6 rounded-xl flex flex-col min-h-0"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "2px dashed rgba(200,165,90,0.22)",
                }}
              >
                <label
                  className="block text-sm font-medium mb-4 shrink-0"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Artifact Image {!isEditMode && "*"}
                </label>

                {imagePreview ? (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div
                      className="flex-1 relative rounded-lg overflow-hidden min-h-0"
                      style={{
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(200,165,90,0.18)",
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="flex flex-col gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="w-full px-4 py-2 rounded-lg transition-colors"
                        style={{
                          background: "rgba(220,38,38,0.12)",
                          color: "#fca5a5",
                          border: "1px solid rgba(220,38,38,0.25)",
                        }}
                      >
                        Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFill}
                        disabled={aiLoading}
                        className="w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        style={{
                          background: aiLoading
                            ? "rgba(124,58,237,0.25)"
                            : "rgba(124,58,237,0.75)",
                          color: "#e9d5ff",
                          border: "1px solid rgba(167,139,250,0.30)",
                        }}
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={20} />
                            Fill Details Auto
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className="flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors rounded-lg"
                    style={{ color: "rgba(212,180,131,0.50)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,248,230,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <Upload
                      size={48}
                      className="mb-4"
                      style={{ color: "rgba(200,165,90,0.45)" }}
                    />
                    <p
                      className="text-lg mb-2"
                      style={{ color: "rgba(212,180,131,0.75)" }}
                    >
                      Click to upload artifact image
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(212,180,131,0.45)" }}
                    >
                      PNG, JPG, WEBP up to 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right Side - Form Fields */}
            <div className="w-3/5 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Artifact Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="admin-input w-full"
                      placeholder="Enter artifact name"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="admin-select w-full"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="admin-textarea w-full resize-none"
                      placeholder="Enter detailed description"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="admin-input w-full"
                      placeholder="Where was it found?"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="admin-input w-full"
                      placeholder="e.g., traditional, ancient, vedda"
                    />
                  </div>

                  {/* Additional Images */}
                  <div className="col-span-2 mt-2">
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      Additional Images ({totalAdditionalImages})
                    </label>

                    <div className="flex flex-wrap gap-3">
                      {/* Existing additional images (edit mode) */}
                      {existingAdditionalImages.map((img, i) => (
                        <div
                          key={`existing-${i}`}
                          className="relative w-20 h-20 rounded-lg overflow-hidden group"
                          style={{ border: "1px solid rgba(200,165,90,0.25)" }}
                        >
                          <img
                            src={img.url}
                            alt={`Additional ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingAdditionalImage(i)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      ))}

                      {/* New additional image previews */}
                      {additionalPreviews.map((preview, i) => (
                        <div
                          key={`new-${i}`}
                          className="relative w-20 h-20 rounded-lg overflow-hidden group"
                          style={{ border: "1px solid rgba(200,165,90,0.25)" }}
                        >
                          <img
                            src={preview}
                            alt={`New ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(i)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      ))}

                      {/* Add more button */}
                      <label
                        className="w-20 h-20 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
                        style={{
                          border: "2px dashed rgba(200,165,90,0.25)",
                          color: "rgba(212,180,131,0.50)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(200,165,90,0.55)";
                          e.currentTarget.style.background =
                            "rgba(255,248,230,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor =
                            "rgba(200,165,90,0.25)";
                          e.currentTarget.style.background = "";
                        }}
                      >
                        <Plus size={20} />
                        <span className="text-xs mt-1">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAdditionalImages}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p
                      className="text-xs mt-2"
                      style={{ color: "rgba(212,180,131,0.45)" }}
                    >
                      You can add multiple additional images. Max 10MB each.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div
                className="mt-6 flex justify-end gap-3"
                style={{
                  borderTop: "1px solid rgba(200,165,90,0.18)",
                  paddingTop: "1.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  className="admin-btn-secondary px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="admin-btn-primary px-6 py-2 flex items-center gap-2"
                  style={loading ? { opacity: 0.6 } : {}}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : isEditMode ? (
                    "Update Artifact"
                  ) : (
                    "Create Artifact"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtifactFormModal;
