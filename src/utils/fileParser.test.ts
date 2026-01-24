import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getFileExtension,
    validateFileType,
    validateFileSize,
    formatFileSize,
    readTextFile,
    MAX_FILE_SIZE
} from './fileParser';

describe('fileParser utilities', () => {
    describe('getFileExtension', () => {
        it('should extract extension from filename', () => {
            expect(getFileExtension('test.txt')).toBe('.txt');
            expect(getFileExtension('readme.md')).toBe('.md');
            expect(getFileExtension('archive.tar.gz')).toBe('.gz');
        });

        it('should handle filenames without extension', () => {
            expect(getFileExtension('makefile')).toBe('');
            expect(getFileExtension('dockerfile')).toBe('');
        });

        it('should normalize to lowercase', () => {
            expect(getFileExtension('TEST.TXT')).toBe('.txt');
            expect(getFileExtension('Doc.MD')).toBe('.md');
        });
    });

    describe('validateFileType', () => {
        it('should accept supported file types', () => {
            const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
            const mdFile = new File(['content'], 'test.md', { type: 'text/markdown' });

            expect(validateFileType(txtFile)).toBe(true);
            expect(validateFileType(mdFile)).toBe(true);
        });

        it('should reject unsupported file types', () => {
            const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
            const docFile = new File(['content'], 'test.docx', { type: 'application/docx' });

            expect(validateFileType(pdfFile)).toBe(false);
            expect(validateFileType(docFile)).toBe(false);
        });
    });

    describe('validateFileSize', () => {
        it('should accept files within size limit', () => {
            const smallFile = { size: 1024 } as File; // 1KB
            expect(validateFileSize(smallFile)).toBe(true);
        });

        it('should reject files exceeding size limit', () => {
            const largeFile = { size: MAX_FILE_SIZE + 1 } as File;
            expect(validateFileSize(largeFile)).toBe(false);
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
            expect(formatFileSize(1500)).toBe('1.46 KB');
        });
    });

    // Note: Testing readTextFile requires mocking FileReader which is complex in this environment
    // We typically assume the browser API works and test logic around it
});
