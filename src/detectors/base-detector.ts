/**
 * Base detector class for monorepo detection
 */

import { existsSync } from "node:fs";
import path from "node:path";
import type { MonorepoDetector, MonorepoType, PackageInfo } from "../types";

export abstract class BaseDetector implements MonorepoDetector {
	abstract name: MonorepoType;

	abstract detect(rootPath: string): Promise<boolean>;

	abstract getPackages(rootPath: string): Promise<PackageInfo[]>;

	protected fileExists(filePath: string): boolean {
		return existsSync(filePath);
	}

	protected async readJSON<T>(filePath: string): Promise<T | null> {
		try {
			const file = Bun.file(filePath);
			return await file.json();
		} catch {
			return null;
		}
	}

	protected resolvePath(rootPath: string, ...paths: string[]): string {
		return path.resolve(rootPath, ...paths);
	}
}
