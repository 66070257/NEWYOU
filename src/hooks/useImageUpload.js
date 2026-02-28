import { useEffect, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "../database/firebase";

const useImageUpload = ({ folderName, mode = "firebase" }) => {
    const [imageUrl, setImageUrl] = useState("");
    const [imageInputValue, setImageInputValue] = useState("");
    const [localPreviewUrl, setLocalPreviewUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const uploadRequestRef = useRef(0);

    useEffect(() => {
        return () => {
            if (localPreviewUrl) {
                URL.revokeObjectURL(localPreviewUrl);
            }
        };
    }, [localPreviewUrl]);

    const clearLocalPreview = () => {
        setLocalPreviewUrl((previousPreviewUrl) => {
            if (previousPreviewUrl) {
                URL.revokeObjectURL(previousPreviewUrl);
            }
            return "";
        });
    };

    const handleRemoveImage = () => {
        uploadRequestRef.current += 1;
        clearLocalPreview();
        setImageUrl("");
        setImageInputValue("");
        setIsUploadingImage(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePickImage = () => {
        fileInputRef.current?.click();
    };

    const handleUploadImage = async (event) => {
        const file = event.target.files?.[0];
        let requestId = 0;

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file only.");
            event.target.value = "";
            return;
        }

        if (mode === "firebase" && !storage) {
            alert("Firebase Storage is not configured.");
            event.target.value = "";
            return;
        }

        try {
            uploadRequestRef.current += 1;
            requestId = uploadRequestRef.current;
            setIsUploadingImage(true);
            clearLocalPreview();

            const previewUrl = URL.createObjectURL(file);
            setLocalPreviewUrl(previewUrl);

            let uploadedUrl = "";

            if (mode === "local-server") {
                const formData = new FormData();
                formData.append("folderName", folderName);
                formData.append("image", file);
                const uploadApiBase = process.env.REACT_APP_UPLOAD_API_URL || "http://localhost:5000/api/upload";
                const uploadUrlObject = new URL(uploadApiBase, window.location.origin);
                uploadUrlObject.searchParams.set("folderName", folderName);
                const uploadUrl = uploadUrlObject.toString();

                const response = await fetch(
                    uploadUrl,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                if (!response.ok) {
                    let errorMessage = "Upload failed";

                    try {
                        const errorResult = await response.json();
                        errorMessage = errorResult.message || errorMessage;
                    } catch (_jsonError) {
                        errorMessage = `Upload failed (${response.status})`;
                    }

                    throw new Error(errorMessage);
                }

                const result = await response.json();
                uploadedUrl = result.url;
            } else {
                const currentUser = auth.currentUser;
                const fileName = `${Date.now()}-${file.name}`;
                const imageRef = ref(
                    storage,
                    `${folderName}/${currentUser?.uid || "anonymous"}/${fileName}`
                );

                await uploadBytes(imageRef, file);
                uploadedUrl = await getDownloadURL(imageRef);
            }

            if (requestId === uploadRequestRef.current) {
                setImageUrl(uploadedUrl);
                setImageInputValue("");
            }
        } catch (error) {
            const isLocalServerError = mode === "local-server";
            const networkError = error?.message?.toLowerCase().includes("failed to fetch");

            if (isLocalServerError && networkError) {
                alert("Image upload failed: upload server is not running (run npm run server).");
            } else {
                alert(`Image upload failed${error?.message ? `: ${error.message}` : ""}`);
            }
        } finally {
            if (uploadRequestRef.current === requestId) {
                setIsUploadingImage(false);
            }
            event.target.value = "";
        }
    };

    const setImageUrlFromInput = (value) => {
        clearLocalPreview();
        setImageInputValue(value);
        setImageUrl(value);
    };

    return {
        imageUrl,
        imageInputValue,
        previewSrc: localPreviewUrl || imageUrl,
        hasImage: Boolean(localPreviewUrl || imageUrl),
        isUploadingImage,
        fileInputRef,
        handlePickImage,
        handleUploadImage,
        handleRemoveImage,
        setImageUrlFromInput
    };
};

export default useImageUpload;