
import { useCallback, useEffect, useRef, useState } from "react";

// Placeholder for a client-side logger
const clientLogger = {
  info: (message: string, context?: any) => console.log(`[useImageUploadINFO] ${message}`, context),
  warn: (message: string, context?: any) => console.warn(`[useImageUploadWARN] ${message}`, context),
  error: (message: string, context?: any) => console.error(`[useImageUploadERROR] ${message}`, context),
};

interface UseImageUploadOptions {
  onUpload?: (file: File | null, dataUrl: string | null) => void; // dataUrl will now be base64
  initialPreviewUrl?: string | null;
}

export function useImageUpload({ onUpload, initialPreviewUrl = null }: UseImageUploadOptions = {}) {
  clientLogger.info('useImageUpload initialized.', { initialPreviewUrl });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl); // For displaying preview
  const previewRef = useRef<string | null>(initialPreviewUrl); // Stores the URL that was last set *as a preview* (can be blob or actual URL)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const initialUrlUsedForFirstRender = useRef(initialPreviewUrl);

  // Effect to handle changes to initialPreviewUrl (e.g., after saving and db url updates)
  useEffect(() => {
    clientLogger.info('useEffect [initialPreviewUrl] triggered.', { initialPreviewUrl, currentPreviewUrlState: previewUrl, previewRefCurrent: previewRef.current });

    // If initialPreviewUrl prop has changed since the hook was last initialized or this effect ran for it
    if (initialPreviewUrl !== initialUrlUsedForFirstRender.current) {
      clientLogger.info('initialPreviewUrl prop has changed.', { newInitial: initialPreviewUrl, oldInitialRef: initialUrlUsedForFirstRender.current });
      
      // If there was an old blob URL, revoke it
      if (previewRef.current && previewRef.current.startsWith('blob:')) {
        clientLogger.info('Revoking old blob URL from previewRef.current.', { url: previewRef.current });
        URL.revokeObjectURL(previewRef.current);
      }
      
      setPreviewUrl(initialPreviewUrl); // Directly set the preview to the new initial URL (timestamped from DB)
      previewRef.current = initialPreviewUrl; // Update ref to match
      setFileName(null); // Reset file name as this is not a user-selected file
      initialUrlUsedForFirstRender.current = initialPreviewUrl; // Update the ref for subsequent checks
      clientLogger.info('Updated previewUrl and previewRef from new initialPreviewUrl.', { newPreviewUrl: initialPreviewUrl });
    } else if (initialPreviewUrl && !previewUrl && !fileInputRef.current?.files?.length) {
      // This condition handles the case where initialPreviewUrl was present, but previewUrl is somehow null
      // and no file is selected by the user (e.g., after a cancel that cleared things, or initial state).
      // It ensures the preview reverts to initialPreviewUrl if it exists.
      clientLogger.info('initialPreviewUrl exists but previewUrl is null and no file selected. Resetting to initialPreviewUrl.', { initialPreviewUrl });
      setPreviewUrl(initialPreviewUrl);
      previewRef.current = initialPreviewUrl;
    }
  }, [initialPreviewUrl]);


  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      clientLogger.info('handleFileChange triggered.');
      const file = event.target.files?.[0];
      if (file) {
        clientLogger.info('File selected.', { fileName: file.name, fileSize: file.size });
        setFileName(file.name);

        if (previewRef.current && previewRef.current.startsWith('blob:')) {
          clientLogger.info('Revoking existing blob URL from previewRef.current.', { url: previewRef.current });
          URL.revokeObjectURL(previewRef.current);
        }
        const blobUrl = URL.createObjectURL(file);
        clientLogger.info('Created new blob URL.', { blobUrl });
        setPreviewUrl(blobUrl);
        previewRef.current = blobUrl; 
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64DataUri = reader.result as string;
          clientLogger.info('File read as base64 Data URI.', { dataUriLength: base64DataUri.length });
          if (onUpload) {
            onUpload(file, base64DataUri); 
          }
        };
        reader.onerror = () => {
          clientLogger.error("Error reading file as base64 data URI");
          if (onUpload) {
            onUpload(file, null); 
          }
        };
        reader.readAsDataURL(file);

      } else { 
        clientLogger.info('No file selected or selection cancelled.');
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
          clientLogger.info('Revoking existing blob URL from previewRef.current due to no file selection.', { url: previewRef.current });
          URL.revokeObjectURL(previewRef.current);
        }
        
        const newPreview = initialPreviewUrl || null;
        clientLogger.info('Setting preview URL based on initialPreviewUrl after no file selection.', { newPreview });
        setPreviewUrl(newPreview);
        previewRef.current = newPreview;
        setFileName(null);
        if (onUpload) {
          onUpload(null, null); 
        }
      }
    },
    [onUpload, initialPreviewUrl], 
  );

  const handleRemove = useCallback(() => {
    clientLogger.info('handleRemove called.');
    if (previewRef.current && previewRef.current.startsWith('blob:')) {
      clientLogger.info('Revoking blob URL from previewRef.current during remove.', { url: previewRef.current });
      URL.revokeObjectURL(previewRef.current);
    }
    
    // When explicitly removing, we want to show null (or the placeholder)
    // unless the initialPreviewUrl was itself null, in which case it's already fine.
    // If initialPreviewUrl existed, setting previewUrl to null means "show placeholder instead of initial".
    clientLogger.info('Setting previewUrl to null due to explicit remove.');
    setPreviewUrl(null); 
    previewRef.current = null; // Reflect that the current intention is "no preview"
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    if (onUpload) {
        onUpload(null, null); 
    }
  }, [onUpload]); 

  // Cleanup effect for blob URLs
  useEffect(() => {
    const currentBlobUrl = previewRef.current; 
    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
        clientLogger.info('Cleaning up blob URL on unmount.', { url: currentBlobUrl });
        URL.revokeObjectURL(currentBlobUrl);
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
    setPreviewUrlDirectly: setPreviewUrl, // Expose for direct manipulation if needed
    previewRef, // Expose ref for components like ProfileBannerUploader to potentially inspect
  };
}
