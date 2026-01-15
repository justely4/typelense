/**
 * Turbo monorepo detector
 */

import type { PackageInfo } from "../types";
import { BaseDetector } from "./base-detector";
import { NpmDetector } from "./npm-detector";
import { PnpmDetector } from "./pnpm-detector";

export class TurboDetector extends BaseDetector {
	name = "turbo" as const;

	private npmDetector = new NpmDetector();
	private pnpmDetector = new PnpmDetector();

	async detect(rootPath: string): Promise<boolean> {
		const hasTurboJson = this.fileExists(
			this.resolvePath(rootPath, "turbo.json"),
		);
		if (!hasTurboJson) return false;

		// Check if it also has workspace configuration
		const hasWorkspaces =
			(await this.npmDetector.detect(rootPath)) ||
			(await this.pnpmDetector.detect(rootPath));

		return hasWorkspaces;
	}

	async getPackages(rootPath: string): Promise<PackageInfo[]> {
		// Turbo uses the underlying package manager's workspace configuration
		const isPnpm = await this.pnpmDetector.detect(rootPath);

		if (isPnpm) {
			return this.pnpmDetector.getPackages(rootPath);
		}

		return this.npmDetector.getPackages(rootPath);
	}
}
