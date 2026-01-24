/**
 * File parser utilities for reading and extracting text from various file formats
 * V1 Supports: .txt, .md
 * P2 Future: .pdf
 */

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.txt', '.md'] as const;
export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
}

/**
 * Validate if file type is supported
 */
export function validateFileType(file: File): boolean {
    const extension = getFileExtension(file.name);
    return SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
    return file.size <= MAX_FILE_SIZE;
}

/**
 * Read plain text file (.txt)
 */
export async function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const content = event.target?.result as string;
            resolve(content);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read text file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Read markdown file (.md)
 * For now, this is the same as reading a text file
 * In the future, we could add markdown parsing/stripping
 */
export async function readMarkdownFile(file: File): Promise<string> {
    return readTextFile(file);
}

/**
 * Read file based on its extension
 */
export async function readFile(file: File): Promise<string> {
    // Validate file type
    if (!validateFileType(file)) {
        throw new Error(
            `Unsupported file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
        );
    }

    // Validate file size
    if (!validateFileSize(file)) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    const extension = getFileExtension(file.name);

    switch (extension) {
        case '.txt':
            return readTextFile(file);
        case '.md':
            return readMarkdownFile(file);
        default:
            throw new Error(`Unsupported file extension: ${extension}`);
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
