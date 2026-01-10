/**
 * Link components from store snapshot to plugin directory.
 *
 * WHY: Hardlinks are the most efficient way to copy files when
 * source and destination are on the same filesystem. They avoid
 * duplicating data while providing independent file entries.
 */

import { join, dirname } from "node:path";
import { mkdir, readdir, stat, link, readlink, symlink } from "node:fs/promises";
import { linkOrCopy } from "@agent-spaces/core";

/**
 * Component directories that should be linked from snapshot to plugin.
 */
export const COMPONENT_DIRS = [
	"commands",
	"skills",
	"agents",
	"hooks",
	"scripts",
	"mcp",
] as const;

export type ComponentDir = (typeof COMPONENT_DIRS)[number];

/**
 * Options for linking operations.
 */
export interface LinkOptions {
	/** Use copy instead of hardlink (for cross-device) */
	forceCopy?: boolean | undefined;
}

/**
 * Link a single file from source to destination.
 * Creates parent directories as needed.
 */
export async function linkFile(
	srcPath: string,
	destPath: string,
	options: LinkOptions = {}
): Promise<void> {
	// Ensure destination directory exists
	await mkdir(dirname(destPath), { recursive: true });

	// Use linkOrCopy from core for cross-device fallback
	await linkOrCopy(srcPath, destPath);
}

/**
 * Link a directory tree from source to destination.
 * Recreates the directory structure with hardlinks to files.
 */
export async function linkDirectory(
	srcDir: string,
	destDir: string,
	options: LinkOptions = {}
): Promise<void> {
	await mkdir(destDir, { recursive: true });

	const entries = await readdir(srcDir, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = join(srcDir, entry.name);
		const destPath = join(destDir, entry.name);

		if (entry.isDirectory()) {
			await linkDirectory(srcPath, destPath, options);
		} else if (entry.isFile()) {
			await linkFile(srcPath, destPath, options);
		} else if (entry.isSymbolicLink()) {
			// Preserve symlinks
			const target = await readlink(srcPath);
			await symlink(target, destPath);
		}
	}
}

/**
 * Link all component directories from a snapshot to a plugin directory.
 */
export async function linkComponents(
	snapshotDir: string,
	pluginDir: string,
	options: LinkOptions = {}
): Promise<string[]> {
	const linked: string[] = [];

	for (const component of COMPONENT_DIRS) {
		const srcDir = join(snapshotDir, component);
		const destDir = join(pluginDir, component);

		try {
			const stats = await stat(srcDir);
			if (stats.isDirectory()) {
				await linkDirectory(srcDir, destDir, options);
				linked.push(component);
			}
		} catch {
			// Component doesn't exist in snapshot, skip
		}
	}

	return linked;
}

/**
 * Check if a path exists and is a directory.
 */
export async function isDirectory(path: string): Promise<boolean> {
	try {
		const stats = await stat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Check which components exist in a snapshot.
 */
export async function getAvailableComponents(
	snapshotDir: string
): Promise<ComponentDir[]> {
	const available: ComponentDir[] = [];

	for (const component of COMPONENT_DIRS) {
		const dir = join(snapshotDir, component);
		if (await isDirectory(dir)) {
			available.push(component);
		}
	}

	return available;
}
