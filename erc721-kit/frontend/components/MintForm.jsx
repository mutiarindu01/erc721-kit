import React, { useState, useRef } from "react";
import { ethers } from "ethers";

const MintForm = ({
  onMint,
  onSuccess,
  onError,
  loading = false,
  contractAddress,
  userAddress,
  className = "",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    imagePreview: null,
    attributes: [],
    royaltyRecipient: userAddress || "",
    royaltyPercentage: 5,
    price: "",
    unlockableContent: "",
    explicitContent: false,
  });

  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        image: "Please select a valid image file",
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "File size must be less than 10MB",
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: event.target.result,
      }));
    };
    reader.readAsDataURL(file);

    // Clear image error
    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const addAttribute = () => {
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: "", value: "" }],
    }));
  };

  const updateAttribute = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr,
      ),
    }));
  };

  const removeAttribute = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.image) {
      newErrors.image = "Image is required";
    }

    if (formData.royaltyPercentage < 0 || formData.royaltyPercentage > 10) {
      newErrors.royaltyPercentage = "Royalty must be between 0% and 10%";
    }

    if (
      formData.royaltyPercentage > 0 &&
      !ethers.utils.isAddress(formData.royaltyRecipient)
    ) {
      newErrors.royaltyRecipient =
        "Valid recipient address required for royalties";
    }

    if (
      formData.price &&
      (isNaN(formData.price) || parseFloat(formData.price) < 0)
    ) {
      newErrors.price = "Price must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);

      // Prepare metadata
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: formData.image, // This would be uploaded to IPFS in real implementation
        attributes: formData.attributes.filter(
          (attr) => attr.trait_type && attr.value,
        ),
        external_url: "",
        animation_url: "",
      };

      if (formData.unlockableContent) {
        metadata.unlockable_content = formData.unlockableContent;
      }

      const mintData = {
        metadata,
        royaltyRecipient: formData.royaltyRecipient,
        royaltyPercentage: formData.royaltyPercentage * 100, // Convert to basis points
        price: formData.price ? ethers.utils.parseEther(formData.price) : null,
      };

      await onMint(mintData);

      // Reset form on success
      setFormData({
        name: "",
        description: "",
        image: null,
        imagePreview: null,
        attributes: [],
        royaltyRecipient: userAddress || "",
        royaltyPercentage: 5,
        price: "",
        unlockableContent: "",
        explicitContent: false,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onSuccess && onSuccess();
    } catch (error) {
      console.error("Minting error:", error);
      onError && onError(error.message || "Failed to mint NFT");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image, Video, Audio, or 3D Model *
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-400 transition-colors">
          {formData.imagePreview ? (
            <div className="space-y-2 text-center">
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="mx-auto h-32 w-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    image: null,
                    imagePreview: null,
                  }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                  <span>Upload a file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="image/*,video/*,audio/*,.glb,.gltf"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, MP4, MP3, GLB up to 10MB
              </p>
            </div>
          )}
        </div>
        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{errors.image}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Item name"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.name ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide a detailed description of your item"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.description ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Attributes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Properties
          </label>
          <button
            type="button"
            onClick={addAttribute}
            className="text-sm text-purple-600 hover:text-purple-500 font-medium"
          >
            + Add Property
          </button>
        </div>
        {formData.attributes.map((attribute, index) => (
          <div key={index} className="flex space-x-3 mb-3">
            <input
              type="text"
              placeholder="Property name"
              value={attribute.trait_type}
              onChange={(e) =>
                updateAttribute(index, "trait_type", e.target.value)
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Value"
              value={attribute.value}
              onChange={(e) => updateAttribute(index, "value", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => removeAttribute(index)}
              className="px-3 py-2 text-red-600 hover:text-red-500"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Royalties */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Royalties</h3>

        <div>
          <label
            htmlFor="royaltyPercentage"
            className="block text-sm font-medium text-gray-700"
          >
            Royalty Percentage (%)
          </label>
          <input
            type="number"
            id="royaltyPercentage"
            name="royaltyPercentage"
            min="0"
            max="10"
            step="0.1"
            value={formData.royaltyPercentage}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.royaltyPercentage ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.royaltyPercentage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.royaltyPercentage}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Suggested: 5-10%. Maximum: 10%
          </p>
        </div>

        <div>
          <label
            htmlFor="royaltyRecipient"
            className="block text-sm font-medium text-gray-700"
          >
            Royalty Recipient Address
          </label>
          <input
            type="text"
            id="royaltyRecipient"
            name="royaltyRecipient"
            value={formData.royaltyRecipient}
            onChange={handleInputChange}
            placeholder="0x..."
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.royaltyRecipient ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.royaltyRecipient && (
            <p className="mt-1 text-sm text-red-600">
              {errors.royaltyRecipient}
            </p>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700"
        >
          Price (ETH)
        </label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.0001"
          min="0"
          value={formData.price}
          onChange={handleInputChange}
          placeholder="0.0"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.price ? "border-red-300" : "border-gray-300"
          }`}
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">Leave empty for free mint</p>
      </div>

      {/* Unlockable Content */}
      <div>
        <label
          htmlFor="unlockableContent"
          className="block text-sm font-medium text-gray-700"
        >
          Unlockable Content
        </label>
        <textarea
          id="unlockableContent"
          name="unlockableContent"
          rows={3}
          value={formData.unlockableContent}
          onChange={handleInputChange}
          placeholder="Enter content that will be unlocked after purchase"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Content only visible to owner
        </p>
      </div>

      {/* Explicit Content */}
      <div className="flex items-center">
        <input
          id="explicitContent"
          name="explicitContent"
          type="checkbox"
          checked={formData.explicitContent}
          onChange={handleInputChange}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label
          htmlFor="explicitContent"
          className="ml-2 block text-sm text-gray-900"
        >
          Explicit & Sensitive Content
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading || isUploading}
          className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading || isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isUploading ? "Uploading..." : "Minting..."}
            </>
          ) : (
            "Create NFT"
          )}
        </button>
      </div>
    </form>
  );
};

export default MintForm;
