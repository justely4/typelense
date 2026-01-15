/**
 * TSV file generator for TypeScript errors
 */

import { mkdir, writeFile, cp, stat, readFile } from "node:fs/promises";

// ... existing TsvGenerator class and other functions ...

/**
 * Generate a single-file HTML report with all assets inlined
 */
async function generateSingleFileHtml(
	errors: TypeScriptError[],
	metadata: RunMetadata,
	outputDir: string,
): Promise<void> {
	let currentDir = __dirname;
	let templatesDir = "";

	// Try to find templates directory by walking up (up to 3 levels)
	for (let i = 0; i < 3; i++) {
		const candidate = path.join(currentDir, "templates");
		try {
			const stats = await stat(candidate);
			if (stats.isDirectory()) {
				templatesDir = candidate;
				break;
			}
		} catch (e) {}
		currentDir = path.dirname(currentDir);
	}

	if (!templatesDir) return;

	try {
		const assetsDir = path.join(templatesDir, "assets");
		const htmlPath = path.join(templatesDir, "index.html");

		// Read all template files
		let htmlContent = await readFile(htmlPath, "utf-8");
		const files = await readdir(assetsDir);

		const cssFile = files.find((f) => f.endsWith(".css"));
		const jsFiles = files.filter((f) => f.endsWith(".js"));
		const vendorFile = jsFiles.find((f) => f.includes("vendor"));
		const indexFile = jsFiles.find((f) => !f.includes("vendor"));

		// Inline CSS
		if (cssFile) {
			const cssContent = await readFile(path.join(assetsDir, cssFile), "utf-8");
			htmlContent = htmlContent.replace(
				/<link rel="stylesheet"[^>]+>/,
				`<style>${cssContent}</style>`,
			);
		}

		// Prepare JS
		if (vendorFile && indexFile) {
			const vendorContent = await readFile(
				path.join(assetsDir, vendorFile),
				"utf-8",
			);
			const indexContent = await readFile(
				path.join(assetsDir, indexFile),
				"utf-8",
			);

			// Extract mapping from vendor export
			const exportMatch = vendorContent.match(/export\{([^}]+)\}/);
			const importMatch = indexContent.match(/import\{([^}]+)\}from"[^"]+"/);

			if (exportMatch && importMatch) {
				const vendorExports: Record<string, string> = {};
				for (const item of exportMatch[1].split(",")) {
					const [local, exported] = item.trim().split(" as ");
					vendorExports[exported || local] = local;
				}

				const mappings: string[] = [];
				for (const item of importMatch[1].split(",")) {
					const [exported, local] = item.trim().split(" as ");
					const vendorLocal = vendorExports[exported];
					if (vendorLocal) {
						mappings.push(`const ${local || exported} = ${vendorLocal};`);
					}
				}

				const combinedJs = `
// Vendor
${vendorContent.replace(/export\{[^}]+\};?$/, "")}
// Mappings
${mappings.join("\n")}
// Index
${indexContent.replace(/import\{[^}]+\}from"[^"]+";?/, "")}
                `;

				htmlContent = htmlContent.replace(
					/<script type="module" crossorigin src="[^"]+"><\/script>/,
					`<script>${combinedJs}</script>`,
				);
				// Remove modulepreloads
				htmlContent = htmlContent.replace(/<link rel="modulepreload"[^>]+>/g, "");
			}
		}

		// Inject data
		const tsvGenerator = new TsvGenerator();
		const headers = [
			"id",
			"package_name",
			"file_name",
			"error_code",
			"description",
		];
		const rows: string[] = [headers.join("\t")];
		for (const error of errors) {
			const row = [
				error.id.toString(),
				error.packageName.replace(/\t/g, " "),
				error.fileName.replace(/\t/g, " "),
				error.errorCode.toString(),
				error.description.replace(/\t/g, " "),
			];
			rows.push(row.join("\t"));
		}
		const tsvContent = rows.join("\n");

		htmlContent = htmlContent.replace(
			/window\.__TS_ERROR_DATA__ = ``;/,
			`window.__TS_ERROR_DATA__ = \`${tsvContent.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;`,
		);

		await writeFile(path.join(outputDir, "index.html"), htmlContent, "utf-8");
	} catch (error) {
		console.warn("Failed to generate inlined HTML:", error);
	}
}
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { OutputGenerator, RunMetadata, TypeScriptError } from "../types";

// Get the directory where this module is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TsvGenerator implements OutputGenerator {
	async generate(errors: TypeScriptError[], outputPath: string): Promise<void> {
		const headers = [
			"id",
			"package_name",
			"file_name",
			"error_code",
			"description",
		];
		const rows: string[] = [headers.join("\t")];

		for (const error of errors) {
			const row = [
				error.id.toString(),
				this.escapeField(error.packageName),
				this.escapeField(error.fileName),
				error.errorCode.toString(),
				this.escapeField(error.description),
			];
			rows.push(row.join("\t"));
		}

		const content = rows.join("\n");
		await writeFile(outputPath, content, "utf-8");
	}

	private escapeField(field: string): string {
		// Escape tabs, newlines, and carriage returns in TSV fields
		return field.replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, "");
	}
}

/**
 * Generate timestamped output folder path
 */
export function generateOutputPath(baseDir: string): string {
	const now = new Date();
	const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
	const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
	const folderName = `${date}-${time}`;
	return path.join(baseDir, ".typelense",folderName);
}

/**
 * Copy template files from package to output directory
 */
async function copyTemplateFiles(outputDir: string): Promise<void> {
	// Find the templates folder relative to the package root
	// We look for the templates folder by walking up from __dirname
	let currentDir = __dirname;
	let templatesDir = "";

	// Try to find templates directory by walking up (up to 3 levels)
	for (let i = 0; i < 3; i++) {
		const candidate = path.join(currentDir, "templates");
		try {
			const stats = await stat(candidate);
			if (stats.isDirectory()) {
				templatesDir = candidate;
				break;
			}
		} catch (e) {
			// Not found at this level
		}
		currentDir = path.dirname(currentDir);
	}

	if (!templatesDir) {
		// If templates folder doesn't exist, silently continue
		// This allows the tool to work even if templates are not present
		return;
	}

	try {
		// Copy all files from templates/ to output directory recursively
		await cp(templatesDir, outputDir, { recursive: true });
	} catch (error) {
		console.warn(
			`Warning: Failed to copy templates from ${templatesDir}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Generate TSV file and metadata in a timestamped folder
 */
export async function generateTSVWithMetadata(
	errors: TypeScriptError[],
	metadata: RunMetadata,
	baseDir: string,
	web = false,
): Promise<string> {
	const outputDir = generateOutputPath(baseDir);

	// Create output directory
	await mkdir(outputDir, { recursive: true });

	// Copy template files first
	if (web) {
		await copyTemplateFiles(outputDir);
	}

	// Generate TSV file
	const tsvPath = path.join(outputDir, "errors.tsv");
	const generator = new TsvGenerator();
	await generator.generate(errors, tsvPath);

	// Generate metadata.json
	const metadataPath = path.join(outputDir, "metadata.json");
	const metadataContent = JSON.stringify(metadata, null, 2);
	await writeFile(metadataPath, metadataContent, "utf-8");

	return outputDir;
}

/**
 * Export convenience function
 */
export async function generateTSV(
	errors: TypeScriptError[],
	outputPath: string,
): Promise<void> {
	const generator = new TsvGenerator();
	return generator.generate(errors, outputPath);
}
