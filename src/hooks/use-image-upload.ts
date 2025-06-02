
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadOptions {
  onUpload?: (file: File | null, dataUrl: string | null) => void; // dataUrl will now be base64
  initialPreviewUrl?: string | null;
}

export function useImageUpload({ onUpload, initialPreviewUrl = null }: UseImageUploadOptions = {}) {
  const previewRef = useRef<string | null>(initialPreviewUrl); // Can store blob or actual URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl); // For displaying preview
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialPreviewUrl !== previewRef.current && !(previewUrl && previewUrl.startsWith('blob:'))) {
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(previewRef.current); 
        }
        setPreviewUrl(initialPreviewUrl);
        previewRef.current = initialPreviewUrl;
        setFileName(null); 
    }
  }, [initialPreviewUrl, previewUrl]);


  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);

        // For client-side preview (efficient)
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(previewRef.current);
        }
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        previewRef.current = blobUrl; 
        
        // For submitting to server (base64 data URI)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64DataUri = reader.result as string;
          if (onUpload) {
            onUpload(file, base64DataUri); // Pass base64 to the callback
          }
        };
        reader.onerror = () => {
          console.error("Error reading file as base64 data URI");
          if (onUpload) {
            onUpload(file, null); // Indicate error by passing null dataUrl
          }
        };
        reader.readAsDataURL(file);

      } else { // No file selected, or selection cancelled
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(previewRef.current);
        }
        // If no file, perhaps an existing preview was cleared by user,
        // or it's an initial state. If initialPreviewUrl exists, revert to it.
        // Otherwise, set to null.
        const newPreview = initialPreviewUrl || null;
        setPreviewUrl(newPreview);
        previewRef.current = newPreview;
        setFileName(null);
        if (onUpload) {
          onUpload(null, null); // Signal no file / removal
        }
      }
    },
    [onUpload, initialPreviewUrl], // Added initialPreviewUrl to dependencies
  );

  const handleRemove = useCallback(() => {
    if (previewRef.current && previewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewRef.current);
    }
    // When removing, decide if you want to revert to initialPreviewUrl or always to null
    // Current behavior implies reverting to initial if it exists, otherwise null.
    // For an explicit remove button, setting to null is often desired.
    // Let's assume explicit remove should clear it to null, unless initialPreviewUrl IS null.
    const newPreviewOnRemove = initialPreviewUrl && previewUrl === initialPreviewUrl ? initialPreviewUrl : null;
    setPreviewUrl(newPreviewOnRemove); 
    previewRef.current = newPreviewOnRemove;
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    if (onUpload) {
        onUpload(null, null); // Signal removal with null dataUrl
    }
  }, [onUpload, initialPreviewUrl, previewUrl]); // Added previewUrl to dependencies

  useEffect(() => {
    const currentPreview = previewRef.current; 
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, []); 

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleTriggerClick,
    handleFileChange,
    handleRemove,
    setPreviewUrlDirectly: setPreviewUrl,
  };
}
