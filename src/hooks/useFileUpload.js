import { useState } from 'react';

export const useFileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const validateFile = (file, options = {}) => {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        } = options;

        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }

        return true;
    };

    const uploadFile = async (file, options = {}) => {
        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            validateFile(file, options);

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            // Convert to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            clearInterval(progressInterval);
            setProgress(100);

            const fileData = {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
                uploadedAt: new Date().toISOString(),
            };

            setUploading(false);
            return { file: fileData, error: null };
        } catch (err) {
            setError(err.message);
            setUploading(false);
            return { file: null, error: err };
        }
    };

    const uploadMultiple = async (files, options = {}) => {
        const results = [];

        for (const file of files) {
            const result = await uploadFile(file, options);
            results.push(result);
        }

        return results;
    };

    const downloadFile = (fileData) => {
        try {
            const link = document.createElement('a');
            link.href = fileData.data;
            link.download = fileData.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading file:', err);
        }
    };

    return {
        uploading,
        progress,
        error,
        uploadFile,
        uploadMultiple,
        downloadFile,
        validateFile,
    };
};
