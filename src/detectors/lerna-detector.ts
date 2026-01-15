/**
 * Lerna monorepo detector
 */

import path from "node:path";
import { Glob } from "bun";
import type { PackageInfo } from "../types";
import { BaseDetector } from "./base-detector";

interface LernaJson {
	packages?: string[];
	version?: string;
}

export class LernaDetector extends BaseDetector {
	name = "lerna" as const;

	async detect(rootPath: string): Promise<boolean> {
		return this.fileExists(this.resolvePath(rootPath, "lerna.json"));
	}

	async getPackages(rootPath: string): Promise<PackageInfo[]> {
		const lernaJsonPath = this.resolvePath(rootPath, "lerna.json");
		const lernaJson = await this.readJSON<LernaJson>(lernaJsonPath);

		if (!lernaJson) {
			return [];
		}

		const packagePatterns = lernaJson.packages || ["packages/*"];
		const packages: PackageInfo[] = [];

		for (const pattern of packagePatterns) {
			const glob = new Glob(path.join(pattern, "package.json"));

			for await (const file of glob.scan({ cwd: rootPath })) {
				const packagePath = path.dirname(path.resolve(rootPath, file));
				const pkgJson = await this.readJSON<{ name: string; version?: string }>(
					path.resolve(rootPath, file),
				);

				if (pkgJson?.name) {
					packages.push({
						name: pkgJson.name,
						path: packagePath,
						version: pkgJson.version,
					});
				}
			}
		}

		return packages;
	}
}
