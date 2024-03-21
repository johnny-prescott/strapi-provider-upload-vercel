import { put, del } from '@vercel/blob';
import { ReadStream } from 'fs';

/**
 * Plugin options.
 */
interface Options {
	token: string;
	addRandomSuffix?: boolean;
	cacheControlMaxAge?: number;
}

/**
 * File from Strapi.
 */
interface File {
	name: string;
	alternativeText?: string;
	caption?: string;
	width?: number;
	height?: number;
	formats?: Record<string, unknown>;
	hash: string;
	ext?: string;
	mime: string;
	size: number;
	url: string;
	previewUrl?: string;
	path?: string;
	provider?: string;
	provider_metadata?: Record<string, unknown>;
	stream?: ReadStream;
	buffer?: Buffer;
}

export = {
	init(options: Options) {
		return {
			/**
			 * Uploads a file to Vercel's blob storage.
			 *
			 * @param file
			 * @see: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
			 */
			uploadVercelBlob(file: File): Promise<void> {
				return new Promise((resolve, reject) => {
					put(`${file.hash}${file.ext}`, file.buffer || file.stream, {
						access: 'public',
						contentType: file.mime,
						token: options.token,
						cacheControlMaxAge: options.cacheControlMaxAge ?? 31536000, // Year in seconds.
					})
						.then((result) => {
							file.url = result.url;
							file.previewUrl = result.url;
							file.mime = result.contentType;
							file.path = result.pathname;
							resolve();
						})
						.catch((err) => {
							reject(err);
						});
				});
			},
			/**
			 *	Upload a file buffer to Vercel.
			 *
			 * @param file
			 */
			upload(file: File): Promise<void> {
				if (!file.buffer) {
					return Promise.reject(new Error('Missing file buffer'));
				}
				return this.uploadVercelBlob(file);
			},
			/**
			 * Upload a file stream to vercel.
			 *
			 * @param file
			 */
			uploadStream(file: File): Promise<void> {
				if (!file.stream) {
					return Promise.reject(new Error('Missing file stream'));
				}
				return this.uploadVercelBlob(file);
			},
			/**
			 * Deletes the file from the Vercel blob store.
			 *
			 * @param file
			 */
			delete(file: File): Promise<void> {
				return del(file.url);
			},
			/**
			 * Ensure the file does not exceed the Vercel upload limit.
			 *
			 * @param file
			 * @remarks This requires a bit more work to implement, but it allows you to upload files up to 500 MB.
			 */
			checkFileSize(file: File) {
				var maxUploadSizeInMB = 500, kBytesToMegaBytes = function (kBytes) { return kBytes / 1000; };
                if (kBytesToMegaBytes(file.size) > maxUploadSizeInMB) {
                    throw new Error("".concat(file.name, " is ", kBytesToMegaBytes(file.size).toString(), "mb and exceeds size limit of ").concat(maxUploadSizeInMB.toString(), "mb'}."));
                }
			},
			/**
			 * Private is not currently supported by Vercel but is planned.
			 *
			 * @see: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
			 */
			getSignedUrl() {
				// (optional)
				// Generate a signed URL for the given file.
				// The signed URL allows secure access to the file.
				// Only Content Manager assets will be signed.
				// Returns an object {url: string}.
			},
			/**
			 * Private is not currently supported by Vercel but is planned.
			 *
			 * @see: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk
			 */
			isPrivate() {
				// (optional)
				// if it is private, file urls will be signed
				// Returns a boolean
			},
		};
	},
};
