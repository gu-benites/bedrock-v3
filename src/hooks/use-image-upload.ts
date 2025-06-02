
import { useCallback, useEffect, useRef, useState } from "react";

// Placeholder for a client-side logger
const clientLogger = {
  info: (message: string, context?: any) => console.log(`[useImageUploadINFO] ${message}`, context),
  warn: (message: string, context?: any) => console.warn(`[useImageUploadWARN] ${message}`, context),
  error: (message: string, context?: any) => console.error(`[useImageUploadERROR] ${message}`, context),
};

interface UseImageUploadOptions {
  onUpload?: (file: File | null, dataUrl: string | null) => void; 
  initialPreviewUrl?: string | null;
}

export function useImageUpload({ onUpload, initialPreviewUrl = null }: UseImageUploadOptions = {}) {
  clientLogger.info('Hook initialized.', { initialPreviewUrlProp: initialPreviewUrl });
  
  // State for the URL to be displayed in the preview (can be blob or actual URL)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  // Ref to store the original initialPreviewUrl prop for comparison if it changes
  const initialPropRef = useRef<string | null>(initialPreviewUrl);
  // Ref to store the current blob URL if one is active, for cleanup
  const currentBlobUrlRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  // New state to explicitly track if a user has selected a file
  const [userSelectedFile, setUserSelectedFile] = useState<File | null>(null);


  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      clientLogger.info('handleFileChange triggered.');
      const file = event.target.files?.[0];

      // Revoke any existing blob URL first
      if (currentBlobUrlRef.current) {
        clientLogger.info('Revoking existing blob URL from currentBlobUrlRef in handleFileChange.', { url: currentBlobUrlRef.current });
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      if (file) {
        clientLogger.info('File selected.', { fileName: file.name, fileSize: file.size });
        setFileName(file.name);
        setUserSelectedFile(file); // Mark that a user file is now active

        const newBlobUrl = URL.createObjectURL(file);
        clientLogger.info('Created new blob URL.', { newBlobUrl });
        setPreviewUrl(newBlobUrl); // Show blob preview
        currentBlobUrlRef.current = newBlobUrl; // Store it for potential cleanup
        
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
        setFileName(null);
        setUserSelectedFile(null); // No user file active
        // If no file is selected, previewUrl will be handled by the useEffect below,
        // reverting to initialPreviewUrl.
        if (onUpload) {
          onUpload(null, null); 
        }
      }
    },
    [onUpload], 
  );

  const handleRemove = useCallback(() => {
    clientLogger.info('handleRemove called.');
    if (currentBlobUrlRef.current) {
      clientLogger.info('Revoking blob URL from currentBlobUrlRef during remove.', { url: currentBlobUrlRef.current });
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    
    setFileName(null);
    setUserSelectedFile(null); // No user file active after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    // previewUrl will be updated by the useEffect to reflect initialPreviewUrl
    if (onUpload) {
        onUpload(null, null); // Signal removal to the form
    }
  }, [onUpload]); 

  // Effect to manage preview based on initialPreviewUrl and userSelectedFile
  useEffect(() => {
    clientLogger.info('Effect [initialPreviewUrl, userSelectedFile] running.', {
      initialPreviewUrl,
      hasUserSelectedFile: !!userSelectedFile,
      currentPreviewUrlState: previewUrl, // Current state value of previewUrl
      initialPropRefValue: initialPropRef.current,
    });

    if (userSelectedFile) {
      // If a user has selected a file, handleFileChange already set the blob preview.
      // This effect should not interfere if the blob URL is already set.
      if (!previewUrl?.startsWith('blob:')) {
        clientLogger.warn('User selected file exists, but previewUrl is not a blob. This is unexpected here.');
        // This state implies handleFileChange might not have completed or was overridden.
        // For safety, if userSelectedFile exists, force blob (though ideally handleFileChange is sole source for blob)
        // This part is tricky, normally handleFileChange is authoritative for blob.
      } else {
         clientLogger.info('User file selected. Preview is already a blob URL.', { previewUrl });
      }
    } else {
      // No user file is selected (initial state, or after removal/cancel).
      // Preview should match initialPreviewUrl.
      if (initialPreviewUrl !== previewUrl) { // Only update if different to avoid re-renders
        clientLogger.info('No user file selected. Syncing previewUrl with initialPreviewUrl.', {
          newPreview: initialPreviewUrl,
          oldPreview: previewUrl,
        });
        // If the current previewUrl is a blob, revoke it as we are switching away from it.
        if (previewUrl && previewUrl.startsWith('blob:')) {
           clientLogger.info('Revoking existing blob URL as initialPreviewUrl takes precedence.', { url: previewUrl });
           URL.revokeObjectURL(previewUrl); // Make sure to revoke the state value
           if (currentBlobUrlRef.current === previewUrl) { // And clear ref if it was this blob
             currentBlobUrlRef.current = null;
           }
        }
        setPreviewUrl(initialPreviewUrl);
      } else {
         clientLogger.info('No user file selected. previewUrl already matches initialPreviewUrl (or both null/same).', { initialPreviewUrl, previewUrl });
      }
    }
    
    // Update the ref if initialPreviewUrl prop itself has changed
    if (initialPreviewUrl !== initialPropRef.current) {
        clientLogger.info('initialPreviewUrl prop changed. Updating initialPropRef.', { newInitial: initialPreviewUrl, oldInitial: initialPropRef.current});
        initialPropRef.current = initialPreviewUrl;
    }

  }, [initialPreviewUrl, userSelectedFile, previewUrl]); // Added previewUrl to ensure re-evaluation if it's changed by other means.

  // Cleanup effect specifically for the currentBlobUrlRef on unmount
  useEffect(() => {
    const blobToClean = currentBlobUrlRef.current; 
    return () => {
      if (blobToClean && blobToClean.startsWith('blob:')) {
        clientLogger.info('Cleaning up blob URL from currentBlobUrlRef on unmount.', { url: blobToClean });
        URL.revokeObjectURL(blobToClean);
      }
    };
  }, []); // Runs only on unmount

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleTriggerClick,
    handleFileChange,
    handleRemove,
    // No setPreviewUrlDirectly, state should be managed internally or via initial prop + user actions
  };
}
